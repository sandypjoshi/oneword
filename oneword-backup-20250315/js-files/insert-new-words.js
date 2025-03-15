require('dotenv').config();
const fs = require('fs-extra');
const { createClient } = require('@supabase/supabase-js');

// Config
const COMBINED_DATA_FILE = 'combined-words.json';
const BATCH_SIZE = 50;
const DELAY_MS = 500;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const MAX_WORDS_TO_INSERT = 5000;  // Limit to avoid overwhelming the database

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Filter for valid words (only alphabetical, remove special characters/numbers)
function isValidWord(word) {
  return /^[a-zA-Z]+$/.test(word) && word.length > 1;
}

// Main function to insert new words
async function insertNewWords() {
  console.log('Starting insertion of new words...');
  const startTime = Date.now();
  
  // Load combined data
  console.log('Loading combined word data...');
  const combinedData = await fs.readJson(COMBINED_DATA_FILE);
  console.log(`Loaded ${Object.keys(combinedData).length} total words.`);
  
  // Get existing words from database
  console.log('Fetching existing words from database...');
  const { data: existingWords, error } = await supabase
    .from('words')
    .select('word')
    .order('id');
  
  if (error) {
    console.error('Error fetching words:', error);
    return;
  }
  
  console.log(`Found ${existingWords.length} existing words in database.`);
  
  // Create set of existing words for faster lookup
  const existingWordSet = new Set();
  existingWords.forEach(item => {
    existingWordSet.add(item.word.toLowerCase());
  });
  
  // Find words to insert
  const wordsToInsert = [];
  
  for (const [word, data] of Object.entries(combinedData)) {
    // Skip if already in database
    if (existingWordSet.has(word.toLowerCase())) {
      continue;
    }
    
    // Skip if not a valid word
    if (!isValidWord(word)) {
      continue;
    }
    
    // Get frequency as a valid integer
    let frequency = null;
    if (data.google_freq !== null) {
      // Cap frequency to MAX_SAFE_INTEGER if needed
      frequency = Math.min(data.google_freq, 2147483647); // PostgreSQL integer max
    } else if (data.freq_zipf !== null) {
      // Convert ZipF to estimated count (rough approximation)
      frequency = Math.floor(Math.pow(10, data.freq_zipf));
    } else if (data.freq_hal !== null && !isNaN(data.freq_hal)) {
      frequency = Math.min(parseInt(data.freq_hal), 2147483647);
    }
    
    wordsToInsert.push({
      word: word,
      difficulty_score: data.score,
      difficulty_level: data.level,
      frequency: frequency,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Limit the number of words to insert
    if (wordsToInsert.length >= MAX_WORDS_TO_INSERT) {
      break;
    }
  }
  
  console.log(`Found ${wordsToInsert.length} new words to insert.`);
  
  // Process in batches
  const batches = [];
  for (let i = 0; i < wordsToInsert.length; i += BATCH_SIZE) {
    batches.push(wordsToInsert.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`Created ${batches.length} insertion batches.`);
  
  // Execute batches
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Processing batch ${i+1}/${batches.length} (${batch.length} words)...`);
    
    try {
      const { error } = await supabase
        .from('words')
        .insert(batch);
      
      if (error) {
        console.error('Batch insertion error:', error);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
      }
    } catch (err) {
      console.error('Exception in batch insertion:', err);
      errorCount += batch.length;
    }
    
    // Add delay between batches
    if (i < batches.length - 1) {
      await delay(DELAY_MS);
    }
  }
  
  const duration = (Date.now() - startTime) / 1000;
  console.log(`\nInsertion completed in ${duration.toFixed(2)} seconds.`);
  console.log(`Successfully inserted: ${successCount} words`);
  console.log(`Errors: ${errorCount} words`);
}

// Run the insertion
insertNewWords()
  .then(() => console.log('Insertion process completed.'))
  .catch(err => console.error('Error in insertion process:', err));
