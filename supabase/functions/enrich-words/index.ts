import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0'

// Constants for API and processing
const BATCH_SIZE = 20;
const DATAMUSE_API_BASE = 'https://api.datamuse.com/words';
const DELAY_BETWEEN_WORDS_MS = 500; // Added for the new processBatch function

interface StateData {
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
    // Create a Supabase client with the project URL and service key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get parameters from request
    const { apiKey } = await req.json();
    
    // Validate API key if needed
    if (apiKey !== Deno.env.get('ENRICHMENT_API_KEY')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Load the current state
    const state = await loadState(supabaseClient);
    
    // Process a batch of words
    const result = await processBatch(supabaseClient, state);
    
    // Return the results
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing enrichment batch:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
  // Get words that:
  // 1. Are marked as eligible (eligible-word or eligible-phrase)
  // 2. Don't have frequency data yet
  let { data: words, error } = await supabase
    .from('words')
    .select('id, word')
    .or('enrichment_eligible.eq.eligible-word,enrichment_eligible.eq.eligible-phrase')
    .is('frequency', null)
    .order('id', { ascending: true })
    .limit(BATCH_SIZE);

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

  console.log(`Processing batch of ${words.length} words (IDs ${startId}-${endId})`);

  for (const wordData of words) {
    try {
      // Process the word directly with Datamuse API
      const enrichmentData = await enrichWordWithDatamuse(wordData.word);
      
      // Update the word with the enrichment data
      const updateResult = await updateWordWithEnrichmentData(supabase, wordData.id, enrichmentData);
      
      if (updateResult.success) {
        successful++;
        console.log(`Successfully enriched word ID ${wordData.id}: "${wordData.word}" (freq: ${enrichmentData.frequency || 'unknown'}, syllables: ${enrichmentData.syllables || 'unknown'})`);
      } else {
        failed++;
        console.error(`Failed to update word ID ${wordData.id}:`, updateResult.error);
      }
      
      processed++;
      
      // Delay between words to avoid rate limiting
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

  await updateState(supabase, state.id, stateUpdates);

  return {
    success: true,
    processed,
    successful,
    failed,
    skipped,
    startId,
    endId
  };
}

/**
 * Enrich a word using the Datamuse API
 */
async function enrichWordWithDatamuse(word) {
  try {
    const frequencyResponse = await fetch(`${DATAMUSE_API_BASE}?sp=${encodeURIComponent(word)}&md=f&max=1`);
    
    if (!frequencyResponse.ok) {
      throw new Error(`Datamuse API error: ${frequencyResponse.status}`);
    }
    
    const frequencyData = await frequencyResponse.json();
    
    // Extract frequency and syllables
    let frequency = null;
    let syllables = null;
    
    if (frequencyData && frequencyData.length > 0) {
      const match = frequencyData[0];
      
      // Extract frequency
      if (match.tags && match.tags.some(tag => tag.startsWith('f:'))) {
        const freqTag = match.tags.find(tag => tag.startsWith('f:'));
        frequency = parseInt(freqTag.substring(2));
      }
    }
    
    // Get syllable count in a separate request
    const syllableResponse = await fetch(`${DATAMUSE_API_BASE}?sp=${encodeURIComponent(word)}&md=s&max=1`);
    
    if (syllableResponse.ok) {
      const syllableData = await syllableResponse.json();
      
      if (syllableData && syllableData.length > 0) {
        const match = syllableData[0];
        
        if (match.numSyllables) {
          syllables = match.numSyllables;
        }
      }
    }
    
    // Return the enrichment data
    return {
      frequency,
      syllables
    };
  } catch (error) {
    console.error('Error in enrichWordWithDatamuse:', error);
    throw error;
  }
}

/**
 * Update a word with enrichment data
 */
async function updateWordWithEnrichmentData(supabase, wordId, data) {
  try {
    // Prepare the update data
    const updateData = {
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