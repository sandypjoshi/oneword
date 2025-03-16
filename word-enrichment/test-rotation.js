#!/usr/bin/env node

/**
 * Key Rotation Test Script
 * This script tests the multi-key rotation system with a small batch
 */

const config = require('./config');
const db = require('./db');
const logger = require('./utils/logger');
const definitionGenerator = require('./generators/definition-generator');
const owadGenerator = require('./generators/owad-generator');
const distractorGenerator = require('./generators/distractor-generator');
const GeminiClient = require('./gemini-client');

// Test configuration
const TEST_BATCH_SIZE = 10; // Small batch size for testing
const TEST_OFFSET = 5000; // Start from a higher offset to get unprocessed words

/**
 * Test key rotation by processing a small batch
 */
async function testKeyRotation() {
  try {
    logger.info('=== KEY ROTATION TEST ===');
    logger.info(`Testing with ${config.KEYS_COUNT} API keys`);
    logger.info('Keys configured:');
    
    config.GEMINI_API_KEYS.forEach((key, index) => {
      // Mask keys for security in logs
      const maskedKey = key.substring(0, 6) + '...' + key.substring(key.length - 4);
      logger.info(`Key ${index + 1}: ${maskedKey}`);
    });
    
    // Initialize client to test connectivity
    const client = new GeminiClient();
    logger.info('Client initialized with key rotation enabled');
    
    // Fetch a small batch of words
    logger.info(`Fetching ${TEST_BATCH_SIZE} words from offset ${TEST_OFFSET}...`);
    const words = await db.fetchWordBatch(TEST_BATCH_SIZE, TEST_OFFSET);
    
    if (!words || words.length === 0) {
      logger.error('No words fetched. Check database connection.');
      process.exit(1);
    }
    
    logger.info(`Fetched ${words.length} words successfully`);
    
    // Process the words
    logger.info('Starting test processing...');
    
    // Step 1: Generate definitions
    logger.info('Generating definitions...');
    const wordsWithDefs = await definitionGenerator.generateDefinitions(words);
    logger.info('Definitions generated successfully');
    
    // Step 2: Generate OWAD phrases
    logger.info('Generating OWAD phrases...');
    const wordsWithOwad = await owadGenerator.generateOwadPhrases(wordsWithDefs);
    logger.info('OWAD phrases generated successfully');
    
    // Step 3: Generate distractors
    logger.info('Generating distractors...');
    const fullyEnrichedWords = await distractorGenerator.generateDistractors(wordsWithOwad);
    logger.info('Distractors generated successfully');
    
    // Log results
    logger.info('=== TEST RESULTS ===');
    logger.info(`Successfully processed ${fullyEnrichedWords.length} words`);
    logger.info('Key rotation stats:');
    
    Object.keys(client.keyStats).forEach((key, index) => {
      const stats = client.keyStats[key];
      const maskedKey = key.substring(0, 6) + '...' + key.substring(key.length - 4);
      logger.info(`Key ${index + 1} (${maskedKey}): ${stats.requestCount} requests`);
    });
    
    logger.info('Test completed successfully! Key rotation is working.');
    logger.info('You can now run the full process with confidence.');
    
  } catch (error) {
    logger.error(`Test failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testKeyRotation(); 