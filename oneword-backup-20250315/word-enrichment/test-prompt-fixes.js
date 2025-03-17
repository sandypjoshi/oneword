#!/usr/bin/env node

/**
 * Test improved prompts for definition, OWAD phrases, and distractor generation
 * This script tests the improvements on specific problem words
 */

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const definitionGenerator = require('./generators/definition-generator');
const owadGenerator = require('./generators/owad-generator');
const distractorGenerator = require('./generators/distractor-generator');
const logger = require('./utils/logger');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'prompt-test-results');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Test words that were previously problematic
const testWords = [
  { 
    word: 'qualifying', 
    pos: 'noun',
    short_definition: 'Meeting the requirements to enter a competition',
    old_distractors: ['eligibility', 'competing', 'disqualification', 'training', 'quality'],
    notes: 'Had "eligibility" as a synonym distractor'
  },
  { 
    word: 'task', 
    pos: 'noun',
    short_definition: 'A piece of work to be done',
    old_distractors: ['job', 'duty', 'assignment', 'chore', 'errand'],
    notes: 'Had multiple synonym distractors like "job" and "duty"'
  },
  { 
    word: 'example', 
    pos: 'noun',
    short_definition: 'A representative item showing the nature of others',
    old_distractors: ['instance', 'illustration', 'sample', 'model', 'case'],
    notes: 'Had synonym distractors like "instance" and "illustration"'
  },
  { 
    word: 'strategy', 
    pos: 'noun',
    short_definition: 'A detailed plan for achieving success',
    old_distractors: ['plan', 'approach', 'tactic', 'method', 'maneuver'],
    notes: 'Had semantically similar distractors like "plan" and "approach"'
  },
  { 
    word: 'medium', 
    pos: 'adjective',
    short_definition: 'Of middle size, degree, or quality',
    old_distractors: ['average', 'moderate', 'intermediate', 'middle', 'standard'],
    notes: 'Had synonym distractors like "average" and "moderate"'
  }
];

/**
 * Generate and log test results for a word
 * @param {Object} wordObj - Word object to test
 * @returns {Promise<Object>} - Results object
 */
async function testWord(wordObj) {
  logger.info(`Testing improved prompts for word: ${wordObj.word} (${wordObj.pos})`);
  
  try {
    // Test definition generation
    const withDefinition = await definitionGenerator.generateDefinitions([wordObj]);
    const definitionResult = withDefinition[0].short_definition;
    
    // Test OWAD phrase generation
    const withOwad = await owadGenerator.generateOwadPhrases(withDefinition);
    const owadResult = withOwad[0].owad_phrase;
    
    // Test distractor generation
    const withDistractors = await distractorGenerator.generateDistractors(withOwad);
    const distractorResult = withDistractors[0].distractors;
    
    // Format results
    const result = {
      word: wordObj.word,
      pos: wordObj.pos,
      old_definition: wordObj.short_definition,
      new_definition: definitionResult,
      
      old_distractors: wordObj.old_distractors,
      new_distractors: distractorResult.map(d => d.distractor),
      new_distractor_types: distractorResult.map(d => d.type),
      
      owad_phrases: owadResult,
      
      improvement_notes: {
        definition_improved: definitionResult !== wordObj.short_definition,
        distractor_problems_fixed: !distractorResult.map(d => d.distractor)
          .some(d => wordObj.old_distractors.includes(d)),
        problem_note: wordObj.notes
      }
    };
    
    logger.info(`✅ Test completed for ${wordObj.word}`);
    return result;
  } catch (error) {
    logger.error(`❌ Error testing word ${wordObj.word}: ${error.message}`);
    return {
      word: wordObj.word,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Run the prompt improvement test on all test words
 */
async function runPromptTest() {
  logger.info('=== STARTING PROMPT IMPROVEMENT TEST ===');
  logger.info(`Testing ${testWords.length} previously problematic words`);
  
  const results = [];
  
  for (const word of testWords) {
    const result = await testWord(word);
    results.push(result);
    
    // Add visual separator in logs
    logger.info('-------------------------------------');
  }
  
  // Write results to JSON file
  const outputPath = path.join(outputDir, `prompt-test-${Date.now()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  logger.info(`=== TEST COMPLETE ===`);
  logger.info(`Results saved to ${outputPath}`);
  
  // Log summary of improvements
  const fixedCount = results.filter(r => r.improvement_notes && r.improvement_notes.distractor_problems_fixed).length;
  logger.info(`Summary: ${fixedCount}/${results.length} words now have semantically distinct distractors`);
}

// Run the test
runPromptTest()
  .catch(err => {
    logger.error(`Test failed: ${err.message}`);
    process.exit(1);
  }); 