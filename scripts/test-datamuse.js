/**
 * Datamuse API Test Script
 * 
 * This script tests the quality of Datamuse API for generating distractors.
 * Run with: node scripts/test-datamuse.js [word]
 * Example: node scripts/test-datamuse.js tenacious
 */

const fetch = require('node-fetch');

// Datamuse API base URL
const DATAMUSE_BASE_URL = 'https://api.datamuse.com/words';

/**
 * Get words with similar meaning (potential semantic distractors)
 * 
 * @param {string} word - The target word
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} - Array of similar words
 */
async function getSimilarWords(word, limit = 10) {
  const url = `${DATAMUSE_BASE_URL}?ml=${encodeURIComponent(word)}&max=${limit}`;
  const response = await fetch(url);
  return await response.json();
}

/**
 * Get words that sound similar (potential phonetic distractors)
 * 
 * @param {string} word - The target word
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} - Array of sound-alike words
 */
async function getSoundAlikeWords(word, limit = 10) {
  const url = `${DATAMUSE_BASE_URL}?sl=${encodeURIComponent(word)}&max=${limit}`;
  const response = await fetch(url);
  return await response.json();
}

/**
 * Get words with similar spelling (potential orthographic distractors)
 * 
 * @param {string} word - The target word
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} - Array of similarly spelled words
 */
async function getSimilarlySpelledWords(word, limit = 10) {
  const url = `${DATAMUSE_BASE_URL}?sp=${encodeURIComponent(word)}&max=${limit}`;
  const response = await fetch(url);
  return await response.json();
}

/**
 * Get synonyms of a word (to exclude from distractors)
 * 
 * @param {string} word - The target word
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} - Array of synonyms
 */
async function getSynonyms(word, limit = 10) {
  const url = `${DATAMUSE_BASE_URL}?rel_syn=${encodeURIComponent(word)}&max=${limit}`;
  const response = await fetch(url);
  return await response.json();
}

/**
 * Get antonyms of a word (potential opposite distractors)
 * 
 * @param {string} word - The target word
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} - Array of antonyms
 */
async function getAntonyms(word, limit = 10) {
  const url = `${DATAMUSE_BASE_URL}?rel_ant=${encodeURIComponent(word)}&max=${limit}`;
  const response = await fetch(url);
  return await response.json();
}

/**
 * Generate distractors using multiple strategies
 * 
 * @param {string} word - The target word
 * @returns {Promise<Object>} - Object with various distractor types
 */
async function generateDistractors(word) {
  console.log(`Generating distractors for "${word}"...\n`);
  
  // Get synonyms to exclude from distractors
  const synonyms = await getSynonyms(word);
  const synonymSet = new Set(synonyms.map(s => s.word));
  
  console.log(`Found ${synonyms.length} synonyms: ${synonyms.map(s => s.word).join(', ')}`);
  
  // Get semantic distractors (similar meaning but not synonyms)
  const similarWords = await getSimilarWords(word, 20);
  const semanticDistractors = similarWords
    .filter(item => !synonymSet.has(item.word))
    .slice(0, 10);
    
  // Get phonetic distractors (sound-alike)
  const soundAlikeWords = await getSoundAlikeWords(word, 10);
  
  // Get orthographic distractors (similar spelling)
  const similarlySpelledWords = await getSimilarlySpelledWords(word, 10);
  
  // Get opposite distractors (antonyms)
  const antonyms = await getAntonyms(word, 10);
  
  return {
    semanticDistractors,
    soundAlikeWords,
    similarlySpelledWords,
    antonyms
  };
}

/**
 * Format and display results
 * 
 * @param {Object} results - Object with various distractor types
 */
function displayResults(results) {
  console.log('\n=== POTENTIAL DISTRACTORS ===\n');
  
  console.log('SEMANTIC DISTRACTORS (similar meaning):');
  results.semanticDistractors.forEach((item, i) => {
    console.log(`  ${i+1}. ${item.word} (score: ${item.score})`);
  });
  
  console.log('\nPHONETIC DISTRACTORS (sound alike):');
  results.soundAlikeWords.forEach((item, i) => {
    console.log(`  ${i+1}. ${item.word} (score: ${item.score})`);
  });
  
  console.log('\nORTHOGRAPHIC DISTRACTORS (similar spelling):');
  results.similarlySpelledWords.forEach((item, i) => {
    console.log(`  ${i+1}. ${item.word} (score: ${item.score})`);
  });
  
  console.log('\nOPPOSITE DISTRACTORS (antonyms):');
  results.antonyms.forEach((item, i) => {
    console.log(`  ${i+1}. ${item.word} (score: ${item.score})`);
  });
  
  // Suggest best distractors
  console.log('\n=== RECOMMENDED DISTRACTORS ===\n');
  
  // Combine and score all distractor types
  const allDistractors = [
    ...results.semanticDistractors.map(item => ({ ...item, type: 'semantic' })),
    ...results.soundAlikeWords.map(item => ({ ...item, type: 'phonetic' })),
    ...results.similarlySpelledWords.map(item => ({ ...item, type: 'orthographic' })),
    ...results.antonyms.map(item => ({ ...item, type: 'opposite' }))
  ];
  
  // Remove duplicates (prefer semantic)
  const uniqueDistractors = [];
  const seenWords = new Set();
  
  for (const distractor of allDistractors) {
    if (!seenWords.has(distractor.word)) {
      seenWords.add(distractor.word);
      uniqueDistractors.push(distractor);
    }
  }
  
  // Sort by score and pick top 5
  const bestDistractors = uniqueDistractors
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
    
  bestDistractors.forEach((item, i) => {
    console.log(`  ${i+1}. ${item.word} (${item.type}, score: ${item.score})`);
  });
}

/**
 * Main function
 */
async function main() {
  // Get word from command line argument
  const word = process.argv[2];
  
  if (!word) {
    console.error('Please provide a word to test.');
    console.error('Usage: node scripts/test-datamuse.js [word]');
    process.exit(1);
  }
  
  try {
    const results = await generateDistractors(word);
    displayResults(results);
  } catch (error) {
    console.error('Error testing Datamuse API:', error);
    process.exit(1);
  }
}

// Run the script
main(); 