/**
 * Word Difficulty Algorithm Test Script
 * 
 * This script tests our word difficulty algorithm on sample words
 * using data from our imported WordNet database.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * Count syllables in a word
 * 
 * @param {string} word - The word to count syllables for
 * @returns {number} - Estimated number of syllables
 */
function countSyllables(word) {
  word = word.toLowerCase();
  
  // Exception dictionary for common words
  const exceptions = {
    'area': 3,
    'idea': 3,
    'every': 2,
    'apple': 2,
    'banana': 3,
    'science': 2,
    'wednesday': 3,
    'beautiful': 3,
    'interesting': 3,
    'definitely': 4,
    'naturally': 3,
    'eventually': 4,
    'responsibility': 6,
    'chocolate': 3,
    'university': 5,
    'opportunity': 5,
    'vacation': 3
  };
  
  if (exceptions[word]) {
    return exceptions[word];
  }
  
  // Basic algorithm
  word = word.replace(/(?:[^laeiouy]|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

/**
 * Calculate length-based difficulty score
 * 
 * @param {string} word - The word
 * @returns {number} - Normalized score from 0-1
 */
function calculateLengthScore(word) {
  const length = word.length;
  // Normalize: 1-4 chars (easy), 15+ chars (hard)
  return Math.min(Math.max((length - 3) / 12, 0), 1);
}

/**
 * Calculate syllable-based difficulty score
 * 
 * @param {number} syllableCount - Number of syllables
 * @returns {number} - Normalized score from 0-1
 */
function calculateSyllableScore(syllableCount) {
  // Normalize: 1 syllable (easy), 5+ syllables (hard)
  return Math.min(Math.max((syllableCount - 1) / 4, 0), 1);
}

/**
 * Calculate polysemy-based difficulty score
 * Words with more meanings tend to be more common/easier
 * 
 * @param {number} senseCount - Number of different senses/meanings
 * @returns {number} - Normalized score from 0-1 (inverted - lower polysemy is harder)
 */
function calculatePolysemyScore(senseCount) {
  // 1 meaning (less common) vs 10+ meanings (very common)
  // Inverted score (higher polysemy → lower difficulty)
  return Math.min(Math.max(1 - ((senseCount - 1) / 9), 0), 1);
}

/**
 * Calculate domain specificity score
 * Words from specialized domains tend to be harder
 * 
 * @param {string} domain - Domain of the word
 * @returns {number} - Normalized score from 0-1
 */
function calculateDomainScore(domain) {
  // General domains have lower scores
  const generalDomains = [
    'noun.act', 'noun.time', 'noun.person', 'noun.Tops',
    'verb.communication', 'verb.motion', 'adj.all'
  ];
  
  // Technical domains have higher scores
  const technicalDomains = [
    'noun.cognition', 'noun.process', 'noun.attribute', 
    'noun.artifact', 'noun.substance', 'noun.cognition'
  ];
  
  if (!domain) return 0.5; // Default for unknown domains
  
  if (generalDomains.includes(domain)) {
    return 0.25;
  } else if (technicalDomains.includes(domain)) {
    return 0.75;
  } else {
    return 0.5; // Middle ground for other domains
  }
}

/**
 * Calculate frequency/usage-based difficulty score based on tag_count
 * 
 * @param {number} tagCount - Frequency indicator from WordNet
 * @returns {number} - Normalized score from 0-1
 */
function calculateFrequencyScore(tagCount) {
  // Fix for negative infinity
  if (!tagCount || tagCount < 0 || !isFinite(tagCount)) {
    return 0.9; // Assume fairly rare if we have no data
  }
  
  // WordNet tag_count: 0 (rare) to 100+ (extremely common)
  // Convert to 0-1 scale and invert (higher frequency → lower difficulty)
  return Math.min(Math.max(1 - (tagCount / 50), 0.1), 0.9);
}

/**
 * Get difficulty level from score
 * 
 * @param {number} score - Difficulty score (0-1)
 * @returns {string} - Difficulty level
 */
function getDifficultyLevel(score) {
  if (score < 0.33) return 'beginner';
  if (score < 0.67) return 'intermediate';
  return 'advanced';
}

/**
 * Calculate overall word difficulty
 * 
 * @param {Object} wordData - Word data from database
 * @returns {Object} - Difficulty analysis
 */
function calculateDifficulty(wordData) {
  const wordText = wordData.word;
  
  // Calculate individual factors
  const syllableCount = wordData.syllables || countSyllables(wordText);
  const lengthScore = calculateLengthScore(wordText);
  const syllableScore = calculateSyllableScore(syllableCount);
  
  // Adjust polysemy calculation to handle missing data better
  const polysemyValue = wordData.polysemy || 1;
  const polysemyScore = calculatePolysemyScore(polysemyValue);
  
  // Better domain handling
  const domainScore = calculateDomainScore(wordData.domain);
  
  // Improved frequency handling
  const tagCount = wordData.tag_count || 0;
  const frequencyScore = calculateFrequencyScore(tagCount);
  
  // Adjust weights based on our test results
  // Increase the weight of length and syllables, which align well with intuition
  const score = (
    (0.35 * lengthScore) + 
    (0.30 * syllableScore) + 
    (0.15 * polysemyScore) + 
    (0.10 * frequencyScore) + 
    (0.10 * domainScore)
  );
  
  // Round to 2 decimal places
  const roundedScore = Math.round(score * 100) / 100;
  
  return {
    word: wordText,
    score: roundedScore,
    level: getDifficultyLevel(roundedScore),
    factors: {
      length: { value: wordText.length, score: lengthScore },
      syllables: { value: syllableCount, score: syllableScore },
      polysemy: { value: polysemyValue, score: polysemyScore },
      frequency: { value: tagCount, score: frequencyScore }, 
      domain: { value: wordData.domain || 'unknown', score: domainScore }
    }
  };
}

/**
 * Get word data from database and calculate difficulty
 */
async function testWordDifficulty(word) {
  try {
    console.log(`Analyzing difficulty for "${word}"...`);
    
    // Query word data from Supabase - without relationship
    const { data: wordData, error } = await supabase
      .from('words')
      .select('*')
      .eq('word', word.toLowerCase())
      .single();
      
    if (error) {
      console.error(`Error fetching data for "${word}":`, error.message);
      return;
    }
    
    if (!wordData) {
      console.log(`Word "${word}" not found in database.`);
      return;
    }
    
    // Separately get word_synsets data
    const { data: wordSynsets, error: synsetsError } = await supabase
      .from('word_synsets')
      .select('synset_id, sense_number, tag_count')
      .eq('word', word.toLowerCase());
      
    if (synsetsError) {
      console.error(`Error fetching synsets for "${word}":`, synsetsError.message);
    }
    
    // Get the first synset's details if available
    let domain = null;
    if (wordSynsets && wordSynsets.length > 0) {
      const { data: synset, error: synsetError } = await supabase
        .from('synsets')
        .select('domain')
        .eq('id', wordSynsets[0].synset_id)
        .single();
        
      if (!synsetError && synset) {
        domain = synset.domain;
      }
    }
    
    // Extract additional data from word_synsets
    const processedWordData = {
      ...wordData,
      polysemy: wordSynsets?.length || wordData.polysemy || 1,
      tag_count: Math.max(...(wordSynsets?.map(ws => ws.tag_count || 0) || [0])),
      domain: domain
    };
    
    // Calculate difficulty
    const difficultyResult = calculateDifficulty(processedWordData);
    
    // Display results
    console.log('\nRESULTS:');
    console.log(`Word: ${difficultyResult.word}`);
    console.log(`Difficulty Score: ${difficultyResult.score}`);
    console.log(`Difficulty Level: ${difficultyResult.level}`);
    console.log('\nFACTORS:');
    
    const factors = difficultyResult.factors;
    console.log(`Length: ${factors.length.value} (score: ${factors.length.score.toFixed(2)})`);
    console.log(`Syllables: ${factors.syllables.value} (score: ${factors.syllables.score.toFixed(2)})`);
    console.log(`Polysemy: ${factors.polysemy.value} meaning(s) (score: ${factors.polysemy.score.toFixed(2)})`);
    console.log(`Frequency: tag_count=${factors.frequency.value} (score: ${factors.frequency.score.toFixed(2)})`);
    console.log(`Domain: ${factors.domain.value} (score: ${factors.domain.score.toFixed(2)})`);
    
    return difficultyResult;
  } catch (error) {
    console.error('Error testing word difficulty:', error);
  }
}

/**
 * Test algorithm on a set of words
 */
async function testMultipleWords(words) {
  console.log('WORD DIFFICULTY ALGORITHM TEST\n');
  
  const results = [];
  
  for (const word of words) {
    const result = await testWordDifficulty(word);
    if (result) results.push(result);
    console.log('-'.repeat(50));
  }
  
  // Print summary table
  console.log('\nSUMMARY:');
  console.log('Word'.padEnd(15), '| Score | Level');
  console.log('-'.repeat(40));
  
  results.forEach(r => {
    console.log(
      r.word.padEnd(15), 
      `| ${r.score.toFixed(2)} | ${r.level.padStart(11)}`
    );
  });
}

// Words to test (varying difficulties)
const testWords = process.argv.slice(2);

if (testWords.length === 0) {
  // Default test set if no words provided
  testMultipleWords([
    // Basic words (should be beginner level)
    'cat',           // Common, short
    'dog',           // Common, short
    'house',         // Common, everyday
    'book',          // Common, everyday
    'water',         // Common, everyday
    
    // Intermediate words
    'apple',         // Common but not shortest
    'mountain',      // Longer, nature-related
    'beautiful',     // Common adjective, but longer
    'love',          // Common but abstract
    'family',        // Common but with multiple syllables
    
    // Advanced words
    'ubiquitous',    // Less common, longer
    'ephemeral',     // Advanced, abstract
    'tenacious',     // Advanced, less common
    'computer',      // Technical domain
    'pneumonia',     // Medical term
    'philosophy',    // Academic domain
    'ambiguous',     // Advanced, abstract
    'meticulous',    // Advanced, less frequently used
  ]);
} else {
  testMultipleWords(testWords);
} 