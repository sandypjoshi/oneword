#!/usr/bin/env node

/**
 * Quality Test Script
 * Tests improved generators on specific words to verify quality
 */
const { createClient } = require('@supabase/supabase-js');
const config = require('./config');
const definitionGenerator = require('./generators/definition-generator');
const owadGenerator = require('./generators/owad-generator');
const distractorGenerator = require('./generators/distractor-generator');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_KEY
);

// Test words representing different parts of speech and difficulty levels
const TEST_WORDS = [
  'trouble',  // Easy word (previously had quality issues)
  'medium',   // Easy-medium word (had mixing of different word senses)
  'precise',  // Medium word (technical term, good test for specificity)
  'abundant', // Medium-hard word (abstract concept, tests definitional clarity)
  'integrate', // Medium-hard word (process word, tests action definition)
  'exacerbate', // Hard word (tests semantically adjacent terms)
  'ephemeral', // Very hard word (tests specialized domain knowledge)
  'quintessential' // Very hard word (tests sophisticated distractor strategy)
];

// Structure for quality assessment results
const qualityResults = {
  words: [],
  overallScore: 0,
  issues: [],
  timestamp: new Date().toISOString()
};

// Add difficulty level utility function
function getDifficultyLevel(score) {
  if (score === undefined || score === null) {
    return null;
  }
  
  // Convert to number if it's a string
  const numScore = typeof score === 'string' ? parseFloat(score) : score;
  
  if (isNaN(numScore)) {
    return null;
  }
  
  // Categorize difficulty
  if (numScore >= 0.6) return 'VERY HARD';
  if (numScore >= 0.4) return 'HARD';
  if (numScore >= 0.2) return 'MEDIUM';
  return 'EASY';
}

/**
 * Add quality assessment for a word
 */
function assessQuality(original, newContent) {
  const assessment = {
    word: newContent.word,
    pos: newContent.pos,
    difficultyScore: original.difficulty_score,
    difficultyLevel: getDifficultyLevel(original.difficulty_score),
    originalDefinition: original.short_definition,
    newDefinition: newContent.short_definition,
    originalOwad: original.owad_phrase,
    newOwad: newContent.owad_phrase,
    originalDistractors: original.distractors ? original.distractors.map(d => d.distractor).join(', ') : 'None',
    newDistractors: newContent.distractors ? newContent.distractors.map(d => d.distractor).join(', ') : 'None',
    issues: []
  };
  
  // Check definition quality
  if (newContent.short_definition) {
    if (newContent.short_definition.length > 100) {
      assessment.issues.push('Definition too long (over 100 characters)');
    }
    if (newContent.short_definition.includes('very') || 
        newContent.short_definition.includes('really') ||
        newContent.short_definition.includes('quite')) {
      assessment.issues.push('Definition contains subjective modifiers');
    }
  } else {
    assessment.issues.push('No definition generated');
  }
  
  // Check OWAD phrases quality
  if (newContent.owad_phrase && newContent.owad_phrase.length >= 2) {
    // Check length of phrases
    newContent.owad_phrase.forEach((phrase, index) => {
      // Check if the phrase is too vague/general
      if (phrase.length < 5) {
        assessment.issues.push(`OWAD phrase ${index+1} is too short (under 5 chars)`);
      }
      if (phrase.length > 30) {
        assessment.issues.push(`OWAD phrase ${index+1} is too long (over 30 chars)`);
      }
      
      // Check if the word itself is used in the phrase
      if (phrase.toLowerCase().includes(newContent.word.toLowerCase())) {
        assessment.issues.push(`OWAD phrase ${index+1} contains the word itself`);
      }
      
      // Check for vague modifiers
      const vagueModifiers = ['thing', 'stuff', 'something', 'someone', 'somewhere'];
      vagueModifiers.forEach(mod => {
        if (phrase.toLowerCase().includes(mod)) {
          assessment.issues.push(`OWAD phrase ${index+1} contains vague modifier "${mod}"`);
        }
      });

      // Check specific formatting based on part of speech
      if (newContent.pos === 'noun' && !phrase.startsWith('a ') && !phrase.startsWith('an ') && !phrase.startsWith('the ')) {
        assessment.issues.push(`OWAD phrase ${index+1} for noun doesn't start with article`);
      }
      if (newContent.pos === 'verb' && !phrase.startsWith('to ')) {
        assessment.issues.push(`OWAD phrase ${index+1} for verb doesn't start with "to"`);
      }
    });
  } else {
    assessment.issues.push('Fewer than 2 OWAD phrases');
  }
  
  // Check distractors quality
  if (newContent.distractors && newContent.distractors.length > 0) {
    // Check if any distractors appear in the definition
    newContent.distractors.forEach(d => {
      if (newContent.short_definition && 
          newContent.short_definition.toLowerCase().includes(d.distractor.toLowerCase())) {
        assessment.issues.push(`Distractor "${d.distractor}" appears in definition`);
      }
    });
    
    // Check for duplicate distractors
    const distractorWords = newContent.distractors.map(d => d.distractor.toLowerCase());
    const uniqueDistractors = new Set(distractorWords);
    if (uniqueDistractors.size < distractorWords.length) {
      assessment.issues.push('Contains duplicate distractors');
    }
    
    // Check difficulty level appropriateness if difficulty score is available
    if (assessment.difficultyLevel) {
      // Count types of distractors
      const phonologicalCount = newContent.distractors.filter(d => 
        d.type.includes('phono') || d.type.includes('similar sound')).length;
      
      const semanticAdjacentCount = newContent.distractors.filter(d => 
        d.type.includes('related') || d.type.includes('same domain')).length;
      
      const specializedCount = newContent.distractors.filter(d => 
        d.type.includes('technical') || d.type.includes('specialized')).length;
      
      // Check if distractor types match difficulty level
      if (assessment.difficultyLevel === 'EASY' && phonologicalCount < 2) {
        assessment.issues.push('Easy word should have more phonological distractors');
      }
      
      if (assessment.difficultyLevel === 'HARD' && semanticAdjacentCount < 2) {
        assessment.issues.push('Hard word should have more semantically adjacent distractors');
      }
      
      if (assessment.difficultyLevel === 'VERY HARD' && specializedCount < 2) {
        assessment.issues.push('Very hard word should have more specialized term distractors');
      }
    }
  } else {
    assessment.issues.push('No distractors generated');
  }
  
  // Add quality score
  assessment.qualityScore = 10 - assessment.issues.length;
  if (assessment.qualityScore < 0) assessment.qualityScore = 0;
  
  return assessment;
}

/**
 * Process a single word
 */
async function processWord(word) {
  console.log(`\n==== Testing word "${word}" ====`);
  
  // Fetch the word from the database
  const { data, error } = await supabase
    .from('app_words')
    .select('*')
    .eq('word', word)
    .limit(1);
    
  if (error) {
    console.error(`Error fetching word: ${error.message}`);
    return null;
  }
  
  if (!data || data.length === 0) {
    console.error(`Word '${word}' not found in the database`);
    return null;
  }
  
  const wordData = data[0];
  console.log(`Original word data:`);
  console.log(`- Word: ${wordData.word} (${wordData.pos})`);
  console.log(`- Difficulty: ${wordData.difficulty_score} (${getDifficultyLevel(wordData.difficulty_score) || 'Unknown'})`);
  console.log(`- Short definition: ${wordData.short_definition || 'N/A'}`);
  console.log(`- OWAD phrases: ${wordData.owad_phrase ? JSON.stringify(wordData.owad_phrase) : 'N/A'}`);
  console.log(`- Distractors: ${wordData.distractors ? 
    wordData.distractors.map(d => d.distractor).join(', ') : 'N/A'}`);
  
  try {
    // Generate new definition
    console.log('\nGenerating new definition...');
    const withDefinition = await definitionGenerator.generateDefinitions([wordData]);
    const definitionResult = withDefinition[0];
    console.log(`New definition: ${definitionResult.short_definition}`);
    
    // Generate new OWAD phrases
    console.log('\nGenerating new OWAD phrases...');
    const withPhrases = await owadGenerator.generateOwadPhrases([definitionResult]);
    const owadResult = withPhrases[0];
    console.log(`New OWAD phrases: ${JSON.stringify(owadResult.owad_phrase)}`);
    
    // Generate new distractors
    console.log('\nGenerating new distractors...');
    const withDistractors = await distractorGenerator.generateDistractors([owadResult]);
    const finalResult = withDistractors[0];
    console.log('New distractors:');
    
    if (finalResult.distractors) {
      finalResult.distractors.forEach(d => {
        console.log(`- ${d.distractor} (${d.type})`);
      });
    } else {
      console.log('No distractors generated');
    }
    
    // Assess quality
    const assessment = assessQuality(wordData, finalResult);
    console.log('\nQuality Assessment:');
    console.log(`- Quality Score: ${assessment.qualityScore}/10`);
    
    if (assessment.issues.length > 0) {
      console.log('- Issues:');
      assessment.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    } else {
      console.log('- No issues detected!');
    }
    
    return assessment;
    
  } catch (error) {
    console.error(`Error processing word: ${error.message}`);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('== GENERATOR QUALITY TEST ==');
  console.log(`Testing ${TEST_WORDS.length} words with improved generators`);
  
  for (const word of TEST_WORDS) {
    const result = await processWord(word);
    if (result) {
      qualityResults.words.push(result);
    }
  }
  
  // Create difficulty-based summary
  const difficultyGroups = {
    'EASY': [],
    'MEDIUM': [],
    'HARD': [],
    'VERY HARD': [],
    'Unknown': []
  };
  
  // Group words by difficulty
  qualityResults.words.forEach(word => {
    const level = word.difficultyLevel || 'Unknown';
    difficultyGroups[level].push(word);
  });
  
  // Calculate scores by difficulty
  const difficultyScores = {};
  for (const [level, words] of Object.entries(difficultyGroups)) {
    if (words.length > 0) {
      const avgScore = words.reduce((sum, word) => sum + word.qualityScore, 0) / words.length;
      difficultyScores[level] = avgScore;
    }
  }
  
  // Add difficulty summary to results
  qualityResults.difficultyGroups = Object.keys(difficultyGroups).map(level => ({
    level,
    count: difficultyGroups[level].length,
    avgScore: difficultyScores[level] || 0,
    words: difficultyGroups[level].map(w => w.word)
  })).filter(group => group.count > 0);
  
  // Calculate overall score
  const totalScore = qualityResults.words.reduce((sum, word) => sum + word.qualityScore, 0);
  qualityResults.overallScore = totalScore / qualityResults.words.length;
  
  console.log('\n==== SUMMARY ====');
  console.log(`Overall Quality Score: ${qualityResults.overallScore.toFixed(1)}/10`);
  
  // Print difficulty-based summary
  console.log('\n==== DIFFICULTY-BASED ANALYSIS ====');
  qualityResults.difficultyGroups.forEach(group => {
    console.log(`${group.level} (${group.count} words): Average Score ${group.avgScore.toFixed(1)}/10`);
    console.log(`Words: ${group.words.join(', ')}`);
  });
  
  // Write results to file
  const resultsDir = path.join(__dirname, 'quality-tests');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const resultsFile = path.join(resultsDir, `quality-test-${Date.now()}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(qualityResults, null, 2));
  
  console.log(`\nResults saved to ${resultsFile}`);
}

// Run the main function
main().catch(err => {
  console.error('Error in main process:', err);
  process.exit(1);
}); 