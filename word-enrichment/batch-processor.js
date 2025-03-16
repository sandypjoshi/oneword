const db = require('./db');
const definitionGenerator = require('./generators/definition-generator');
const owadGenerator = require('./generators/owad-generator');
const distractorGenerator = require('./generators/distractor-generator');
const logger = require('./utils/logger');
const config = require('./config');
const path = require('path');
const fs = require('fs');

class BatchProcessor {
  constructor() {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(config.TEMP_DIR)) {
      fs.mkdirSync(config.TEMP_DIR, { recursive: true });
    }
  }

  /**
   * Process all words in batches
   * @param {Object} options - Processing options
   * @returns {Promise<void>}
   */
  async processAllWords(options = {}) {
    const {
      batchSize = config.BATCH_SIZE,
      status = null,
      resumeFromOffset = 0,
      processDefinitions = true,
      processOwadPhrases = true,
      processDistractors = true
    } = options;
    
    // Count total words to process
    const totalWords = await db.countWords(status);
    logger.info(`Found ${totalWords} words to process.`);
    
    // Calculate number of batches
    const totalBatches = Math.ceil(totalWords / batchSize);
    
    // Resume from saved progress if available and requested
    let currentOffset = resumeFromOffset;
    if (resumeFromOffset === 0) {
      const savedProgress = db.loadProgress();
      if (savedProgress && savedProgress.offset) {
        currentOffset = savedProgress.offset;
        logger.info(`Resuming from offset ${currentOffset}`);
      }
    }
    
    // Process each batch
    for (let batchIndex = Math.floor(currentOffset / batchSize); batchIndex < totalBatches; batchIndex++) {
      const offset = batchIndex * batchSize;
      const batchNumber = batchIndex + 1;
      
      logger.info(`Processing batch ${batchNumber}/${totalBatches} (offset: ${offset})`);
      
      try {
        // Fetch batch of words
        const words = await db.fetchWordBatch(batchSize, offset, status);
        logger.info(`Fetched ${words.length} words for processing`);
        
        // Save current progress
        db.saveProgress({ offset, batchIndex, totalBatches, totalWords });
        
        // Process batch with enrichment generators
        const enrichedWords = await this.processBatch(words, {
          processDefinitions,
          processOwadPhrases,
          processDistractors
        });
        
        // Update words in database
        await this._updateBatchInDatabase(enrichedWords);
        
        // Log progress
        logger.progress(Math.min(offset + words.length, totalWords), totalWords, 'Words processed');
      } catch (error) {
        logger.error(`Error processing batch ${batchNumber}: ${error.message}`);
        
        // Wait before retrying
        logger.info(`Waiting ${config.RETRY_DELAY / 1000} seconds before continuing...`);
        await new Promise(resolve => setTimeout(resolve, config.RETRY_DELAY));
      }
    }
    
    logger.success(`Processing completed. Processed ${totalWords} words.`);
  }
  
  /**
   * Process a single batch of words
   * @param {Array} words - Array of words to process
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} - Enriched words
   */
  async processBatch(words, options = {}) {
    const {
      processDefinitions = true,
      processOwadPhrases = true,
      processDistractors = true
    } = options;
    
    let enrichedWords = [...words];
    
    // Generate definitions if requested
    if (processDefinitions) {
      try {
        enrichedWords = await definitionGenerator.generateDefinitions(enrichedWords);
        logger.info(`Generated definitions for ${words.length} words`);
      } catch (error) {
        logger.error(`Failed to generate definitions: ${error.message}`);
      }
    }
    
    // Generate OWAD phrases if requested
    if (processOwadPhrases) {
      try {
        enrichedWords = await owadGenerator.generateOwadPhrases(enrichedWords);
        logger.info(`Generated OWAD phrases for ${words.length} words`);
      } catch (error) {
        logger.error(`Failed to generate OWAD phrases: ${error.message}`);
      }
    }
    
    // Generate distractors if requested
    if (processDistractors) {
      try {
        enrichedWords = await distractorGenerator.generateDistractors(enrichedWords);
        logger.info(`Generated distractors for ${words.length} words`);
      } catch (error) {
        logger.error(`Failed to generate distractors: ${error.message}`);
      }
    }
    
    // Save batch results to temp file (for backup)
    const batchFile = path.join(config.TEMP_DIR, `batch_${Date.now()}.json`);
    fs.writeFileSync(batchFile, JSON.stringify(enrichedWords, null, 2));
    
    return enrichedWords;
  }
  
  /**
   * Update a batch of words in the database
   * @param {Array} words - Array of enriched words
   * @private
   */
  async _updateBatchInDatabase(words) {
    logger.info(`Updating ${words.length} words in the database...`);
    
    // Update each word individually, with retries on failure
    for (const word of words) {
      let retries = 0;
      let success = false;
      
      while (!success && retries < config.MAX_RETRIES) {
        try {
          // Extract only the fields we want to update
          const updateData = {
            short_definition: word.shortDefinition || word.short_definition,
            definition_updated_at: word.definition_updated_at,
            definition_source: word.definition_source,
            owad_phrase: word.owad_phrase,
            distractors: word.distractors
          };
          
          // Remove any undefined values
          Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
              delete updateData[key];
            }
          });
          
          // Update in database
          await db.updateWord(word.id, updateData);
          success = true;
        } catch (error) {
          retries++;
          logger.warn(`Failed to update word ${word.word} (ID: ${word.id}), retry ${retries}/${config.MAX_RETRIES}`);
          await new Promise(resolve => setTimeout(resolve, config.RETRY_DELAY));
        }
      }
      
      if (!success) {
        logger.error(`Failed to update word ${word.word} (ID: ${word.id}) after ${config.MAX_RETRIES} retries`);
      }
    }
    
    logger.info(`Database update completed for batch of ${words.length} words`);
  }
}

module.exports = new BatchProcessor(); 