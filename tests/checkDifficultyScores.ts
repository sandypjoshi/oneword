/**
 * Test script to check difficulty scores and metrics for sample words
 */

import { calculateWordDifficulty } from '../lib/utils/wordDifficulty';

// Define test words with varying expected difficulty levels
const testWords = [
  // Simple words - expected to be beginner level
  'happy',
  'simple',
  'house',
  'water',
  'good',
  
  // Medium difficulty words - expected to be intermediate level
  'perplexing',
  'analyze',
  'curious',
  'strategy',
  'dynamic',
  
  // Complex words - expected to be advanced level
  'ephemeral',
  'paradigm',
  'juxtaposition',
  'ostentatious',
  'ubiquitous'
];

async function checkDifficultyScores() {
  console.log('WORD DIFFICULTY SCORE ANALYSIS');
  console.log('==============================\n');
  
  console.log('| Word | Difficulty | Score | Frequency | Semantic | Structural | Confidence |');
  console.log('|------|------------|-------|-----------|----------|------------|------------|');
  
  for (const word of testWords) {
    try {
      const result = await calculateWordDifficulty(word);
      
      // Format to 2 decimal places for readability
      const score = result.score.toFixed(2);
      const frequency = result.metrics.frequency.toFixed(2);
      const semantic = result.metrics.semantic.toFixed(2);
      const structural = result.metrics.structural.toFixed(2);
      const confidence = result.confidence.toFixed(2);
      
      console.log(`| ${word.padEnd(12)} | ${result.level.padEnd(10)} | ${score} | ${frequency} | ${semantic} | ${structural} | ${confidence} |`);
    } catch (error) {
      console.log(`| ${word.padEnd(12)} | ERROR | - | - | - | - | - |`);
    }
  }
  
  console.log('\nMETRIC EXPLANATIONS:');
  console.log('- Frequency: Lower frequency words (rare words) score higher (0-1)');
  console.log('- Semantic: Words with more meanings, domain-specific usage score higher (0-1)');
  console.log('- Structural: Longer, more complex words with more syllables score higher (0-1)');
  console.log('- Confidence: How reliable the data is for this word (0-1)');
  console.log('\nFINAL SCORE CALCULATION:');
  console.log('- 50% frequency + 20% semantic + 30% structural');
  console.log('- <0.33: Beginner, 0.33-0.66: Intermediate, >0.66: Advanced');
}

checkDifficultyScores().catch(error => {
  console.error('Error occurred:', error);
  process.exit(1);
}); 