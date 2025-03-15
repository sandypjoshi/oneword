require('dotenv').config();
const fs = require('fs-extra');
const { createClient } = require('@supabase/supabase-js');

// Config
const COMBINED_DATA_FILE = 'combined-words.json';
const BATCH_SIZE = 100;
const FETCH_SIZE = 1000; // How many records to fetch at once
const DELAY_MS = 500;
const MAX_RETRY_ATTEMPTS = 3; // Maximum number of retry attempts for failed batches
const RETRY_DELAY_MS = 1000; // Initial delay between retries
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Fetch all words from database with pagination handling
async function fetchAllWords() {
  console.log('Fetching all words from database (with pagination)...');
  let allWords = [];
  let lastId = 0;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('words')
      .select('id, word')
      .order('id')
      .gt('id', lastId)
      .limit(FETCH_SIZE);
    
    if (error) {
      console.error('Error fetching words:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      allWords = allWords.concat(data);
      lastId = data[data.length - 1].id;
      console.log(`Fetched ${allWords.length} words so far...`);
    } else {
      hasMore = false;
    }
  }
  
  return allWords;
}

// Helper function for basic lemmatization
function basicLemmatize(word) {
  // Common word endings and their base forms
  const endings = [
    { suffix: 'ing', replacement: '', conditionals: ['e', ''] },
    { suffix: 'ies', replacement: 'y' },
    { suffix: 'es', replacement: '', conditionals: ['s', ''] },
    { suffix: 's', replacement: '' },
    { suffix: 'ed', replacement: '', conditionals: ['e', ''] },
    { suffix: 'ly', replacement: '' }
  ];
  
  const original = word.toLowerCase();
  
  // Try each ending pattern
  for (const pattern of endings) {
    if (original.endsWith(pattern.suffix)) {
      // Basic stem by removing the suffix
      let stem = original.slice(0, original.length - pattern.suffix.length);
      
      // Apply conditional replacements (like adding back 'e' for 'ing' words)
      if (pattern.conditionals) {
        // For each possible replacement
        for (const replacement of pattern.conditionals) {
          const potentialBase = stem + replacement;
          // If this looks like a valid form, return it
          if (potentialBase.length > 2) {
            return potentialBase;
          }
        }
      }
      
      // Otherwise apply the standard replacement
      return stem + pattern.replacement;
    }
  }
  
  // If no patterns match, return the original word
  return original;
}

// New helper for normalizing word format
function normalizeWordFormat(word) {
  if (!word) return '';
  
  // Step 1: Basic normalization
  const normalized = word.toLowerCase()
    .replace(/\s+/g, ' ')   // Normalize multiple spaces to single space
    .replace(/['']/g, '')   // Remove apostrophes
    .trim();                // Remove leading/trailing spaces
  
  // Step 2: Create hyphen-preserved version
  const withHyphens = normalized;
  
  // Step 3: Create version with hyphens converted to spaces
  const withoutHyphens = normalized
    .replace(/[-]/g, ' ');  // Convert hyphens to spaces
    
  // Step 4: Create version with all separators removed
  const noSeparators = normalized
    .replace(/[-\s_]/g, '');  // Remove all separators (hyphens, spaces, underscores)

  // Step 5: Create version with underscores converted to spaces
  const underscoresToSpaces = normalized
    .replace(/[_]/g, ' ');  // Convert underscores to spaces
    
  // Return all versions in an object for flexible matching
  return {
    original: normalized,
    withHyphens,
    withoutHyphens,
    noSeparators,
    underscoresToSpaces
  };
}

// Function to normalize related word forms
function normalizeRelatedForms(updates) {
  console.log('Normalizing related word forms...');
  
  // Group updates by lemma
  const lemmaGroups = {};
  
  // First pass: group by lemma
  updates.forEach(update => {
    // Skip if no word_text (shouldn't happen, but just in case)
    if (!update.word_text) return;
    
    const lemma = basicLemmatize(update.word_text);
    
    if (!lemmaGroups[lemma]) {
      lemmaGroups[lemma] = [];
    }
    lemmaGroups[lemma].push(update);
  });
  
  // Stats
  let groupsWithMultipleForms = 0;
  let totalFormsNormalized = 0;
  
  // Second pass: normalize scores within groups
  for (const lemma in lemmaGroups) {
    const group = lemmaGroups[lemma];
    
    if (group.length > 1) {
      groupsWithMultipleForms++;
      totalFormsNormalized += group.length;
      
      // Find the "main" form - prefer base form or shortest
      let mainForm = group.reduce((prev, current) => {
        // If the current word exactly matches the lemma, prefer it
        if (current.word_text.toLowerCase() === lemma) return current;
        
        // Otherwise prefer the shorter form
        return prev.word_text.length <= current.word_text.length ? prev : current;
      });
      
      // Apply that score to all forms
      group.forEach(item => {
        if (item !== mainForm) {
          // Log normalization
          console.log(`Normalizing "${item.word_text}" (${item.difficulty_score}) to match "${mainForm.word_text}" (${mainForm.difficulty_score})`);
          
          item.difficulty_score = mainForm.difficulty_score;
          item.difficulty_level = mainForm.difficulty_level;
        }
      });
    }
  }
  
  console.log(`Normalized ${totalFormsNormalized} words in ${groupsWithMultipleForms} lemma groups.`);
  return updates;
}

// Function to log mismatches for analysis
function logMismatches(wordList, wordMaps, sampleSize = 50) {
  console.log('\n--- MISMATCH ANALYSIS ---');
  
  // Create arrays to track different types of mismatches
  const mismatchesWithUnderscore = [];
  const mismatchesWithHyphen = [];
  const mismatchesWithSpaces = [];
  const mismatchesWithSpecialChars = [];
  const otherMismatches = [];
  
  // Check each word that didn't match
  for (const word of wordList) {
    // Categorize the mismatches
    if (word.word.includes('_')) {
      mismatchesWithUnderscore.push(word.word);
    } else if (word.word.includes('-')) {
      mismatchesWithHyphen.push(word.word);
    } else if (word.word.includes(' ')) {
      mismatchesWithSpaces.push(word.word);
    } else if (/[^a-zA-Z0-9\s]/.test(word.word)) {
      mismatchesWithSpecialChars.push(word.word);
    } else {
      otherMismatches.push(word.word);
    }
  }
  
  // Log summary of mismatch types
  console.log(`Mismatches with underscores: ${mismatchesWithUnderscore.length}`);
  console.log(`Mismatches with hyphens: ${mismatchesWithHyphen.length}`);
  console.log(`Mismatches with spaces: ${mismatchesWithSpaces.length}`);
  console.log(`Mismatches with special characters: ${mismatchesWithSpecialChars.length}`);
  console.log(`Other mismatches: ${otherMismatches.length}`);
  
  // Log samples of each type
  console.log('\nSample mismatches with underscores:');
  console.log(mismatchesWithUnderscore.slice(0, sampleSize));
  
  console.log('\nSample mismatches with hyphens:');
  console.log(mismatchesWithHyphen.slice(0, sampleSize));
  
  console.log('\nSample mismatches with spaces:');
  console.log(mismatchesWithSpaces.slice(0, sampleSize));
  
  console.log('\nSample mismatches with special characters:');
  console.log(mismatchesWithSpecialChars.slice(0, sampleSize));
  
  console.log('\nSample of other mismatches:');
  console.log(otherMismatches.slice(0, sampleSize));
  
  console.log('\n--- END MISMATCH ANALYSIS ---\n');
  
  // Save detailed mismatch data to file for further analysis
  try {
    fs.writeJsonSync('word-mismatches.json', {
      underscores: mismatchesWithUnderscore,
      hyphens: mismatchesWithHyphen,
      spaces: mismatchesWithSpaces,
      specialChars: mismatchesWithSpecialChars,
      other: otherMismatches
    });
    console.log('Detailed mismatch data saved to word-mismatches.json');
  } catch (err) {
    console.error('Error saving mismatch data:', err);
  }
}

// Helper function to validate update object
function sanitizeUpdateObject(update) {
  const sanitized = { ...update };
  
  // Ensure ID is a valid number
  if (typeof sanitized.id !== 'number' || isNaN(sanitized.id) || sanitized.id <= 0) {
    console.warn(`Invalid ID detected: ${sanitized.id}, skipping record`);
    return null;
  }
  
  // Ensure difficulty_score is within valid range (0-1)
  if (sanitized.difficulty_score !== null) {
    if (typeof sanitized.difficulty_score !== 'number' || isNaN(sanitized.difficulty_score)) {
      console.warn(`Invalid difficulty_score for ID ${sanitized.id}: ${sanitized.difficulty_score}, setting to null`);
      sanitized.difficulty_score = null;
    } else if (sanitized.difficulty_score < 0 || sanitized.difficulty_score > 1) {
      console.warn(`Out of range difficulty_score for ID ${sanitized.id}: ${sanitized.difficulty_score}, clamping to range 0-1`);
      sanitized.difficulty_score = Math.max(0, Math.min(1, sanitized.difficulty_score));
    }
  }
  
  // Validate difficulty_level
  if (sanitized.difficulty_level !== null) {
    const validLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validLevels.includes(sanitized.difficulty_level)) {
      console.warn(`Invalid difficulty_level for ID ${sanitized.id}: ${sanitized.difficulty_level}, setting to null`);
      sanitized.difficulty_level = null;
    }
  }
  
  // Ensure frequency is a valid non-negative integer or null
  if (sanitized.frequency !== null) {
    if (typeof sanitized.frequency !== 'number' || isNaN(sanitized.frequency) || sanitized.frequency < 0) {
      console.warn(`Invalid frequency for ID ${sanitized.id}: ${sanitized.frequency}, setting to null`);
      sanitized.frequency = null;
    } else {
      // Ensure it's an integer and within Postgres integer range
      sanitized.frequency = Math.min(Math.floor(sanitized.frequency), 2147483647);
    }
  }
  
  // Validate timestamp format
  if (sanitized.updated_at) {
    try {
      const date = new Date(sanitized.updated_at);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid timestamp for ID ${sanitized.id}: ${sanitized.updated_at}, using current time`);
        sanitized.updated_at = new Date().toISOString();
      }
    } catch (err) {
      console.warn(`Invalid timestamp for ID ${sanitized.id}: ${sanitized.updated_at}, using current time`);
      sanitized.updated_at = new Date().toISOString();
    }
  }
  
  return sanitized;
}

// Main update function
async function updateDatabase() {
  console.log('Starting database update...');
  const startTime = Date.now();
  
  // First, fetch difficulty thresholds from config table
  console.log('Fetching difficulty thresholds from config...');
  let beginnerThreshold = 0.33; // Default value
  let intermediateThreshold = 0.67; // Default value
  
  try {
    const { data: configData, error: configError } = await supabase
      .from('difficulty_config')
      .select('name, value')
      .in('name', ['beginner_threshold', 'intermediate_threshold']);
      
    if (!configError && configData) {
      for (const config of configData) {
        if (config.name === 'beginner_threshold') {
          beginnerThreshold = config.value;
        } else if (config.name === 'intermediate_threshold') {
          intermediateThreshold = config.value;
        }
      }
      console.log(`Using configured thresholds: beginner <= ${beginnerThreshold}, intermediate <= ${intermediateThreshold}`);
    } else {
      console.log('Using default thresholds: beginner <= 0.33, intermediate <= 0.67');
      
      // Try to create config table if it doesn't exist
      try {
        await supabase.from('difficulty_config').insert([
          { name: 'beginner_threshold', value: 0.33, description: 'Max score for beginner level words' },
          { name: 'intermediate_threshold', value: 0.67, description: 'Max score for intermediate level words' }
        ]);
        console.log('Created default difficulty thresholds in config table');
      } catch (initError) {
        console.log('Note: Could not initialize config table. You may need to create it manually.');
      }
    }
  } catch (err) {
    console.log('Error fetching thresholds, using defaults:', err);
  }
  
  // Function to determine difficulty level based on configured thresholds
  function getDifficultyLevel(score) {
    if (score < beginnerThreshold) return 'beginner';
    if (score < intermediateThreshold) return 'intermediate';
    return 'advanced';
  }
  
  // Load combined data
  console.log('Loading combined word data...');
  const combinedData = await fs.readJson(COMBINED_DATA_FILE);
  const wordList = Object.values(combinedData);
  console.log(`Loaded ${wordList.length} words from combined dataset.`);
  
  // Recalculate difficulty levels using current thresholds
  console.log('Applying current thresholds to difficulty levels...');
  for (const word of wordList) {
    word.level = getDifficultyLevel(word.score);
  }
  
  // Get all existing words from database with pagination
  const existingWords = await fetchAllWords();
  
  if (!existingWords) {
    console.error('Failed to fetch words from database.');
    return;
  }
  
  console.log(`Found ${existingWords.length} total words in database.`);
  
  // Create lookup maps for various word formats
  const exactMap = {};
  const hyphensPreservedMap = {};
  const hyphensAsSpacesMap = {};
  const noSeparatorsMap = {};
  const underscoresToSpacesMap = {};
  
  existingWords.forEach(word => {
    // Skip empty words
    if (!word.word) return;
    
    // Original exact match (case insensitive)
    const wordLower = word.word.toLowerCase();
    exactMap[wordLower] = word.id;
    
    // Normalized formats
    const formats = normalizeWordFormat(word.word);
    
    hyphensPreservedMap[formats.withHyphens] = word.id;
    hyphensAsSpacesMap[formats.withoutHyphens] = word.id;
    noSeparatorsMap[formats.noSeparators] = word.id;
    underscoresToSpacesMap[formats.underscoresToSpaces] = word.id;
  });
  
  // Logging for debug
  console.log('Created various format maps for matching');
  
  // Store all maps in a single object for easier access
  const wordMaps = {
    exact: exactMap,
    hyphensPreserved: hyphensPreservedMap,
    hyphensAsSpaces: hyphensAsSpacesMap,
    noSeparators: noSeparatorsMap,
    underscoresToSpaces: underscoresToSpacesMap
  };
  
  // Track matched IDs to prevent duplicate updates
  const matchedIds = new Set();
  
  // Prepare update batches
  let updates = []; // Changed from const to let
  let exactMatchCount = 0;
  let hyphensPreservedMatchCount = 0;
  let hyphensAsSpacesMatchCount = 0;
  let noSeparatorsMatchCount = 0;
  let underscoresToSpacesMatchCount = 0;
  let skipCount = 0;
  let duplicateCount = 0;
  let mismatches = [];
  
  const matchCounts = {
    exact: 0,
    hyphensPreserved: 0,
    hyphensAsSpaces: 0,
    noSeparators: 0,
    underscoresToSpaces: 0
  };
  
  for (const word of wordList) {
    if (!word.word) continue; // Skip empty words
    
    let matched = false;
    let matchId = null;
    let matchType = '';
    
    // Get normalized formats for dataset word
    const wordLower = word.word.toLowerCase();
    const formats = normalizeWordFormat(word.word);
    
    // Try each matching strategy in descending order of precision
    if (exactMap[wordLower]) {
      matchId = exactMap[wordLower];
      matchType = 'exact';
      matchCounts.exact++;
      matched = true;
    } 
    else if (hyphensPreservedMap[formats.withHyphens]) {
      matchId = hyphensPreservedMap[formats.withHyphens];
      matchType = 'hyphensPreserved';
      matchCounts.hyphensPreserved++;
      matched = true;
    }
    else if (underscoresToSpacesMap[formats.underscoresToSpaces]) {
      matchId = underscoresToSpacesMap[formats.underscoresToSpaces];
      matchType = 'underscoresToSpaces';
      matchCounts.underscoresToSpaces++;
      matched = true;
    }
    else if (hyphensAsSpacesMap[formats.withoutHyphens]) {
      matchId = hyphensAsSpacesMap[formats.withoutHyphens];
      matchType = 'hyphensAsSpaces';
      matchCounts.hyphensAsSpaces++;
      matched = true;
    }
    else if (noSeparatorsMap[formats.noSeparators]) {
      matchId = noSeparatorsMap[formats.noSeparators];
      matchType = 'noSeparators';
      matchCounts.noSeparators++;
      matched = true;
    }
    
    if (matched) {
      // Check if we've already matched this ID to avoid duplicates
      if (matchedIds.has(matchId)) {
        duplicateCount++;
        // Log duplicate matches
        if (duplicateCount < 20) { // Limit logging to avoid spamming
          console.log(`Skipping duplicate match: "${word.word}" → ID ${matchId} (already matched)`);
        }
        continue;
      }
      
      // Add to set of matched IDs
      matchedIds.add(matchId);
      
      // Get frequency as a valid integer
      let frequency = null;
      if (word.google_freq !== null) {
        // Cap frequency to MAX_SAFE_INTEGER if needed
        frequency = Math.min(word.google_freq, 2147483647); // PostgreSQL integer max
      } else if (word.freq_zipf !== null) {
        // Convert ZipF to estimated count (rough approximation)
        frequency = Math.floor(Math.pow(10, word.freq_zipf));
      } else if (word.freq_hal !== null && !isNaN(word.freq_hal)) {
        frequency = Math.min(parseInt(word.freq_hal), 2147483647);
      }
      
      // Log non-exact matches for debugging
      if (matchType !== 'exact' && matchCounts[matchType] <= 10) {
        console.log(`${matchType} match: "${word.word}" → ID ${matchId}`);
      }
      
      // Include word_text for normalization but NOT for database update
      updates.push({
        id: matchId,
        word_text: word.word, // Add word_text for normalization (won't be sent to DB)
        difficulty_score: word.score,
        difficulty_level: word.level,
        frequency: frequency,
        updated_at: new Date().toISOString()
      });
    } else {
      skipCount++;
      mismatches.push(word);
    }
  }
  
  // Log match statistics
  console.log('\n--- MATCH STATISTICS ---');
  console.log(`Words matched exactly: ${matchCounts.exact}`);
  console.log(`Words matched with preserved hyphens: ${matchCounts.hyphensPreserved}`);
  console.log(`Words matched with underscores as spaces: ${matchCounts.underscoresToSpaces}`);
  console.log(`Words matched with hyphens as spaces: ${matchCounts.hyphensAsSpaces}`);
  console.log(`Words matched with no separators: ${matchCounts.noSeparators}`);
  console.log(`Duplicate matches skipped: ${duplicateCount}`);
  console.log(`Total matches: ${matchCounts.exact + matchCounts.hyphensPreserved + matchCounts.underscoresToSpaces + matchCounts.hyphensAsSpaces + matchCounts.noSeparators - duplicateCount}`);
  console.log(`Words not matched (skipped): ${skipCount}`);
  console.log('--- END MATCH STATISTICS ---\n');
  
  // Analyze mismatches
  if (mismatches.length > 0) {
    logMismatches(mismatches, wordMaps);
  }
  
  // Before creating batches, normalize related word forms - with more careful checks
  updates = normalizeRelatedForms(updates);
  
  // Final duplicate check - ensure no duplicate IDs in the updates
  const uniqueUpdates = [];
  const processedIds = new Set();
  let invalidCount = 0;
  
  for (const update of updates) {
    if (!processedIds.has(update.id)) {
      // Remove word_text before sending to database (prevents FK constraint errors)
      const { word_text, ...dbUpdate } = update;
      
      // Sanitize the update object
      const sanitizedUpdate = sanitizeUpdateObject(dbUpdate);
      
      if (sanitizedUpdate) {
        uniqueUpdates.push(sanitizedUpdate);
        processedIds.add(update.id);
      } else {
        invalidCount++;
      }
    } else {
      console.log(`Removing duplicate update for ID ${update.id}`);
    }
  }
  
  console.log(`Final updates after deduplication: ${uniqueUpdates.length} (removed ${updates.length - uniqueUpdates.length} duplicates, ${invalidCount} invalid)`);
  
  updates = uniqueUpdates;
  
  // Process in batches
  const batches = [];
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    batches.push(updates.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`Created ${batches.length} update batches.`);
  
  // Execute batches with improved error handling and retry mechanism
  let successCount = 0;
  let errorCount = 0;
  let retryCount = 0;
  let batchErrors = {};
  let failedBatches = []; // Track failed batches for possible retry
  
  // Process batches with smaller size if needed
  let effectiveBatchSize = BATCH_SIZE;
  let adaptiveBatchSizeReduction = false;
  
  // Save execution progress to allow resuming if script fails
  const progressFile = 'update-progress.json';
  let startBatchIndex = 0;
  
  // Check if we have progress to resume from
  try {
    if (fs.existsSync(progressFile)) {
      const progress = fs.readJsonSync(progressFile);
      if (progress && progress.lastCompletedBatch !== undefined) {
        startBatchIndex = progress.lastCompletedBatch + 1;
        console.log(`Resuming from batch ${startBatchIndex} (previous progress found)`);
        
        // Update success count if available
        if (progress.successCount) {
          successCount = progress.successCount;
          console.log(`Restoring previous success count: ${successCount}`);
        }
      }
    }
  } catch (err) {
    console.log('No valid progress file found, starting from beginning');
  }
  
  // Process each batch with enhanced error diagnostics and single-item fallback
  for (let i = startBatchIndex; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Processing batch ${i+1}/${batches.length} (${batch.length} words)...`);
    
    let batchSuccess = false;
    let attemptCount = 0;
    let lastError = null;
    let currentBatch = batch;
    
    // First, try processing the whole batch
    while (!batchSuccess && attemptCount < MAX_RETRY_ATTEMPTS) {
      try {
        if (attemptCount > 0) {
          console.log(`Retry attempt ${attemptCount} for batch ${i+1}...`);
          
          // If this is the second failure and batch size is relatively large, 
          // try reducing batch size for this attempt
          if (attemptCount === 1 && currentBatch.length > 10 && !adaptiveBatchSizeReduction) {
            const halfSize = Math.floor(currentBatch.length / 2);
            currentBatch = currentBatch.slice(0, halfSize);
            console.log(`Reducing batch size to ${currentBatch.length} for retry`);
            adaptiveBatchSizeReduction = true;
          }
          
          // Exponential backoff for retries
          await delay(RETRY_DELAY_MS * Math.pow(2, attemptCount - 1));
          retryCount++;
        }
        
        // Debug: Log the first item in the batch
        console.log(`Sample batch item: ${JSON.stringify(currentBatch[0])}`);
        
        // Process items individually but in parallel for better control
        const updatePromises = currentBatch.map(async (item) => {
          try {
            // Use the standard update method with a proper WHERE clause
            const { data, error } = await supabase
              .from('words')
              .update({
                difficulty_score: item.difficulty_score,
                difficulty_level: item.difficulty_level,
                frequency: item.frequency,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id); // Explicit WHERE clause
            
            if (error) {
              console.error(`Error updating word ID ${item.id}:`, error.message);
              return { success: false, id: item.id, error };
            }
            
            return { success: true, id: item.id };
          } catch (err) {
            console.error(`Exception updating word ID ${item.id}:`, err);
            return { success: false, id: item.id, error: err };
          }
        });
        
        // Wait for all updates to complete
        const results = await Promise.all(updatePromises);
        
        // Count successes and failures
        const successResults = results.filter(r => r.success);
        const failureResults = results.filter(r => !r.success);
        
        if (successResults.length === currentBatch.length) {
          batchSuccess = true;
          successCount += successResults.length;
          console.log(`Successfully updated all ${successResults.length} words in batch ${i+1}`);
        } else if (successResults.length > 0) {
          // Partial success
          console.log(`Partially updated batch ${i+1}: ${successResults.length} succeeded, ${failureResults.length} failed`);
          successCount += successResults.length;
          errorCount += failureResults.length;
          
          // Log a sample of failures
          if (failureResults.length > 0) {
            console.log(`Sample failures: ${JSON.stringify(failureResults.slice(0, 3))}`);
          }
          
          batchSuccess = true; // Consider this batch done since we processed all items
        } else {
          // Complete failure
          console.error(`Failed to update any words in batch ${i+1}`);
          attemptCount++;
        }
      } catch (err) {
        console.error(`Batch ${i+1} exception:`, err);
        lastError = err;
        attemptCount++;
      }
    }
    
    // If batch update failed, try individual updates with more debugging
    if (!batchSuccess) {
      console.log(`Batch update failed, falling back to individual sequential updates for batch ${i+1}...`);
      let individualSuccessCount = 0;
      
      for (const item of batch) {
        try {
          // Add a small delay between individual updates
          await delay(100);
          
          // Use standard update method with clear WHERE clause
          const { error } = await supabase
            .from('words')
            .update({
              difficulty_score: item.difficulty_score,
              difficulty_level: item.difficulty_level,
              frequency: item.frequency,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
          
          if (error) {
            console.error(`Individual update error for ID ${item.id}:`, error.message);
            errorCount++;
          } else {
            individualSuccessCount++;
            successCount++;
          }
        } catch (err) {
          console.error(`Individual update exception for ID ${item.id}:`, err);
          errorCount++;
        }
      }
      
      console.log(`Individual updates completed: ${individualSuccessCount}/${batch.length} successful`);
      
      // If this approach also fails completely, record the batch as failed
      if (individualSuccessCount === 0) {
        failedBatches.push({
          batchIndex: i,
          batch: batch,
          error: lastError
        });
        
        console.error(`All update attempts failed for batch ${i+1}.`);
      } else {
        // Save progress since we had partial success
        try {
          fs.writeJsonSync(progressFile, {
            lastCompletedBatch: i,
            totalBatches: batches.length,
            successCount: successCount,
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.warn('Failed to save progress:', err);
        }
      }
    }
    
    // Add delay between batches
    if (i < batches.length - 1) {
      await delay(DELAY_MS);
    }
    
    // Log progress every 10 batches
    if ((i + 1) % 10 === 0 || i === batches.length - 1) {
      const progress = ((i + 1) / batches.length * 100).toFixed(1);
      console.log(`Progress: ${progress}% (${i+1}/${batches.length} batches)`);
      console.log(`Success count so far: ${successCount}`);
    }
  }
  
  const duration = (Date.now() - startTime) / 1000;
  console.log(`\nDatabase update completed in ${duration.toFixed(2)} seconds.`);
  console.log(`Successfully updated: ${successCount} words`);
  console.log(`Errors: ${errorCount} words`);
  console.log(`Retry attempts: ${retryCount}`);
  
  if (Object.keys(batchErrors).length > 0) {
    console.log('\nError breakdown by code:');
    for (const [code, count] of Object.entries(batchErrors)) {
      console.log(`${code}: ${count} batches`);
    }
  }
  
  // Detailed analysis of failed batches
  if (failedBatches.length > 0) {
    console.log(`\nDetailed analysis of ${failedBatches.length} failed batches:`);
    
    // Group failures by error code
    const errorGroups = {};
    for (const failed of failedBatches) {
      const errorCode = failed.error && failed.error.code ? failed.error.code : 'unknown';
      if (!errorGroups[errorCode]) {
        errorGroups[errorCode] = [];
      }
      errorGroups[errorCode].push(failed);
    }
    
    // Output summary by error type
    for (const [code, failures] of Object.entries(errorGroups)) {
      console.log(`\nError code ${code}: ${failures.length} batches`);
      
      // Show a sample of the first failure for this code
      if (failures.length > 0) {
        const sample = failures[0];
        console.log('Sample error details:');
        console.log(sample.error);
        console.log('Sample batch item:');
        console.log(JSON.stringify(sample.batch[0], null, 2));
      }
    }
    
    // Save failed batches to a file for later analysis
    try {
      // Only save the first item from each batch to keep file size manageable
      const simplifiedFailures = failedBatches.map(f => ({
        batchIndex: f.batchIndex,
        error: {
          code: f.error?.code,
          message: f.error?.message,
          details: f.error?.details
        },
        sampleItem: f.batch[0]
      }));
      
      await fs.writeJson('failed-batches.json', simplifiedFailures, { spaces: 2 });
      console.log('Detailed failure information saved to failed-batches.json');
    } catch (err) {
      console.error('Failed to save failure details:', err);
    }
  }
  
  // Try to diagnose any persistent errors by testing different database operations
  if (errorCount > 0) {
    console.log("\nAttempting to diagnose persistent errors...");
    
    // Test a simple update with minimal fields
    try {
      console.log("Testing simple update with minimal fields...");
      if (failedBatches.length > 0 && failedBatches[0].batch.length > 0) {
        const testItem = failedBatches[0].batch[0];
        const minimalUpdate = {
          id: testItem.id,
          difficulty_score: testItem.difficulty_score
        };
        
        const { error } = await supabase
          .from('words')
          .update(minimalUpdate)
          .eq('id', testItem.id);
        
        if (error) {
          console.error("Test update failed:", error);
        } else {
          console.log("Test update succeeded with minimal fields");
        }
      }
    } catch (err) {
      console.error("Test update exception:", err);
    }
  }
}

// Run the update
updateDatabase()
  .then(() => console.log('Update process completed.'))
  .catch(err => console.error('Error in update process:', err));
