import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0'

// Constants for API and processing
const STATE_ID = 1;  // The ID of the state record in the database
const BATCH_SIZE = 15;  // Reduced from 30 to 15
const DATAMUSE_API_BASE = 'https://api.datamuse.com/words';
const DELAY_BETWEEN_WORDS_MS = 300;  // Reduced from 500 to 300

interface StateData {
  id?: number;        // Adding id property
  startId: number;
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
  totalSkipped: number;
  totalMarkedEligible: number;
  totalMarkedIneligible: number;
  lastUpdated: string;
  dailyRequestCount: number;
  processingStartTime: string;
  lastRunTime: string;
}

serve(async (req) => {
  try {
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate request if needed
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting word enrichment...');

    // Get or initialize state
    let state: StateData;
    try {
      state = await loadState(supabaseClient);
      console.log('Loaded existing state:', JSON.stringify(state));
    } catch (error) {
      console.error('Error loading state, initializing new state:', error);
      // Initialize a new state with default values
      state = {
        id: STATE_ID,
        startId: 0,
        totalProcessed: 0,
        totalSuccessful: 0,
        totalFailed: 0,
        totalSkipped: 0,
        totalMarkedEligible: 0,
        totalMarkedIneligible: 0,
        lastUpdated: new Date().toISOString(),
        dailyRequestCount: 0,
        processingStartTime: new Date().toISOString(),
        lastRunTime: new Date().toISOString()
      };
      
      // Create the initial state record
      try {
        await supabaseClient
          .from('enrichment_state')
          .upsert([state]);
        console.log('Created new state record');
      } catch (stateError) {
        console.error('Error creating state record:', stateError);
      }
    }

    // Process a batch of words
    const result = await processBatch(supabaseClient, state);
    
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unhandled error in word enrichment:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Load the current state from the database
 */
async function loadState(supabase) {
  try {
    // Check if we have a state record in the enrichment_state table
    const { data: stateData, error: stateError } = await supabase
      .from('enrichment_state')
      .select('*')
      .limit(1);
      
    if (stateError) {
      throw new Error(`Error loading state: ${stateError.message}`);
    }
    
    if (stateData && stateData.length > 0) {
      // Convert snake_case to camelCase for consistency
      const rawState = stateData[0];
      return {
        id: rawState.id,
        startId: rawState.start_id || 0,
        totalProcessed: rawState.total_processed || 0,
        totalSuccessful: rawState.total_successful || 0,
        totalFailed: rawState.total_failed || 0,
        totalSkipped: rawState.total_skipped || 0,
        totalMarkedEligible: rawState.total_marked_eligible || 0,
        totalMarkedIneligible: rawState.total_marked_ineligible || 0,
        lastUpdated: rawState.last_updated || new Date().toISOString(),
        dailyRequestCount: rawState.daily_request_count || 0,
        processingStartTime: rawState.processing_start_time || new Date().toISOString(),
        lastRunTime: rawState.last_run_time || new Date().toISOString()
      };
    }
    
    // Create a new state if none exists
    const newState: any = {
      start_id: 0,
      total_processed: 0,
      total_successful: 0,
      total_failed: 0,
      total_skipped: 0,
      total_marked_eligible: 0,
      total_marked_ineligible: 0,
      last_updated: new Date().toISOString(),
      daily_request_count: 0,
      processing_start_time: new Date().toISOString(),
      last_run_time: new Date().toISOString()
    };
    
    const { data: createdState, error: createError } = await supabase
      .from('enrichment_state')
      .insert(newState)
      .select();
      
    if (createError) {
      throw new Error(`Error creating new state: ${createError.message}`);
    }
    
    // Convert snake_case to camelCase
    return {
      id: createdState[0].id,
      startId: createdState[0].start_id || 0,
      totalProcessed: createdState[0].total_processed || 0,
      totalSuccessful: createdState[0].total_successful || 0,
      totalFailed: createdState[0].total_failed || 0,
      totalSkipped: createdState[0].total_skipped || 0,
      totalMarkedEligible: createdState[0].total_marked_eligible || 0,
      totalMarkedIneligible: createdState[0].total_marked_ineligible || 0,
      lastUpdated: createdState[0].last_updated || new Date().toISOString(),
      dailyRequestCount: createdState[0].daily_request_count || 0,
      processingStartTime: createdState[0].processing_start_time || new Date().toISOString(),
      lastRunTime: createdState[0].last_run_time || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in loadState:', error);
    throw error;
  }
}

/**
 * Update the state in the database
 */
async function updateState(supabase, stateId, stateUpdates) {
  try {
    // Convert camelCase to snake_case for the database
    const dbUpdates = {
      start_id: stateUpdates.startId,
      total_processed: stateUpdates.totalProcessed,
      total_successful: stateUpdates.totalSuccessful,
      total_failed: stateUpdates.totalFailed,
      total_skipped: stateUpdates.totalSkipped,
      total_marked_eligible: stateUpdates.totalMarkedEligible,
      total_marked_ineligible: stateUpdates.totalMarkedIneligible,
      daily_request_count: stateUpdates.dailyRequestCount,
      last_updated: new Date().toISOString(),
      last_run_time: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('enrichment_state')
      .update(dbUpdates)
      .eq('id', stateId);
      
    if (error) {
      throw new Error(`Error updating state: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in updateState:', error);
    throw error;
  }
}

/**
 * Process a batch of words
 */
async function processBatch(supabase, state) {
  console.log('Starting batch processing with batch size:', BATCH_SIZE);
  const startTime = new Date();
  
  // Get words that:
  // 1. Are marked as eligible-word (skipping eligible-phrase for MVP)
  // 2. Don't have frequency data yet
  // 3. Have ID greater than our last processed ID
  let { data: words, error } = await supabase
    .from('words')
    .select('id, word')
    .eq('enrichment_eligible', 'eligible-word')  // Only process eligible words, skip phrases
    .is('frequency', null)
    .gt('id', state.startId)  // Only get words after our last processed ID
    .order('id', { ascending: true })
    .limit(BATCH_SIZE);

  const queryTime = new Date().getTime() - startTime.getTime();
  console.log(`Database query took ${queryTime}ms`);

  if (error) {
    console.error('Error fetching words:', error);
    return { success: false, error: error.message };
  }

  if (!words || words.length === 0) {
    console.log('No more eligible words to process');
    return { success: true, processed: 0 };
  }

  let processed = 0;
  let successful = 0;
  let failed = 0;
  let skipped = 0;
  let startId = words[0]?.id || 0;
  let endId = words[words.length - 1]?.id || 0;

  console.log(`Processing batch of ${words.length} single words (IDs ${startId}-${endId})`);

  for (const wordData of words) {
    const wordStartTime = new Date();
    try {
      // Process the word directly with Datamuse API
      const enrichmentData = await enrichWordWithDatamuse(wordData.word);
      
      // Update the word with the enrichment data
      const updateResult = await updateWordWithEnrichmentData(supabase, wordData.id, enrichmentData);
      
      if (updateResult.success) {
        successful++;
        const wordTime = new Date().getTime() - wordStartTime.getTime();
        console.log(`Successfully enriched word ID ${wordData.id}: "${wordData.word}" (freq: ${enrichmentData.frequency || 'unknown'}, syllables: ${enrichmentData.syllables || 'unknown'}) - took ${wordTime}ms`);
      } else {
        failed++;
        console.error(`Failed to update word ID ${wordData.id}:`, updateResult.error);
      }
      
      processed++;
      
      // Delay between words to avoid rate limiting, but only if not the last word
      if (processed < words.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_WORDS_MS));
      }
    } catch (err) {
      console.error(`Error processing word ID ${wordData.id}:`, err);
      failed++;
      processed++;
    }
  }

  // Update state
  const stateUpdates = {
    startId: Math.max(endId, state.startId), // Use the highest ID processed
    totalProcessed: state.totalProcessed + processed,
    totalSuccessful: state.totalSuccessful + successful,
    totalFailed: state.totalFailed + failed,
    totalSkipped: state.totalSkipped + skipped,
    totalMarkedEligible: state.totalMarkedEligible,
    totalMarkedIneligible: state.totalMarkedIneligible,
    lastUpdated: new Date().toISOString(),
    dailyRequestCount: state.dailyRequestCount + processed, // Count API calls
    lastRunTime: new Date().toISOString()
  };

  await updateState(supabase, STATE_ID, stateUpdates);
  
  const totalTime = new Date().getTime() - startTime.getTime();
  console.log(`Batch processing completed in ${totalTime}ms. Processed: ${processed}, Successful: ${successful}, Failed: ${failed}`);

  return {
    success: true,
    processed,
    successful,
    failed,
    skipped,
    startId,
    endId,
    processingTimeMs: totalTime
  };
}

/**
 * Enrich a word using the Datamuse API
 */
async function enrichWordWithDatamuse(word) {
  try {
    // Normalize the word
    const normalizedWord = word.trim().toLowerCase();
    
    // Skip empty words
    if (!normalizedWord) {
      return { frequency: null, syllables: null };
    }
    
    // Get frequency data from Datamuse API
    let frequency = null;
    let syllables = null;
    
    const url = `${DATAMUSE_API_BASE}?sp=${encodeURIComponent(normalizedWord)}&md=fs&max=1`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract frequency from the API response
    if (data && data.length > 0) {
      const match = data[0];
      
      // Extract frequency from tags
      if (match.tags && match.tags.some(tag => tag.startsWith('f:'))) {
        const freqTag = match.tags.find(tag => tag.startsWith('f:'));
        if (freqTag) {
          frequency = parseInt(freqTag.substring(2)) || null;
        }
      }
      
      // Extract syllable count
      if (match.numSyllables !== undefined) {
        syllables = match.numSyllables;
      }
    }
    
    return { frequency, syllables };
  } catch (error) {
    console.error('Error in enrichWordWithDatamuse:', error);
    return { frequency: null, syllables: null };
  }
}

/**
 * Update a word with enrichment data
 */
async function updateWordWithEnrichmentData(supabase, wordId, data) {
  try {
    // Prepare the update data with proper type definition
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Add frequency if available
    if (data.frequency !== null && data.frequency !== undefined) {
      updateData.frequency = data.frequency;
    }
    
    // Add syllables if available
    if (data.syllables !== null && data.syllables !== undefined) {
      updateData.syllable_count = data.syllables;
    }
    
    const { error } = await supabase
      .from('words')
      .update(updateData)
      .eq('id', wordId);
      
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in updateWordWithEnrichmentData:', error);
    return { success: false, error: error.message };
  }
}