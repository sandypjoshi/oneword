#!/usr/bin/env node

/**
 * Reprocess all words in the database with improved prompts
 * This script will update definitions, OWAD phrases, and distractors for all words
 */

const { createClient } = require('@supabase/supabase-js');
const definitionGenerator = require('./generators/definition-generator');
const owadGenerator = require('./generators/owad-generator');
const distractorGenerator = require('./generators/distractor-generator');
const logger = require('./utils/logger');
const config = require('./config');
const path = require('path');
const fs = require('fs');

// Initialize Supabase client
const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_KEY
);

// Create stats directory if it doesn't exist
const statsDir = path.join(__dirname, 'stats');
if (!fs.existsSync(statsDir)) {
  fs.mkdirSync(statsDir, { recursive: true });
}

// Processing stats
const stats = {
  totalWords: 0,
  processedWords: 0,
  definitionsUpdated: 0,
  owadPhrasesUpdated: 0,
  distractorsUpdated: 0,
  errors: 0,
  errorWords: [],
  startTime: Date.now(),
  batches: [],
  currentBatch: 0
};

// Save stats to file
function saveStats() {
  const statsPath = path.join(statsDir, `reprocess-stats-${Date.now()}.json`);
  stats.endTime = Date.now();
  stats.totalTimeMs = stats.endTime - stats.startTime;
  stats.totalTimeMin = Math.round(stats.totalTimeMs / 60000);
  
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  logger.info(`Stats saved to ${statsPath}`);
}

/**
 * Fetch words from database
 * @param {number} limit - Maximum number of words to fetch
 * @param {number} offset - Number of words to skip
 * @returns {Promise<Array>} - Array of word objects
 */
async function fetchWords(limit, offset = 0) {
  logger.info(`Fetching ${limit} words with offset ${offset}...`);
  
  const { data, error } = await supabase
    .from('app_words')
    .select('id, word, pos, short_definition, owad_phrase, distractors')
    .range(offset, offset + limit - 1)
    .order('id');
  
  if (error) {
    logger.error(`Error fetching words: ${error.message}`);
    throw error;
  }
  
  logger.info(`Fetched ${data.length} words`);
  return data;
}

/**
 * Count total words in database
 * @returns {Promise<number>} - Total number of words
 */
async function countWords() {
  const { count, error } = await supabase
    .from('app_words')
    .select('id', { count: 'exact', head: true });
  
  if (error) {
    logger.error(`Error counting words: ${error.message}`);
    throw error;
  }
  
  return count;
}

/**
 * Update a word in the database
 * @param {Object} word - Word object with updated fields
 * @returns {Promise<Object>} - Updated word object
 */
async function updateWord(word) {
  const { data, error } = await supabase
    .from('app_words')
    .update({
      short_definition: word.short_definition,
      definition_source: 'gemini_improved',
      definition_updated_at: new Date().toISOString(),
      owad_phrase: word.owad_phrase,
      distractors: word.distractors,
      updated_at: new Date().toISOString()
    })
    .eq('id', word.id)
    .select();
  
  if (error) {
    logger.error(`Error updating word ${word.word}: ${error.message}`);
    throw error;
  }
  
  return data[0];
}

/**
 * Process a batch of words
 * @param {Array} words - Array of word objects to process
 * @returns {Promise<Array>} - Array of processed word objects
 */
async function processBatch(words) {
  logger.info(`Processing batch of ${words.length} words...`);
  stats.currentBatch++;
  
  const batchStats = {
    batchNumber: stats.currentBatch,
    wordCount: words.length,
    definitionsUpdated: 0,
    owadPhrasesUpdated: 0,
    distractorsUpdated: 0,
    errors: 0,
    startTime: Date.now()
  };
  
  const processed = [];
  
  try {
    logger.info(`Sending batch request for ${words.length} words to definition generator...`);
    // Generate new definitions for ALL words in the batch with a single API request
    const withDefinitions = await definitionGenerator.generateDefinitions(words);
    
    logger.info(`Sending batch request for ${words.length} words to OWAD generator...`);
    // Generate new OWAD phrases for ALL words in the batch with a single API request
    const withOwad = await owadGenerator.generateOwadPhrases(withDefinitions);
    
    logger.info(`Sending batch request for ${words.length} words to distractor generator...`);
    // Generate new distractors for ALL words in the batch with a single API request
    const withDistractors = await distractorGenerator.generateDistractors(withOwad);
    
    // Now process and update each word
    for (let i = 0; i < withDistractors.length; i++) {
      const word = words[i];
      const updatedWord = withDistractors[i];
      
      logger.info(`Processing results for word ${i+1}/${words.length}: ${word.word} (${word.pos})`);
      
      try {
        // Check if anything changed
        const definitionChanged = updatedWord.short_definition !== word.short_definition;
        const owadChanged = JSON.stringify(updatedWord.owad_phrase) !== JSON.stringify(word.owad_phrase);
        const distractorsChanged = JSON.stringify(updatedWord.distractors) !== JSON.stringify(word.distractors);
        
        if (definitionChanged) batchStats.definitionsUpdated++;
        if (owadChanged) batchStats.owadPhrasesUpdated++;
        if (distractorsChanged) batchStats.distractorsUpdated++;
        
        // Update in database
        const savedWord = await updateWord(updatedWord);
        processed.push(savedWord);
        
        // Update global stats
        stats.processedWords++;
        if (definitionChanged) stats.definitionsUpdated++;
        if (owadChanged) stats.owadPhrasesUpdated++;
        if (distractorsChanged) stats.distractorsUpdated++;
        
        // Log progress
        if (i % 10 === 0 || i === words.length - 1) {
          logger.info(`Progress: ${stats.processedWords}/${stats.totalWords} words processed (${Math.round(stats.processedWords/stats.totalWords*100)}%)`);
        }
      } catch (error) {
        logger.error(`Error processing word ${word.word}: ${error.message}`);
        stats.errors++;
        stats.errorWords.push(word.word);
        batchStats.errors++;
      }
    }
  } catch (error) {
    // Handle batch-level errors
    logger.error(`Error processing batch: ${error.message}`);
    // Mark all words in this batch as errors
    for (const word of words) {
      stats.errors++;
      stats.errorWords.push(word.word);
      batchStats.errors++;
    }
  }
  
  // Finalize batch stats
  batchStats.endTime = Date.now();
  batchStats.elapsedTimeMs = batchStats.endTime - batchStats.startTime;
  batchStats.elapsedTimeMin = Math.round(batchStats.elapsedTimeMs / 60000 * 10) / 10;
  batchStats.definitionsUpdated = batchStats.definitionsUpdated;
  batchStats.owadPhrasesUpdated = batchStats.owadPhrasesUpdated;
  batchStats.distractorsUpdated = batchStats.distractorsUpdated;
  
  // Add to global stats
  stats.batches.push(batchStats);
  
  logger.info(`Batch ${stats.currentBatch} completed in ${batchStats.elapsedTimeMin} minutes`);
  logger.info(`Batch results: ${batchStats.definitionsUpdated} definitions, ${batchStats.owadPhrasesUpdated} OWAD phrases, ${batchStats.distractorsUpdated} distractors updated`);
  
  return processed;
}

/**
 * Main function to reprocess all words
 */
async function reprocessAllWords() {
  logger.info('=== STARTING REPROCESSING OF ALL WORDS ===');
  
  try {
    // Count total words
    stats.totalWords = await countWords();
    logger.info(`Found ${stats.totalWords} total words to process`);
    
    // Process in batches
    const BATCH_SIZE = config.BATCH_SIZE || 50;
    
    for (let offset = 0; offset < stats.totalWords; offset += BATCH_SIZE) {
      // Fetch batch
      const words = await fetchWords(BATCH_SIZE, offset);
      
      // Process batch
      await processBatch(words);
      
      // Save stats periodically
      if (stats.currentBatch % 5 === 0) {
        saveStats();
      }
      
      // Log overall progress
      const elapsedMin = Math.round((Date.now() - stats.startTime) / 60000);
      const wordsPerMinute = Math.round(stats.processedWords / elapsedMin);
      const remainingWords = stats.totalWords - stats.processedWords;
      const estimatedMinRemaining = Math.round(remainingWords / wordsPerMinute);
      
      logger.info(`Progress: ${stats.processedWords}/${stats.totalWords} words (${Math.round(stats.processedWords/stats.totalWords*100)}%)`);
      logger.info(`Speed: ${wordsPerMinute} words/minute, Est. time remaining: ${estimatedMinRemaining} minutes`);
      logger.info('-------------------------------------');
    }
    
    // Final stats
    logger.info('=== REPROCESSING COMPLETE ===');
    logger.info(`Processed ${stats.processedWords}/${stats.totalWords} words`);
    logger.info(`Updated ${stats.definitionsUpdated} definitions, ${stats.owadPhrasesUpdated} OWAD phrases, ${stats.distractorsUpdated} distractors`);
    logger.info(`Encountered ${stats.errors} errors`);
    
    // Save final stats
    saveStats();
    
  } catch (error) {
    logger.error(`Reprocessing failed: ${error.message}`);
    saveStats();
    process.exit(1);
  }
}

// Run the reprocessing
reprocessAllWords()
  .catch(err => {
    logger.error(`Script failed: ${err.message}`);
    saveStats();
    process.exit(1);
  }); 