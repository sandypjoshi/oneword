#!/usr/bin/env node

/**
 * Test script for distractor part of speech consistency
 * This script tests that generated distractors maintain the same part of speech as target words
 */

const distractorGenerator = require('./generators/distractor-generator');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'distractor-tests');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Test words with different parts of speech
const testWords = [
  {
    word: 'task',
    pos: 'noun',
    short_definition: 'A piece of work to be done'
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
    word: 'qualify',
    pos: 'verb',
    short_definition: 'To be eligible or meet the requirements for something'
  },
  {
    word: 'abundant',
    pos: 'adjective',
    short_definition: 'Existing in large quantities'
  },
  {
    word: 'elegantly',
    pos: 'adverb',
    short_definition: 'In a graceful and stylish manner'
  },
  {
    word: 'concept',
    pos: 'noun',
    short_definition: 'An abstract idea or general notion'
  }
];

/**
 * Test distractor generation with part of speech requirements
 * @param {Array} words - Words to test
 * @returns {Promise<Object>} - Test results
 */
async function testDistractorPoS(words) {
  logger.info('=== TESTING DISTRACTOR PART OF SPEECH ===');
  logger.info(`Testing ${words.length} words with part of speech enforcement`);
  
  try {
    // Generate distractors
    const wordsWithDistractors = await distractorGenerator.generateDistractors(words);
    
    // Format results for analysis
    const results = wordsWithDistractors.map(word => ({
      word: word.word,
      pos: word.pos,
      definition: word.short_definition,
      distractors: word.distractors.map(d => ({
        type: d.type,
        distractor: d.distractor
      }))
    }));
    
    // Save results to file
    const outputPath = path.join(outputDir, `distractor-pos-test-${Date.now()}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    // Log results to console
    logger.info(`=== TEST COMPLETED SUCCESSFULLY ===`);
    logger.info(`Results saved to ${outputPath}`);
    
    // Display examples 
    logger.info('\nSample results:');
    results.forEach(result => {
      logger.info(`--------------------------`);
      logger.info(`Word: ${result.word} (${result.pos})`);
      logger.info(`Definition: ${result.definition}`);
      logger.info(`Distractors:`);
      result.distractors.forEach(d => logger.info(`  - [${d.type}] "${d.distractor}"`));
    });
    
    // Check for part of speech consistency issues
    const partsOfSpeech = {
      noun: ['noun', 'n', 'ns', 'nouns'],
      verb: ['verb', 'v', 'vb', 'verbs'],
      adjective: ['adjective', 'adj', 'adjectives'],
      adverb: ['adverb', 'adv', 'adverbs']
    };
    
    // Lookup function for normalized PoS
    const getNormalizedPoS = (posString) => {
      const pos = posString.toLowerCase();
      for (const [key, values] of Object.entries(partsOfSpeech)) {
        if (values.includes(pos)) return key;
      }
      return pos; // Return original if not found
    };
    
    // Count issues by part of speech
    const issueCount = {
      total: 0,
      noun: 0,
      verb: 0,
      adjective: 0,
      adverb: 0
    };
    
    // This is a simple heuristic check - not perfect but can help spot issues
    // A more thorough check would require a POS tagger or dictionary lookup
    logger.info('\nPart of Speech Consistency Check:');
    results.forEach(result => {
      const targetPos = getNormalizedPoS(result.pos);
      
      // Skip words with unrecognized PoS
      if (!Object.keys(partsOfSpeech).includes(targetPos)) {
        logger.info(`Skipping check for ${result.word} (${result.pos}) - unrecognized PoS`);
        return;
      }
      
      // Crude check based on common word endings
      // This is just a heuristic and will have false positives/negatives
      const suspiciousDistractors = [];
      
      result.distractors.forEach(d => {
        const word = d.distractor.toLowerCase();
        let suspicious = false;
        
        // Check noun distractors for non-noun indicators
        if (targetPos === 'noun' && (
          word.endsWith('ly') || // Likely adverb
          word.endsWith('ing') && !word.endsWith('thing') && !word.endsWith('ring') || // Likely verb if not 'thing'
          word.endsWith('ed') && word.length > 4 // Likely verb past tense
        )) {
          suspicious = true;
          issueCount.noun++;
        }
        
        // Check verb distractors for non-verb indicators
        else if (targetPos === 'verb' && (
          word.endsWith('tion') || // Likely noun
          word.endsWith('ness') || // Likely noun
          word.endsWith('ment') || // Likely noun 
          word.endsWith('ly') // Likely adverb
        )) {
          suspicious = true;
          issueCount.verb++;
        }
        
        // Check adjective distractors for non-adjective indicators
        else if (targetPos === 'adjective' && (
          word.endsWith('ly') || // Likely adverb
          word.endsWith('tion') || // Likely noun
          word.endsWith('ment') // Likely noun
        )) {
          suspicious = true;
          issueCount.adjective++;
        }
        
        // Check adverb distractors for non-adverb indicators
        else if (targetPos === 'adverb' && (
          !word.endsWith('ly') && word.length > 5 // Most English adverbs end in -ly
        )) {
          suspicious = true;
          issueCount.adverb++;
        }
        
        if (suspicious) {
          suspiciousDistractors.push({
            distractor: d.distractor,
            type: d.type
          });
          issueCount.total++;
        }
      });
      
      if (suspiciousDistractors.length > 0) {
        logger.info(`${result.word} (${result.pos}) - Potential PoS issues:`);
        suspiciousDistractors.forEach(d => 
          logger.info(`  - "${d.distractor}" (${d.type}) might not be ${targetPos === 'adverb' ? 'an' : 'a'} ${targetPos}`)
        );
      } else {
        logger.info(`${result.word} (${result.pos}) - No obvious PoS issues detected`);
      }
    });
    
    logger.info('\nSummary of potential PoS issues:');
    logger.info(`Total: ${issueCount.total}`);
    logger.info(`Nouns: ${issueCount.noun}`);
    logger.info(`Verbs: ${issueCount.verb}`);
    logger.info(`Adjectives: ${issueCount.adjective}`);
    logger.info(`Adverbs: ${issueCount.adverb}`);
    logger.info('\nNote: This is a heuristic check and may include false positives.');
    
    return { success: true, results, issueCount };
  } catch (error) {
    logger.error(`Error testing distractors: ${error.message}`);
    return { success: false, error: error.message, stack: error.stack };
  }
}

// Run the test
testDistractorPoS(testWords)
  .catch(err => {
    logger.error(`Test failed: ${err.message}`);
    process.exit(1);
  }); 