/**
 * Test script for word difficulty calculation and assignment against the real database
 * Tests specifically for March 6, 2025
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { calculateWordDifficulty } from '../lib/utils/wordDifficulty';
import { isWordEligible } from '../lib/utils/wordFilters';

// Load environment variables
dotenv.config();

// Initialize Supabase client with your actual credentials
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Target test date
const TEST_DATE = new Date('2025-03-06');
const TEST_DATE_STRING = TEST_DATE.toISOString().split('T')[0]; // Format as YYYY-MM-DD

// Helper function to format dates in YYYY-MM-DD format
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Check if words are already assigned for this date
async function checkExistingAssignments() {
  console.log(`\nCHECKING EXISTING ASSIGNMENTS FOR ${TEST_DATE_STRING}`);
  console.log('='.repeat(50));
  
  // Get daily_words for the test date - note that we select words by text value, not ID
  const { data, error } = await supabase
    .from('daily_words')
    .select('*')
    .eq('date', TEST_DATE_STRING);
  
  if (error) {
    console.error('Error checking assignments:', error);
    return false;
  }
  
  if (data && data.length > 0) {
    console.log(`Found ${data.length} words already assigned for ${TEST_DATE_STRING}:`);
    console.log('| Difficulty | Word | Score |');
    console.log('|------------|------|-------|');
    
    for (const assignment of data) {
      console.log(`| ${assignment.difficulty_level.padEnd(10)} | ${assignment.word.padEnd(15)} | ${assignment.difficulty_score.toFixed(2)} |`);
    }
    
    return true;
  }
  
  console.log(`No words assigned for ${TEST_DATE_STRING} yet`);
  return false;
}

// Find eligible words for assignment
async function findEligibleWords() {
  console.log('\nFINDING ELIGIBLE WORDS FOR ASSIGNMENT');
  console.log('='.repeat(50));
  
  // Get words that already have a calculated difficulty score
  const { data: words, error } = await supabase
    .from('words')
    .select('*')
    .not('difficulty_score', 'is', null)
    .order('difficulty_score', { ascending: true })
    .limit(500); // Limit results for testing
  
  if (error) {
    console.error('Error fetching words:', error);
    return [];
  }
  
  if (!words || words.length === 0) {
    console.log('No words found with calculated difficulty scores');
    
    // Try fetching any words without the difficulty filter
    const { data: anyWords, error: anyError } = await supabase
      .from('words')
      .select('*')
      .limit(50);
      
    if (anyError) {
      console.error('Error fetching any words:', anyError);
      return [];
    }
    
    if (anyWords && anyWords.length > 0) {
      console.log(`Found ${anyWords.length} words without difficulty scores. These need to be processed first.`);
      
      // Show a few examples
      console.log('Example words:');
      anyWords.slice(0, 5).forEach(w => console.log(`- ${w.word}`));
      
      // Let's test with the first 10 words anyway
      return anyWords.slice(0, 10);
    }
    
    return [];
  }
  
  console.log(`Found ${words.length} words with calculated difficulty scores`);
  
  // Get recently assigned words (last 90 days) to avoid repetition
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoString = formatDate(ninetyDaysAgo);
  
  const { data: recentAssignments, error: recentError } = await supabase
    .from('daily_words')
    .select('word')  // Using 'word' column instead of 'word_id'
    .gte('date', ninetyDaysAgoString);
  
  if (recentError) {
    console.error('Error fetching recent assignments:', recentError);
    return [];
  }
  
  const recentWords = recentAssignments?.map(a => a.word) || [];
  console.log(`Found ${recentWords.length} words assigned in the last 90 days`);
  
  // Filter out recently used words and apply our eligibility checks
  const eligibleWords = [];
  let validationCounter = { passed: 0, failed: 0 };
  
  for (const word of words) {
    // Skip recently used words
    if (recentWords.includes(word.word)) {
      continue;
    }
    
    // Verify word passes our filter checks
    const filterResult = isWordEligible(word.word);
    if (!filterResult.isValid) {
      validationCounter.failed++;
      continue;
    }
    
    // Add to eligible list
    eligibleWords.push(word);
    validationCounter.passed++;
    
    // Limit to first 50 eligible words to avoid excessive processing
    if (eligibleWords.length >= 50) break;
  }
  
  console.log(`Words passing filter: ${validationCounter.passed}, failing: ${validationCounter.failed}`);
  console.log(`Selected ${eligibleWords.length} eligible words for testing`);
  
  return eligibleWords;
}

// Recalculate and verify difficulty scores
async function verifyDifficultyScores(words: any[]) {
  console.log('\nVERIFYING DIFFICULTY SCORES');
  console.log('='.repeat(50));
  
  const results = {
    beginner: [] as any[],
    intermediate: [] as any[],
    advanced: [] as any[],
  };
  
  const difficultyShifts = {
    unchanged: 0,
    shifted: 0
  };
  
  console.log('| Word | DB Score | DB Level | Calculated Score | Calculated Level | Match |');
  console.log('|------|----------|----------|------------------|------------------|-------|');
  
  // Process a subset of words to avoid timeouts
  const sampledWords = words.slice(0, Math.min(30, words.length));
  
  for (const word of sampledWords) {
    try {
      // Calculate difficulty using our algorithm
      const calculatedDifficulty = await calculateWordDifficulty(word.word);
      
      // Store the DB values or use nulls
      const dbScore = word.difficulty_score !== null ? 
        Number(word.difficulty_score) : null;
      const dbLevel = word.difficulty_level || 'unknown';
      
      // Compare to stored difficulty if available
      const scoreMatch = dbScore !== null ? 
        Math.abs(calculatedDifficulty.score - dbScore) < 0.1 : true;
      const levelMatch = dbLevel !== 'unknown' ? 
        calculatedDifficulty.level === dbLevel : true;
      
      const match = (scoreMatch && levelMatch) ? '✅' : '❌';
      
      if (levelMatch) {
        difficultyShifts.unchanged++;
      } else {
        difficultyShifts.shifted++;
      }
      
      // Add to appropriate level array for potential assignment
      results[calculatedDifficulty.level].push({
        ...word,
        calculated_score: calculatedDifficulty.score,
        calculated_level: calculatedDifficulty.level,
        metrics: calculatedDifficulty.metrics
      });
      
      console.log(
        `| ${word.word.padEnd(15)} | ${dbScore !== null ? dbScore.toFixed(2) : 'N/A'} | ${dbLevel.padEnd(10)} | ` +
        `${calculatedDifficulty.score.toFixed(2)} | ${calculatedDifficulty.level.padEnd(15)} | ${match} |`
      );
    } catch (error) {
      console.error(`Error calculating difficulty for "${word.word}":`, error);
    }
  }
  
  console.log(`\nSummary: ${difficultyShifts.unchanged} words unchanged, ${difficultyShifts.shifted} words shifted levels`);
  
  return results;
}

// Select words for assignment based on difficulty distribution
function selectWordsForAssignment(wordsByLevel: any) {
  console.log('\nSELECTING WORDS FOR ASSIGNMENT');
  console.log('='.repeat(50));
  
  const selectedWords = [];
  
  // Select one word from each difficulty level
  for (const level of ['beginner', 'intermediate', 'advanced']) {
    const availableWords = wordsByLevel[level];
    
    if (!availableWords || availableWords.length === 0) {
      console.log(`No eligible ${level} words available!`);
      continue;
    }
    
    // Sort by parts of speech to ensure balance
    const byPos: { [key: string]: any[] } = {};
    for (const word of availableWords) {
      const pos = word.pos || 'unknown';
      if (!byPos[pos]) byPos[pos] = [];
      byPos[pos].push(word);
    }
    
    // Select word with the least represented part of speech
    let selectedWord = null;
    
    // Find the least represented POS in already selected words
    const selectedPos = selectedWords.map(w => w.pos || 'unknown');
    const posEntries = Object.entries(byPos);
    
    // Sort by representation - pick underrepresented POS first
    posEntries.sort((a, b) => {
      const aCount = selectedPos.filter(p => p === a[0]).length;
      const bCount = selectedPos.filter(p => p === b[0]).length;
      return aCount - bCount;
    });
    
    if (posEntries.length > 0) {
      // Select first word from the least represented POS
      selectedWord = posEntries[0][1][0];
    } else {
      // Fallback to any word in this level
      selectedWord = availableWords[0];
    }
    
    if (selectedWord) {
      selectedWords.push(selectedWord);
      console.log(`Selected ${level} word: "${selectedWord.word}" (${selectedWord.pos || 'unknown'})`);
    }
  }
  
  console.log(`\nSelected ${selectedWords.length} words total`);
  
  return selectedWords;
}

// Simulate creating assignments for the test date
async function simulateAssignment(selectedWords: any[]) {
  console.log('\nSIMULATING ASSIGNMENT FOR TEST DATE');
  console.log('='.repeat(50));
  
  console.log(`Simulating assignment for ${TEST_DATE_STRING}:`);
  console.log('| Difficulty | Word | POS | Score |');
  console.log('|------------|------|-----|-------|');
  
  for (const word of selectedWords) {
    const level = word.calculated_level || word.difficulty_level || 'unknown';
    const pos = word.pos || 'unknown';
    console.log(`| ${level.padEnd(10)} | ${word.word.padEnd(15)} | ${pos.padEnd(4)} | ${(word.calculated_score || word.difficulty_score || 0).toFixed(2)} |`);
  }
  
  // Ask if user wants to actually create the assignments
  console.log('\nNOTE: This is just a simulation. No assignments were created in the database.');
  console.log('To create actual assignments, you would run the production assignment script.');
}

// Main function to run the tests
async function main() {
  console.log(`TESTING WORD ASSIGNMENT FOR ${TEST_DATE_STRING}`);
  console.log('='.repeat(50));
  
  // Check if words are already assigned for this date
  const hasAssignments = await checkExistingAssignments();
  
  if (!hasAssignments) {
    // Find eligible words
    const eligibleWords = await findEligibleWords();
    
    if (!eligibleWords || eligibleWords.length === 0) {
      console.error('No eligible words found for testing');
      return;
    }
    
    // Verify difficulty scores
    const wordsByLevel = await verifyDifficultyScores(eligibleWords);
    
    // Select words for assignment
    const selectedWords = selectWordsForAssignment(wordsByLevel);
    
    // Simulate assignment
    if (selectedWords.length > 0) {
      await simulateAssignment(selectedWords);
    }
  }
}

// Run the test
main().catch(error => {
  console.error('Error running test:', error);
  process.exit(1);
}); 