/**
 * Test script for difficulty calculation
 * 
 * This script tests the domain-based difficulty calculation on a set of sample words
 * to verify the implementation works correctly.
 */

const { processWord } = require('./calculate-difficulty');

// Sample words to test across different domains and difficulty levels
const sampleWords = [
  // Expected easy words
  'cat',      // noun.animal - concrete, common
  'dog',      // noun.animal - concrete, common
  'run',      // verb.motion - basic action
  'walk',     // verb.motion - basic action
  'house',    // noun.artifact - concrete, common
  
  // Expected medium difficulty words
  'economy',  // noun.possession - semi-abstract
  'science',  // noun.cognition - semi-abstract
  'culture',  // noun.cognition - semi-abstract
  'develop',  // verb.change - semi-abstract
  'process',  // noun.process - semi-abstract
  
  // Expected difficult words
  'axiom',    // noun.cognition - abstract, uncommon
  'theorem',  // noun.cognition - abstract, technical
  'anomaly',  // noun.attribute - abstract
  'paradox',  // noun.cognition - abstract
  'cognition' // noun.cognition - abstract, meta
];

// Words with known domain classifications
const domainSpecificWords = [
  'enzyme',   // noun.substance - biology domain
  'algorithm',// noun.cognition - computer science domain
  'metaphor', // noun.communication - linguistic domain
  'isotope',  // noun.substance - chemistry domain
  'leverage', // noun.attribute/verb.contact - finance/physical domains (polysemous)
];

// Complete test set
const testWords = [...sampleWords, ...domainSpecificWords];

/**
 * Run tests on all sample words
 */
async function runTests() {
  console.log('======= DOMAIN-BASED DIFFICULTY CALCULATION TEST =======\n');
  
  const results = [];
  
  // Process each word
  for (const word of testWords) {
    try {
      const result = await processWord(word);
      results.push(result);
      
      // Print result summary
      console.log(`Word: ${word}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      } else {
        console.log(`  Difficulty: ${result.difficulty.score.toFixed(2)} (${result.difficulty.level})`);
        console.log(`  Components:`);
        console.log(`    Frequency: ${result.difficulty.components.frequency}`);
        console.log(`    Length: ${result.difficulty.components.length}`);
        console.log(`    Syllables: ${result.difficulty.components.syllables}`);
        console.log(`    Polysemy: ${result.difficulty.components.polysemy}`);
        console.log(`    Domain: ${result.difficulty.components.domain}`);
        console.log(`  POS: ${result.pos}`);
        console.log(`  Frequency: ${result.frequency}`);
        
        // Show domains if available
        if (result.domains && result.domains.length > 0) {
          console.log(`  Domains: ${result.domains.join(', ')}`);
        }
      }
      console.log('');
    } catch (error) {
      console.error(`Error processing ${word}:`, error);
    }
  }
  
  // Summary statistics
  const validResults = results.filter(r => !r.error);
  
  if (validResults.length > 0) {
    // Calculate average scores by expected difficulty group
    const easyWords = validResults.filter(r => sampleWords.indexOf(r.word) < 5);
    const mediumWords = validResults.filter(r => sampleWords.indexOf(r.word) >= 5 && sampleWords.indexOf(r.word) < 10);
    const hardWords = validResults.filter(r => sampleWords.indexOf(r.word) >= 10 && sampleWords.indexOf(r.word) < 15);
    
    const avgEasy = easyWords.reduce((sum, r) => sum + r.difficulty.score, 0) / (easyWords.length || 1);
    const avgMedium = mediumWords.reduce((sum, r) => sum + r.difficulty.score, 0) / (mediumWords.length || 1);
    const avgHard = hardWords.reduce((sum, r) => sum + r.difficulty.score, 0) / (hardWords.length || 1);
    
    console.log('======= TEST SUMMARY =======');
    console.log(`Total words tested: ${testWords.length}`);
    console.log(`Successful calculations: ${validResults.length}`);
    console.log(`Failed calculations: ${results.length - validResults.length}`);
    console.log('');
    console.log('Average scores by expected difficulty:');
    console.log(`  Easy words: ${avgEasy.toFixed(2)}`);
    console.log(`  Medium words: ${avgMedium.toFixed(2)}`);
    console.log(`  Hard words: ${avgHard.toFixed(2)}`);
    
    // Check if our expectations were met
    const isExpectedPattern = avgEasy < avgMedium && avgMedium < avgHard;
    console.log('');
    console.log(`Difficulty distribution matches expectations: ${isExpectedPattern ? 'YES ✓' : 'NO ✗'}`);
    
    // Domain-specific words analysis
    const domainWords = validResults.filter(r => domainSpecificWords.includes(r.word));
    console.log('');
    console.log('Domain-specific words:');
    for (const result of domainWords) {
      console.log(`  ${result.word}: ${result.difficulty.score.toFixed(2)} (${result.difficulty.level})`);
      if (result.domains) {
        console.log(`    Domains: ${result.domains.join(', ')}`);
      }
    }
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
}); 