/**
 * Process Difficulty Script
 * Processes words that have been enriched and calculates their difficulty scores
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const difficultyState = require('./difficulty-state');
const { calculateDifficulty } = require('./difficulty-calculator');

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://ipljgsggnbdwaomjfuok.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbGpnc2dnbmJkd2FvbWpmdW9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTA4MDEwNiwiZXhwIjoyMDU2NjU2MTA2fQ.qkwn-imaZVnK6IGFgG75eFcFEQySgzIN_gvUJbbDFWE';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const BATCH_SIZE = 50; // Number of words to process per batch
const DELAY_BETWEEN_BATCHES = 2000; // Delay between batches in ms

/**
 * Sleep for a specified time
 * @param {number} ms Time in milliseconds
 * @returns {Promise} Promise that resolves after the specified time
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Process a batch of words
 * @param {array} words Array of word objects
 * @returns {object} Processing results
 */
async function processBatch(words) {
  console.log(`\nProcessing batch of ${words.length} words...`);

  // Stats
  const results = {
    processed: words.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    startId: words.length > 0 ? words[0].id : 0,
    endId: words.length > 0 ? words[words.length - 1].id : 0,
    lastProcessedId: 0
  };
  
  for (const word of words) {
    try {
      // Skip words without frequency data
      if (word.frequency === null) {
        console.log(`Skipping word "${word.word}" (ID: ${word.id}) - no frequency data`);
        results.skipped++;
        continue;
      }
      
      // Calculate difficulty score using the weights from environment
      const difficultyScore = calculateDifficulty(
        word.frequency, 
        word.syllable_count || 1,
        word.pos || 'unknown'
      );
      
      // Update word in database
      const { data: updateData, error: updateError } = await supabase
        .from('words')
        .update({ 
          difficulty_score: difficultyScore,
          updated_at: new Date().toISOString() 
        })
        .eq('id', word.id);
      
      if (updateError) {
        console.error(`Error updating word "${word.word}" (ID: ${word.id}):`, updateError);
        results.failed++;
        continue;
      }
      
      // Update results
      results.successful++;
      results.lastProcessedId = Math.max(results.lastProcessedId, word.id);
      
      console.log(`Processed "${word.word}" (ID: ${word.id}) - Difficulty: ${difficultyScore.toFixed(2)}`);
    } catch (error) {
      console.error(`Error processing word "${word.word}" (ID: ${word.id}):`, error);
      results.failed++;
    }
  }
  
  return results;
}

/**
 * Main function to process enriched words for difficulty calculation
 */
async function processEnrichedWords() {
  console.log('Starting difficulty processing for enriched words');
  
  try {
    // Load state
    const state = difficultyState.loadState();
    console.log(`Loaded state - Last processed ID: ${state.lastProcessedId}, Total processed: ${state.totalProcessed}`);
    
    // Get unprocessed enriched words
    const { data: words, error } = await supabase
      .from('words')
      .select('id, word, frequency, syllable_count, pos, enrichment_eligible')
      .eq('enrichment_eligible', 'eligible-word')
      .not('frequency', 'is', null)
      .is('difficulty_score', null)
      .order('id')
      .limit(BATCH_SIZE);
    
    if (error) {
      console.error('Error fetching unprocessed words:', error);
      return;
    }
    
    console.log(`Found ${words ? words.length : 0} unprocessed enriched words`);
    
    if (!words || words.length === 0) {
      console.log('No words to process. Exiting.');
      return;
    }
    
    // Process batch
    const results = await processBatch(words);
    
    // Update state
    const newState = difficultyState.updateState(state, results);
    difficultyState.saveState(newState);
    
    // Log summary
    console.log('\nProcessing summary:');
    console.log(`- Words processed: ${results.processed}`);
    console.log(`- Successfully calculated: ${results.successful}`);
    console.log(`- Failed: ${results.failed}`);
    console.log(`- Skipped: ${results.skipped}`);
    console.log(`- ID range: ${results.startId} - ${results.endId}`);
    
    console.log('\nCumulative stats:');
    console.log(`- Total processed: ${newState.totalProcessed}`);
    console.log(`- Total successful: ${newState.totalSuccessful}`);
    console.log(`- Total failed: ${newState.totalFailed}`);
    console.log(`- Total skipped: ${newState.totalSkipped}`);
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

/**
 * Process words in continuous mode
 */
async function runContinuousMode() {
  console.log('Running in continuous mode');
  
  try {
    while (true) {
      await processEnrichedWords();
      console.log(`\nWaiting ${DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`);
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  } catch (error) {
    console.error('Error in continuous mode:', error);
  }
}

// Check command line args
const args = process.argv.slice(2);
const isContinuous = args.includes('--continuous') || args.includes('-c');

// Run in appropriate mode
if (isContinuous) {
  runContinuousMode();
} else {
  processEnrichedWords();
} 