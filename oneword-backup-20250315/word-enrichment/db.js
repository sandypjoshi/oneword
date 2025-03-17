const { createClient } = require('@supabase/supabase-js');
const config = require('./config');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const logger = require('./utils/logger');

// Initialize Supabase client with service role key for full access
const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_KEY
);

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Fetch a batch of words from the database that need processing
 * @param {number} limit - Number of words to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} - Array of word objects
 */
async function fetchWordBatch(limit, offset = 0) {
  try {
    // Build query to fetch words that need any kind of processing
    // Either missing definition, OWAD phrases or distractors
    const { data, error } = await supabase
      .from('app_words')
      .select('id, word, pos, sense_count, source_word_id')
      .or('short_definition.is.null,owad_phrase.is.null,distractors.is.null')
      .order('id', { ascending: true })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw new Error(`Error fetching words: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    throw new Error(`Error in fetchWordBatch: ${error.message}`);
  }
}

/**
 * Update a word with enriched content
 * @param {number} wordId - ID of the word to update
 * @param {object} enrichedData - Object containing the enriched data
 * @returns {Promise<object>} - Updated word data
 */
async function updateWord(wordId, enrichedData) {
  const { data, error } = await supabase
    .from('app_words')
    .update({
      ...enrichedData,
      updated_at: new Date().toISOString()
    })
    .eq('id', wordId)
    .select();
    
  if (error) {
    throw new Error(`Error updating word ${wordId}: ${error.message}`);
  }
  
  return data[0];
}

/**
 * Update multiple words at once for efficiency
 * @param {Array} words - Array of word objects with ID and enriched data
 * @returns {Promise<Array>} - Array of updated word data
 */
async function updateWordsBatch(words) {
  // Extract IDs for logging
  const wordIds = words.map(w => w.id);
  
  // Format data for bulk update
  const updateData = words.map(word => {
    const { id, ...enrichedData } = word;
    return {
      id,
      ...enrichedData,
      updated_at: new Date().toISOString()
    };
  });
  
  // Perform bulk update
  const { data, error } = await supabase
    .from('app_words')
    .upsert(updateData)
    .select();
    
  if (error) {
    throw new Error(`Error bulk updating words ${wordIds.join(', ')}: ${error.message}`);
  }
  
  return data;
}

/**
 * Count total words that need processing
 * @param {string} status - Status filter if needed
 * @returns {Promise<number>} - Total count of words
 */
async function countWords(status = null) {
  let query = supabase
    .from('app_words')
    .select('id', { count: 'exact' });
    
  if (status) {
    query = query.eq('status', status);
  }
  
  const { count, error } = await query;
  
  if (error) {
    throw new Error(`Error counting words: ${error.message}`);
  }
  
  return count;
}

/**
 * Count words that still need processing (missing definitions, OWAD phrases, or distractors)
 * @returns {Promise<number>} - Count of unprocessed words
 */
async function countUnprocessedWords() {
  let query = supabase
    .from('app_words')
    .select('id', { count: 'exact' })
    .or('short_definition.is.null,owad_phrase.is.null,distractors.is.null');
    
  const { count, error } = await query;
  
  if (error) {
    throw new Error(`Error counting unprocessed words: ${error.message}`);
  }
  
  return count;
}

/**
 * Save progress data to resume processing if interrupted
 * @param {object} progressData - Object containing progress information
 */
function saveProgress(progressData) {
  // Create directory if it doesn't exist
  if (!fs.existsSync(config.TEMP_DIR)) {
    fs.mkdirSync(config.TEMP_DIR, { recursive: true });
  }
  
  const progressFile = path.join(config.TEMP_DIR, 'progress.json');
  fs.writeFileSync(progressFile, JSON.stringify(progressData, null, 2));
}

/**
 * Load saved progress data
 * @returns {object|null} - Saved progress data or null if not found
 */
function loadProgress() {
  const progressFile = path.join(config.TEMP_DIR, 'progress.json');
  
  if (fs.existsSync(progressFile)) {
    const data = fs.readFileSync(progressFile, 'utf8');
    return JSON.parse(data);
  }
  
  return null;
}

/**
 * Reset progress to start from the beginning
 * @returns {Promise<void>}
 */
function resetProgress() {
  const progressFile = path.join(config.TEMP_DIR, 'progress.json');
  
  if (fs.existsSync(progressFile)) {
    fs.unlinkSync(progressFile);
  }
}

/**
 * Reset all word enrichment data to allow fresh processing
 * This clears definition, owad phrase, and distractor data
 * @returns {Promise<void>}
 */
async function resetEnrichmentData() {
  // Supabase requires a WHERE clause for UPDATE operations
  // We'll use a filter that matches all rows
  const { error } = await supabase
    .from('app_words')
    .update({
      short_definition: null,
      owad_phrase: null,
      distractors: null,
      definition_source: null,
      definition_updated_at: null,
      updated_at: new Date().toISOString()
    })
    .gt('id', 0); // This WHERE clause will match all rows
    
  if (error) {
    throw new Error(`Error resetting enrichment data: ${error.message}`);
  }
  
  // Also reset progress
  resetProgress();
}

module.exports = {
  fetchWordBatch,
  updateWord,
  updateWordsBatch,
  countWords,
  countUnprocessedWords,
  saveProgress,
  loadProgress,
  resetProgress,
  resetEnrichmentData
}; 