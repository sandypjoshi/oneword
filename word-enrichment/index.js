#!/usr/bin/env node

const batchProcessor = require('./batch-processor');
const logger = require('./utils/logger');
const config = require('./config');
const db = require('./db');
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
const definitionGenerator = require('./generators/definition-generator');
const owadGenerator = require('./generators/owad-generator');
const distractorGenerator = require('./generators/distractor-generator');
const path = require('path');
const fs = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('test', {
    alias: 't',
    type: 'boolean',
    description: 'Run in test mode with limited words',
    default: false
  })
  .option('test-batch-size', {
    type: 'number',
    description: 'Number of words to process in test mode',
    default: config.TEST_BATCH_LIMIT
  })
  .option('resume', {
    alias: 'r',
    type: 'boolean',
    description: 'Resume from last saved progress',
    default: true // Set to true by default to always try to resume
  })
  .option('batch-size', {
    alias: 'b',
    type: 'number',
    description: 'Number of words to process in each batch',
    default: config.BATCH_SIZE
  })
  .help()
  .alias('help', 'h')
  .argv;

// Update batch size from command line if provided
const batchSize = argv['batch-size'];
const testMode = argv.test;
const testBatchSize = Math.min(argv['test-batch-size'], config.TEST_BATCH_LIMIT);
const resumeProcess = argv.resume;

// Create log directory if it doesn't exist
if (!fs.existsSync(config.LOG_DIR)) {
  fs.mkdirSync(config.LOG_DIR, { recursive: true });
}

/**
 * Main process function
 */
async function processWordEnrichment() {
  try {
    logger.info('Starting Word Enrichment Tool');
    logger.info(`Gemini Model: ${config.GEMINI_MODEL}`);
    logger.info(`Batch Size: ${batchSize}`);
    logger.info(`Using ${config.GEMINI_API_KEYS.length} API keys with rotation: ${config.ENABLE_KEY_ROTATION ? 'Enabled' : 'Disabled'}`);
    
    if (testMode) {
      logger.info(`Running in TEST MODE with ${testBatchSize} words`);
    }
    
    // Get total word count and remaining unprocessed count
    const totalWords = await db.countWords();
    const remainingWordsCount = await db.countUnprocessedWords();
    logger.info(`Found ${remainingWordsCount} words remaining to be processed out of ${totalWords} total words`);
    
    // Load progress if resuming
    let offset = 0;
    if (resumeProcess) {
      const progress = db.loadProgress();
      if (progress && progress.lastOffset) {
        offset = progress.lastOffset;
        logger.info(`Resuming from offset ${offset}`);
      }
    }
    
    // Process words in batches
    let processedCount = 0;
    
    while (true) {
      // Check if we've reached the test mode limit or no more words to process
      if ((testMode && processedCount >= testBatchSize) || processedCount >= remainingWordsCount) {
        break;
      }
      
      // Fetch next batch of words that need processing
      const currentBatchSize = testMode 
        ? Math.min(batchSize, testBatchSize - processedCount) 
        : batchSize;
        
      if (currentBatchSize <= 0) break;
      
      logger.info(`Fetching batch of ${currentBatchSize} unprocessed words...`);
      
      // The modified fetchWordBatch function will only return words that need processing
      const words = await db.fetchWordBatch(currentBatchSize, offset);
      
      if (!words || words.length === 0) {
        logger.info('No more words to process');
        break;
      }
      
      // Log the first few words in the batch for tracking
      const batchSummary = words.slice(0, 3).map(w => `${w.word} (${w.pos})`).join(', ');
      logger.info(`Processing batch with words: ${batchSummary}${words.length > 3 ? `, and ${words.length - 3} more` : ''}`);
      
      // Generate definitions, OWAD phrases, and distractors
      const enrichedWords = await enrichWords(words);
      
      // Update words in database
      await db.updateWordsBatch(enrichedWords);
      logger.info(`Database update completed for batch of ${words.length} words`);
      
      // Update progress
      processedCount += words.length;
      offset += words.length;
      
      // Save progress for resumption if stopped
      db.saveProgress({ lastOffset: offset, lastUpdate: new Date().toISOString() });
      
      // Calculate completion percentage based on remaining unprocessed words
      const completionPercentage = ((processedCount / remainingWordsCount) * 100).toFixed(2);
      logger.info(`Processed ${processedCount}/${remainingWordsCount} words so far (${completionPercentage}% complete)`);
      
      // Add a delay between batches to avoid rate limiting
      if (!testMode && processedCount < remainingWordsCount) {
        logger.info(`Waiting ${config.BATCH_PROCESSING_DELAY / 1000} seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, config.BATCH_PROCESSING_DELAY));
      }
    }
    
    logger.info(`Word enrichment completed. Processed ${processedCount} words in total.`);
    
  } catch (error) {
    logger.error(`Error in main process: ${error.message}`);
    console.error(error);
  }
}

// ... existing code ...