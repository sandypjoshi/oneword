#!/usr/bin/env node

/**
 * Regenerate All Word Content
 * 
 * This script will regenerate ALL definitions, OWAD phrases, and distractors for all words
 * in the database, using our enhanced generators with difficulty-based strategies.
 * It will replace existing values with new, improved ones.
 */
const batchProcessor = require('./batch-processor');
const logger = require('./utils/logger');
const config = require('./config');
const db = require('./db');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Initialize Supabase client
const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_KEY
);

// Create log directory if it doesn't exist
if (!fs.existsSync(config.LOG_DIR)) {
  fs.mkdirSync(config.LOG_DIR, { recursive: true });
}

// Create temp directory if it doesn't exist
if (!fs.existsSync(config.TEMP_DIR)) {
  fs.mkdirSync(config.TEMP_DIR, { recursive: true });
}

// Track API key usage
const keyUsage = new Map();
config.GEMINI_API_KEYS.forEach(key => {
  const maskedKey = key.substring(0, 6) + '...' + key.substring(key.length - 4);
  keyUsage.set(maskedKey, { requests: 0, errors: 0, lastUsed: null });
});

// Track performance metrics
const metrics = {
  startTime: Date.now(),
  totalWords: 0,
  processedWords: 0,
  successfulWords: 0,
  failedWords: 0,
  totalApiCalls: 0,
  definitionsGenerated: 0,
  owadPhrasesGenerated: 0,
  distractorsGenerated: 0,
  errorsByType: {},
  wordsPerMinute: 0
};

/**
 * Fetch ALL words for reprocessing, including those already processed
 * With optional difficulty range filtering
 * @param {number} limit - Number of words to fetch
 * @param {number} offset - Offset for pagination
 * @param {number} minDifficulty - Minimum difficulty score (optional)
 * @param {number} maxDifficulty - Maximum difficulty score (optional)
 * @returns {Promise<Array>} - Array of word objects
 */
async function fetchWordBatchForReprocessing(limit, offset = 0, minDifficulty = null, maxDifficulty = null) {
  try {
    let query = supabase
      .from('app_words')
      .select('id, word, pos, sense_count, source_word_id, difficulty_score, short_definition')
      .order('id', { ascending: true });
    
    // Apply difficulty filters if provided
    if (minDifficulty !== null) {
      query = query.gte('difficulty_score', minDifficulty);
    }
    
    if (maxDifficulty !== null) {
      query = query.lte('difficulty_score', maxDifficulty);
    }
    
    // Apply range for pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Error fetching words: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    throw new Error(`Error in fetchWordBatch: ${error.message}`);
  }
}

/**
 * Update performance metrics based on elapsed time
 */
function updatePerformanceMetrics() {
  const elapsedMinutes = (Date.now() - metrics.startTime) / 60000;
  metrics.wordsPerMinute = elapsedMinutes > 0 ? metrics.processedWords / elapsedMinutes : 0;
  
  const estimatedRemainingWords = metrics.totalWords - metrics.processedWords;
  const estimatedRemainingMinutes = metrics.wordsPerMinute > 0 ? estimatedRemainingWords / metrics.wordsPerMinute : 0;
  
  const hours = Math.floor(estimatedRemainingMinutes / 60);
  const minutes = Math.floor(estimatedRemainingMinutes % 60);
  
  return {
    wordsPerMinute: metrics.wordsPerMinute.toFixed(2),
    estimatedTimeRemaining: `${hours}h ${minutes}m`,
    successRate: ((metrics.successfulWords / metrics.processedWords) * 100).toFixed(1) + '%'
  };
}

/**
 * Log performance and progress statistics
 * @param {Object} performance - Performance metrics
 */
function logProgress(performance) {
  const progressPercent = ((metrics.processedWords / metrics.totalWords) * 100).toFixed(2);
  
  logger.info('===== REGENERATION PROGRESS =====');
  logger.info(`Progress: ${metrics.processedWords}/${metrics.totalWords} words (${progressPercent}%)`);
  logger.info(`Performance: ${performance.wordsPerMinute} words/minute`);
  logger.info(`Success rate: ${performance.successRate}`);
  logger.info(`Estimated time remaining: ${performance.estimatedTimeRemaining}`);
  logger.info(`API calls: ${metrics.totalApiCalls} (${(metrics.totalApiCalls / metrics.processedWords).toFixed(1)} per word)`);
  logger.info('==================================');
}

/**
 * Log key usage statistics
 */
function logKeyUsage() {
  logger.info('===== API KEY USAGE =====');
  for (const [key, usage] of keyUsage.entries()) {
    const lastUsedStr = usage.lastUsed ? new Date(usage.lastUsed).toLocaleTimeString() : 'Never';
    logger.info(`Key ${key}: ${usage.requests} requests, ${usage.errors} errors, Last used: ${lastUsedStr}`);
  }
  logger.info('=========================');
}

/**
 * Main process function
 */
async function regenerateAllWords() {
  try {
    logger.info('====================================================');
    logger.info('STARTING COMPLETE WORD CONTENT REGENERATION PROCESS');
    logger.info('====================================================');
    logger.info(`Using ${config.GEMINI_API_KEYS.length} API keys with rotation: ${config.ENABLE_KEY_ROTATION ? 'Enabled' : 'Disabled'}`);
    logger.info(`Batch Size: ${config.BATCH_SIZE}`);
    logger.info(`Model: ${config.GEMINI_MODEL}`);
    logger.info(`Processing Delay: ${config.BATCH_PROCESSING_DELAY / 1000}s between batches`);
    
    // Get total word count
    metrics.totalWords = await db.countWords();
    logger.info(`Found ${metrics.totalWords} total words to process`);
    
    // Process words in batches
    let offset = 0;
    
    while (metrics.processedWords < metrics.totalWords) {
      // Update and log performance metrics every 10 batches
      if (metrics.processedWords > 0 && metrics.processedWords % (config.BATCH_SIZE * 5) === 0) {
        const performance = updatePerformanceMetrics();
        logProgress(performance);
        logKeyUsage();
      }
      
      // Fetch next batch of words
      logger.info(`Fetching batch of ${config.BATCH_SIZE} words starting at offset ${offset}...`);
      
      const words = await fetchWordBatchForReprocessing(config.BATCH_SIZE, offset);
      
      if (!words || words.length === 0) {
        logger.info('No more words to process');
        break;
      }
      
      // Log the words being processed
      const batchSummary = words.slice(0, 3).map(w => {
        const diffLevel = w.difficulty_score ? 
          w.difficulty_score >= 0.6 ? 'VERY HARD' :
          w.difficulty_score >= 0.4 ? 'HARD' :
          w.difficulty_score >= 0.2 ? 'MEDIUM' : 'EASY' : 'Unknown';
          
        return `${w.word} (${w.pos}, ${diffLevel})`;
      }).join(', ');
      
      logger.info(`Processing batch with words: ${batchSummary}${words.length > 3 ? `, and ${words.length - 3} more` : ''}`);
      
      // Process batch with enrichment generators
      try {
        // Use batch processor to apply all generators
        const enrichedWords = await batchProcessor.processBatch(words, {
          processDefinitions: true,
          processOwadPhrases: true,
          processDistractors: true
        });
        
        // Update metrics
        metrics.processedWords += words.length;
        metrics.successfulWords += words.length;
        
        // Increment API call metrics (estimate based on generators usage)
        // Each word typically uses 1 call for definition, 1 for OWAD, 1 for distractors
        metrics.totalApiCalls += words.length * 3;
        metrics.definitionsGenerated += words.length;
        metrics.owadPhrasesGenerated += words.length;
        metrics.distractorsGenerated += words.length;
        
        // Update offset for next batch
        offset += words.length;
        
        // Log mini progress
        const progressPercent = Math.min(100, (metrics.processedWords / metrics.totalWords) * 100);
        logger.info(`Batch complete. Progress: ${metrics.processedWords}/${metrics.totalWords} (${progressPercent.toFixed(2)}%)`);
        
        // Add delay to avoid hitting rate limits
        logger.info(`Waiting ${config.BATCH_PROCESSING_DELAY/1000} seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, config.BATCH_PROCESSING_DELAY));
      } catch (error) {
        logger.error(`Error processing batch: ${error.message}`);
        metrics.processedWords += words.length;
        metrics.failedWords += words.length;
        
        // Track error type
        const errorType = error.message.includes('rate limit') ? 'Rate Limit' :
                          error.message.includes('timeout') ? 'Timeout' :
                          error.message.includes('parsing') ? 'Parsing Error' : 'Other';
                          
        metrics.errorsByType[errorType] = (metrics.errorsByType[errorType] || 0) + 1;
        
        // Increment offset to skip problematic batch
        offset += words.length;
        
        // Wait before continuing with longer delay after error
        logger.info(`Waiting ${config.RETRY_DELAY/1000} seconds before continuing...`);
        await new Promise(resolve => setTimeout(resolve, config.RETRY_DELAY));
      }
    }
    
    // Log final statistics
    const finalPerformance = updatePerformanceMetrics();
    logger.success(`Regeneration completed. Processed ${metrics.processedWords} words.`);
    logger.info(`Total successful: ${metrics.successfulWords}, Failed: ${metrics.failedWords}`);
    logger.info(`Total runtime: ${((Date.now() - metrics.startTime) / 60000).toFixed(1)} minutes`);
    logger.info(`Final processing rate: ${finalPerformance.wordsPerMinute} words/minute`);
    logger.info(`Total API calls: ${metrics.totalApiCalls}`);
    
    logKeyUsage();
  } catch (error) {
    logger.error(`Error in main process: ${error.message}`);
    process.exit(1);
  }
}

// Start the regeneration process
regenerateAllWords(); 