/**
 * Daily Word Selector for OneWord App
 * 
 * This script selects daily words for each difficulty level and inserts them
 * into the daily_words table in Supabase.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const WORDNET_PROCESSED_DIR = path.join(__dirname, '../wordnet-processed');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Load processed word data from JSON files
 */
async function loadProcessedData() {
  console.log('Loading processed WordNet data...');
  
  // Check if processed data exists
  if (!fs.existsSync(WORDNET_PROCESSED_DIR)) {
    console.error(`Error: Processed WordNet data not found at ${WORDNET_PROCESSED_DIR}`);
    console.error('Run parse-wordnet.js first to generate the processed data');
    process.exit(1);
  }
  
  // Load the processed data
  const words = JSON.parse(fs.readFileSync(path.join(WORDNET_PROCESSED_DIR, 'words.json')));
  console.log(`Loaded ${words.length} words`);
  
  return { words };
}

/**
 * Filter words by specific criteria to get high-quality word candidates
 * @param {Array} words - Array of word objects
 * @param {object} criteria - Filtering criteria
 * @returns {Array} - Filtered words
 */
function filterWordCandidates(words, criteria = {}) {
  const {
    minLength = 3,
    maxLength = 12,
    noSpaces = true,
    difficulty = null,
    pos = null,
    minPolysemy = 1
  } = criteria;
  
  return words.filter(word => {
    // Check word length
    if (word.word.length < minLength || word.word.length > maxLength) {
      return false;
    }
    
    // Check if word contains spaces
    if (noSpaces && word.word.includes(' ')) {
      return false;
    }
    
    // Check difficulty level
    if (difficulty && word.difficulty_level !== difficulty) {
      return false;
    }
    
    // Check part of speech
    if (pos && word.pos !== pos) {
      return false;
    }
    
    // Check polysemy (number of meanings)
    if (minPolysemy && (!word.polysemy || word.polysemy < minPolysemy)) {
      return false;
    }
    
    return true;
  });
}

/**
 * Group words by difficulty level
 * @param {Array} words - Array of word objects
 * @returns {object} - Words grouped by difficulty level
 */
function groupByDifficulty(words) {
  return words.reduce((groups, word) => {
    const level = word.difficulty_level || 'unknown';
    if (!groups[level]) {
      groups[level] = [];
    }
    groups[level].push(word);
    return groups;
  }, {});
}

/**
 * Generate a date range from start date to end date
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} - Array of dates
 */
function generateDateRange(startDate, endDate) {
  const dates = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Select random word from candidates, ensuring it hasn't been used recently
 * @param {Array} candidates - Word candidates
 * @param {Set} usedWords - Set of recently used words
 * @returns {object} - Selected word
 */
function selectRandomWord(candidates, usedWords) {
  // Filter out recently used words
  const availableCandidates = candidates.filter(word => !usedWords.has(word.word));
  
  // If no available candidates, use all candidates
  const pool = availableCandidates.length > 0 ? availableCandidates : candidates;
  
  // Select a random word
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Generate daily words for a date range
 * @param {Array} words - Array of word objects
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} - Array of daily word objects
 */
function generateDailyWords(words, startDate, endDate) {
  console.log(`Generating daily words from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  
  // Filter words by criteria
  const filteredWords = filterWordCandidates(words, {
    minLength: 3,
    maxLength: 12,
    noSpaces: true,
    minPolysemy: 1
  });
  
  // Group words by difficulty
  const wordsByDifficulty = groupByDifficulty(filteredWords);
  
  // Get date range
  const dates = generateDateRange(startDate, endDate);
  
  // Keep track of recently used words to avoid repetition
  const recentlyUsedWords = {
    beginner: new Set(),
    intermediate: new Set(),
    advanced: new Set()
  };
  
  // Maximum number of words to remember (to avoid repetition)
  const MAX_MEMORY = 30;
  
  // Generate daily words
  const dailyWords = [];
  
  dates.forEach(date => {
    const dateString = date.toISOString().split('T')[0];
    
    // Select a word for each difficulty level
    ['beginner', 'intermediate', 'advanced'].forEach(level => {
      const candidates = wordsByDifficulty[level] || [];
      
      // Skip if no candidates for this level
      if (candidates.length === 0) {
        console.warn(`No candidates found for ${level} level on ${dateString}`);
        return;
      }
      
      // Select a random word
      const selectedWord = selectRandomWord(candidates, recentlyUsedWords[level]);
      
      // Add to daily words
      dailyWords.push({
        date: dateString,
        word: selectedWord.word,
        difficulty_level: level
      });
      
      // Add to recently used words
      recentlyUsedWords[level].add(selectedWord.word);
      
      // Trim the recently used words set if it gets too large
      if (recentlyUsedWords[level].size > MAX_MEMORY) {
        // Convert to array, remove the oldest items, convert back to set
        const array = Array.from(recentlyUsedWords[level]);
        recentlyUsedWords[level] = new Set(array.slice(array.length - MAX_MEMORY));
      }
    });
  });
  
  console.log(`Generated ${dailyWords.length} daily words`);
  return dailyWords;
}

/**
 * Insert daily words into Supabase
 * @param {Array} dailyWords - Array of daily word objects
 */
async function insertDailyWords(dailyWords) {
  console.log(`Inserting ${dailyWords.length} daily words into Supabase...`);
  
  // Insert all daily words at once
  const { error } = await supabase
    .from('daily_words')
    .insert(dailyWords);
  
  if (error) {
    console.error('Error inserting daily words:', error);
    return false;
  }
  
  console.log('Successfully inserted daily words');
  return true;
}

/**
 * Check if daily words already exist for a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {boolean} - True if daily words exist for the date range
 */
async function checkDailyWordsExist(startDate, endDate) {
  const startDateString = startDate.toISOString().split('T')[0];
  const endDateString = endDate.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('daily_words')
    .select('date')
    .gte('date', startDateString)
    .lte('date', endDateString)
    .limit(1);
  
  if (error) {
    console.error('Error checking if daily words exist:', error);
    return false;
  }
  
  return data && data.length > 0;
}

/**
 * Main function
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let startDate = new Date();
    let endDate = new Date();
    let force = false;
    
    // Process arguments
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--start-date' && i + 1 < args.length) {
        startDate = new Date(args[i + 1]);
        i++;
      } else if (args[i] === '--end-date' && i + 1 < args.length) {
        endDate = new Date(args[i + 1]);
        i++;
      } else if (args[i] === '--days' && i + 1 < args.length) {
        const days = parseInt(args[i + 1]);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + days - 1);
        i++;
      } else if (args[i] === '--force') {
        force = true;
      }
    }
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid date format. Use YYYY-MM-DD.');
      process.exit(1);
    }
    
    if (startDate > endDate) {
      console.error('Start date must be before or equal to end date.');
      process.exit(1);
    }
    
    // Check if daily words already exist for this date range
    if (!force && await checkDailyWordsExist(startDate, endDate)) {
      console.log('Daily words already exist for this date range. Use --force to override.');
      process.exit(0);
    }
    
    // Load processed data
    const { words } = await loadProcessedData();
    
    // Generate daily words
    const dailyWords = generateDailyWords(words, startDate, endDate);
    
    // Save daily words to file for backup
    const outputPath = path.join(WORDNET_PROCESSED_DIR, 'daily-words.json');
    fs.writeFileSync(outputPath, JSON.stringify(dailyWords, null, 2));
    console.log(`Saved daily words to ${outputPath}`);
    
    // Insert daily words into Supabase
    if (supabaseUrl && supabaseAnonKey) {
      await insertDailyWords(dailyWords);
    } else {
      console.log('Supabase credentials not found. Daily words were saved to JSON file only.');
    }
    
    console.log('Daily word selection complete');
  } catch (error) {
    console.error('Error selecting daily words:', error);
  }
}

// Run the main function
main().catch(console.error); 