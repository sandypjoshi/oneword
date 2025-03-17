#!/usr/bin/env node

/**
 * Test script for simpler OWAD phrases
 * This script tests the updated OWAD generator with simpler vocabulary
 */

const owadGenerator = require('./generators/owad-generator');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'owad-tests');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Test words with different parts of speech and difficulty levels
const testWords = [
  {
    word: 'meticulous',
    pos: 'adjective',
    short_definition: 'Showing great attention to detail and precision'
  },
  {
    word: 'telescope',
    pos: 'noun',
    short_definition: 'An optical instrument that magnifies distant objects'
  },
  {
    word: 'calculate',
    pos: 'verb',
    short_definition: 'To determine values using mathematical operations'
  },
  {
    word: 'transparent',
    pos: 'adjective',
    short_definition: 'Allowing light to pass through completely'
  },
  {
    word: 'precisely',
    pos: 'adverb',
    short_definition: 'In an exact and accurate manner'
  },
  {
    word: 'strategy',
    pos: 'noun',
    short_definition: 'A detailed plan for achieving success'
  },
  {
    word: 'abundant',
    pos: 'adjective',
    short_definition: 'Existing in large quantities'
  },
  {
    word: 'integrate',
    pos: 'verb',
    short_definition: 'To combine parts into a whole'
  },
  {
    word: 'diligent',
    pos: 'adjective',
    short_definition: 'Working carefully and with great effort'
  },
  {
    word: 'navigate',
    pos: 'verb',
    short_definition: 'To find a way through or across'
  }
];

/**
 * Test OWAD phrase generation for a list of words
 * @param {Array} words - Words to test
 * @returns {Promise<Object>} - Test results
 */
async function testOwadPhrases(words) {
  logger.info('=== TESTING SIMPLER OWAD PHRASES ===');
  logger.info(`Testing ${words.length} words with the updated generator`);
  
  try {
    // Generate OWAD phrases
    const wordsWithOwad = await owadGenerator.generateOwadPhrases(words);
    
    // Format results for easy comparison
    const results = wordsWithOwad.map(word => ({
      word: word.word,
      pos: word.pos,
      definition: word.short_definition,
      owad_phrases: word.owad_phrase
    }));
    
    // Save results to file
    const outputPath = path.join(outputDir, `simple-owad-test-${Date.now()}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    // Print results to console
    logger.info(`=== TEST COMPLETED SUCCESSFULLY ===`);
    logger.info(`Results saved to ${outputPath}`);
    
    // Display some examples
    logger.info('\nSample results:');
    results.slice(0, 5).forEach(result => {
      logger.info(`--------------------------`);
      logger.info(`Word: ${result.word} (${result.pos})`);
      logger.info(`Definition: ${result.definition}`);
      logger.info(`OWAD phrases:`);
      result.owad_phrases.forEach(phrase => logger.info(`  - "${phrase}"`));
    });
    
    return { success: true, results };
    
  } catch (error) {
    logger.error(`Error testing OWAD phrases: ${error.message}`);
    return { success: false, error: error.message, stack: error.stack };
  }
}

// Run the test
testOwadPhrases(testWords)
  .catch(err => {
    logger.error(`Test failed: ${err.message}`);
    process.exit(1);
  }); 