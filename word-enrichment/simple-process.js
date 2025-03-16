#!/usr/bin/env node

/**
 * Simple Word Enrichment Console Process
 * Processes words that don't already have definitions/phrases and outputs to console
 */
const config = require('./config');
const db = require('./db');
const definitionGenerator = require('./generators/definition-generator');
const owadGenerator = require('./generators/owad-generator');
const distractorGenerator = require('./generators/distractor-generator');
const path = require('path');
const fs = require('fs');

// Create log directory if it doesn't exist
if (!fs.existsSync(config.LOG_DIR)) {
  fs.mkdirSync(config.LOG_DIR, { recursive: true });
}

// ANSI color codes for prettier console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  
  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    crimson: "\x1b[38m"
  },
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
    crimson: "\x1b[48m"
  }
};

// Enhanced console logger
const log = {
  info: (msg) => console.log(`${colors.fg.cyan}[INFO]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.fg.red}[ERROR]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.fg.yellow}[WARN]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.fg.green}[SUCCESS]${colors.reset} ${msg}`),
  key: (key, msg) => console.log(`${colors.fg.magenta}[KEY ${key.substring(0, 6)}...]${colors.reset} ${msg}`),
  apiCall: (action, key) => {
    const shortKey = key.substring(0, 6) + '...' + key.substring(key.length - 4);
    console.log(`${colors.fg.blue}[API]${colors.reset} ${action} using key ${colors.bright}${shortKey}${colors.reset}`);
  },
  word: (word) => console.log(`  ${colors.fg.green}•${colors.reset} ${colors.bright}${word.word}${colors.reset} (${word.pos}) [ID: ${word.id}]`),
  phase: (phase) => console.log(`\n${colors.bg.blue}${colors.fg.white} ${phase} ${colors.reset}\n`),
  divider: () => console.log("\n" + "=".repeat(80) + "\n"),
  progressBar: (percent, width = 40) => {
    const filled = Math.round(width * (percent / 100));
    const empty = width - filled;
    const bar = colors.fg.green + "█".repeat(filled) + colors.fg.black + "█".repeat(empty) + colors.reset;
    const percentText = colors.bright + percent.toFixed(2) + "%" + colors.reset;
    console.log(`${bar} ${percentText}`);
  },
  stats: (stats) => {
    console.log("\n" + colors.bg.cyan + colors.fg.black + " PROGRESS STATS " + colors.reset + "\n");
    console.log(`${colors.bright}Processed:${colors.reset} ${stats.processed}/${stats.total} words (${stats.percent.toFixed(2)}%)`);
    console.log(`${colors.bright}Processing Rate:${colors.reset} ${stats.rate.toFixed(1)} words/minute`);
    console.log(`${colors.bright}Elapsed Time:${colors.reset} ${stats.elapsed}`);
    console.log(`${colors.bright}Estimated Time Remaining:${colors.reset} ${stats.remaining}`);
    console.log(`${colors.bright}API Requests:${colors.reset} ${stats.apiCalls} (Avg: ${stats.avgCallsPerWord.toFixed(1)} per word)`);
    
    // Show key usage
    console.log(`\n${colors.bright}API Key Usage:${colors.reset}`);
    Object.entries(stats.keyUsage).forEach(([key, count]) => {
      const shortKey = key.substring(0, 6) + '...' + key.substring(key.length - 4);
      const percent = ((count / stats.apiCalls) * 100).toFixed(1);
      console.log(`  ${colors.fg.magenta}${shortKey}${colors.reset}: ${count} requests (${percent}%)`);
    });
    
    log.progressBar(stats.percent);
    console.log("");
  }
};

// Stats tracking
const stats = {
  startTime: null,
  processed: 0,
  total: 0,
  remaining: 0,
  apiCalls: 0,
  keyUsage: {},
  batches: 0,
  errors: 0
};

// Initialize key tracking
config.GEMINI_API_KEYS.forEach(key => {
  stats.keyUsage[key] = 0;
});

/**
 * Main process function
 */
async function processWordEnrichment() {
  try {
    log.divider();
    log.info(`${colors.bright}Starting Word Enrichment (Enhanced Console Mode)${colors.reset}`);
    log.info(`Gemini Model: ${colors.bright}${config.GEMINI_MODEL}${colors.reset}`);
    log.info(`Batch Size: ${colors.bright}${config.BATCH_SIZE}${colors.reset}`);
    log.info(`Using ${colors.bright}${config.GEMINI_API_KEYS.length}${colors.reset} API keys with rotation: ${config.ENABLE_KEY_ROTATION ? colors.fg.green + 'Enabled' + colors.reset : colors.fg.red + 'Disabled' + colors.reset}`);
    log.divider();
    
    // Get total word count and remaining unprocessed count
    const totalWords = await db.countWords();
    const remainingWordsCount = await db.countUnprocessedWords();
    log.info(`Found ${colors.bright}${remainingWordsCount}${colors.reset} words remaining to be processed out of ${colors.bright}${totalWords}${colors.reset} total words`);
    
    // Update stats
    stats.startTime = new Date();
    stats.total = remainingWordsCount;
    stats.remaining = remainingWordsCount;
    
    // Process words in batches
    let processedCount = 0;
    let offset = 0;
    
    // Process until no more words need processing
    while (true) {
      stats.batches++;
      
      // Fetch next batch of words that need processing
      log.phase(`FETCHING BATCH #${stats.batches}`);
      log.info(`Fetching batch of ${config.BATCH_SIZE} unprocessed words...`);
      
      // The modified fetchWordBatch function will only return words that need processing
      const words = await db.fetchWordBatch(config.BATCH_SIZE, offset);
      
      if (!words || words.length === 0) {
        log.info('No more words to process');
        break;
      }
      
      // Log the words in the batch
      log.info(`Processing batch of ${colors.bright}${words.length}${colors.reset} words:`);
      words.slice(0, 5).forEach(word => log.word(word));
      if (words.length > 5) {
        log.info(`... and ${words.length - 5} more words`);
      }
      
      try {
        // Generate definitions
        log.phase("GENERATING DEFINITIONS");
        
        // Track API calls by patching the API client temporarily
        try {
          const originalApiCall = definitionGenerator.client ? definitionGenerator.client.call : null;
          
          if (originalApiCall) {
            definitionGenerator.client.call = async function(endpoint, options) {
              stats.apiCalls++;
              const apiKey = options.headers ? options.headers['x-goog-api-key'] : null;
              if (apiKey) {
                stats.keyUsage[apiKey] = (stats.keyUsage[apiKey] || 0) + 1;
                log.apiCall("Generating definitions", apiKey);
              }
              return originalApiCall.call(this, endpoint, options);
            };
          }
          
          const wordsWithDefs = await definitionGenerator.generateDefinitions(words);
          log.success(`Generated definitions for ${colors.bright}${words.length}${colors.reset} words`);
          
          // Generate OWAD phrases
          log.phase("GENERATING OWAD PHRASES");
          
          // Restore and patch OWAD generator
          if (originalApiCall) {
            definitionGenerator.client.call = originalApiCall;
          }
          
          const originalOwadCall = owadGenerator.client ? owadGenerator.client.call : null;
          if (originalOwadCall) {
            owadGenerator.client.call = async function(endpoint, options) {
              stats.apiCalls++;
              const apiKey = options.headers ? options.headers['x-goog-api-key'] : null;
              if (apiKey) {
                stats.keyUsage[apiKey] = (stats.keyUsage[apiKey] || 0) + 1;
                log.apiCall("Generating OWAD phrases", apiKey);
              }
              return originalOwadCall.call(this, endpoint, options);
            };
          }
          
          const wordsWithOwad = await owadGenerator.generateOwadPhrases(wordsWithDefs);
          log.success(`Generated OWAD phrases for ${colors.bright}${words.length}${colors.reset} words`);
          
          // Generate distractors
          log.phase("GENERATING DISTRACTORS");
          
          // Restore and patch distractor generator
          if (originalOwadCall) {
            owadGenerator.client.call = originalOwadCall;
          }
          
          const originalDistractorCall = distractorGenerator.client ? distractorGenerator.client.call : null;
          if (originalDistractorCall) {
            distractorGenerator.client.call = async function(endpoint, options) {
              stats.apiCalls++;
              const apiKey = options.headers ? options.headers['x-goog-api-key'] : null;
              if (apiKey) {
                stats.keyUsage[apiKey] = (stats.keyUsage[apiKey] || 0) + 1;
                log.apiCall("Generating distractors", apiKey);
              }
              return originalDistractorCall.call(this, endpoint, options);
            };
          }
          
          const fullyEnrichedWords = await distractorGenerator.generateDistractors(wordsWithOwad);
          log.success(`Generated distractors for ${colors.bright}${words.length}${colors.reset} words`);
          
          // Restore original call method
          if (originalDistractorCall) {
            distractorGenerator.client.call = originalDistractorCall;
          }
          
          // Update database
          log.phase("UPDATING DATABASE");
          await db.updateWordsBatch(fullyEnrichedWords);
          log.success(`Batch complete! Updated ${colors.bright}${words.length}${colors.reset} words in database`);
        } catch (error) {
          log.error(`Error in API call patch: ${error.message}`);
          throw error;
        }
        
      } catch (error) {
        log.error(`Error processing batch: ${error.message}`);
        stats.errors++;
        
        // Log the failed words for retry
        log.warn("Failed words in this batch:");
        words.forEach(word => log.word(word));
        
        // Wait a bit longer before next batch if there was an error
        await new Promise(resolve => setTimeout(resolve, config.RETRY_DELAY));
      }
      
      // Update progress
      processedCount += words.length;
      offset += words.length;
      stats.processed = processedCount;
      stats.remaining = remainingWordsCount - processedCount;
      
      // Calculate progress and rate
      const elapsedMinutes = (new Date() - stats.startTime) / 60000;
      const processingRate = processedCount / elapsedMinutes;
      const percentComplete = (processedCount / remainingWordsCount) * 100;
      
      // Format elapsed time
      let elapsedText = '';
      if (elapsedMinutes > 60) {
        const hours = Math.floor(elapsedMinutes / 60);
        const minutes = Math.floor(elapsedMinutes % 60);
        elapsedText = `${hours}h ${minutes}m`;
      } else {
        elapsedText = `${Math.floor(elapsedMinutes)}m`;
      }
      
      // Estimate time remaining
      const remainingWords = remainingWordsCount - processedCount;
      const estimatedMinutesRemaining = remainingWords / processingRate;
      let timeRemaining = 'Unknown';
      
      if (elapsedMinutes > 0 && !isNaN(estimatedMinutesRemaining)) {
        if (estimatedMinutesRemaining > 60) {
          const hours = Math.floor(estimatedMinutesRemaining / 60);
          const minutes = Math.floor(estimatedMinutesRemaining % 60);
          timeRemaining = `${hours}h ${minutes}m`;
        } else {
          timeRemaining = `${Math.floor(estimatedMinutesRemaining)}m`;
        }
      }
      
      // Show stats
      log.stats({
        processed: processedCount,
        total: remainingWordsCount,
        percent: percentComplete,
        rate: processingRate,
        elapsed: elapsedText,
        remaining: timeRemaining,
        apiCalls: stats.apiCalls,
        avgCallsPerWord: stats.apiCalls / Math.max(1, processedCount),
        keyUsage: stats.keyUsage
      });
      
      // Add a delay between batches to avoid rate limiting
      log.info(`Waiting ${config.BATCH_PROCESSING_DELAY / 1000} seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, config.BATCH_PROCESSING_DELAY));
    }
    
    log.divider();
    log.success(`Word enrichment completed! Processed ${colors.bright}${processedCount}${colors.reset} words in total.`);
    log.divider();
    
  } catch (error) {
    log.error(`Error in main process: ${error.message}`);
    console.error(error);
  }
}

// Run the main process
processWordEnrichment(); 