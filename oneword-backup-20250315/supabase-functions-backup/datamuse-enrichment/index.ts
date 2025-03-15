import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// Configuration
const RATE_LIMIT_MS = 100; // Wait time between API calls to respect rate limits
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Supabase client setup
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  // Use service role key for database access with fall back options
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || 
  Deno.env.get("SUPABASE_SERVICE_KEY") || 
  Deno.env.get("SUPABASE_ANON_KEY") || ""
);

// Datamuse API endpoints
interface DatamuseResponse {
  word: string;
  score: number;
  tags?: string[];
  numSyllables?: number;
  defs?: string[];
}

// Function to get base word data (frequency, syllables)
async function fetchWordBaseData(word: string): Promise<any> {
  try {
    const response = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=frs`);
    
    if (!response.ok) {
      throw new Error(`Datamuse API error: ${response.status}`);
    }
    
    const data: DatamuseResponse[] = await response.json();
    const exactMatch = data.find(entry => entry.word === word.toLowerCase());
    
    if (!exactMatch) {
      return { 
        found: false, 
        message: "Word not found in Datamuse API"
      };
    }
    
    // Extract frequency from tags if available (f:XX.XXXX format)
    let frequency = null;
    if (exactMatch.tags) {
      const freqTag = exactMatch.tags.find(tag => tag.startsWith('f:'));
      if (freqTag) {
        frequency = freqTag.substring(2); // Remove 'f:' prefix
      }
    }
    
    return {
      found: true,
      word: exactMatch.word,
      frequency: frequency,
      syllables: exactMatch.numSyllables || null,
      score: exactMatch.score
    };
  } catch (error) {
    console.error(`Error fetching word data for ${word}:`, error);
    return { 
      found: false, 
      message: `API error: ${error.message}`
    };
  }
}

// Process a single word - get frequency and syllable data
async function processWord(wordObj: { id: number, word: string }): Promise<any> {
  try {
    // Get base linguistic data
    const baseData = await fetchWordBaseData(wordObj.word);
    
    if (!baseData.found) {
      return {
        wordId: wordObj.id,
        word: wordObj.word,
        success: false,
        message: baseData.message || "Word not found"
      };
    }
    
    // Prepare frequency value - convert to integer if it's a float
    let frequencyValue = null;
    if (baseData.frequency) {
      // Check if it's a numeric value
      const numValue = parseFloat(baseData.frequency);
      if (!isNaN(numValue)) {
        // Convert to integer - multiply by 1000 to preserve precision
        frequencyValue = Math.round(numValue * 1000);
      }
    }
    
    // Update word with frequency and syllable data
    const { error: updateError } = await supabaseClient
      .from('words')
      .update({
        frequency: frequencyValue, // Now an integer
        syllable_count: baseData.syllables,
        syllables: baseData.syllables, // Update both columns for compatibility
        updated_at: new Date().toISOString()
      })
      .eq('id', wordObj.id);
    
    if (updateError) {
      throw new Error(`Error updating word data: ${updateError.message}`);
    }
    
    return {
      wordId: wordObj.id,
      word: wordObj.word,
      success: true,
      frequency: frequencyValue,
      syllables: baseData.syllables
    };
  } catch (error) {
    console.error(`Error processing word ${wordObj.word}:`, error);
    return {
      wordId: wordObj.id,
      word: wordObj.word,
      success: false,
      message: error.message
    };
  }
}

// Process a batch of words
async function processWordBatch(wordIds: number[] = [], startId: number = 0, batchSize: number = 10): Promise<any> {
  // Get batch of words - either by specific IDs or by startId+batchSize
  let words;
  let error;
  
  if (wordIds && wordIds.length > 0) {
    // Get words by specific IDs
    const { data, error: queryError } = await supabaseClient
      .from('words')
      .select('id, word')
      .in('id', wordIds);
    
    words = data;
    error = queryError;
  } else {
    // Fall back to the original behavior using startId and batchSize
    const { data, error: queryError } = await supabaseClient
      .from('words')
      .select('id, word')
      .gt('id', startId)
      .order('id')
      .limit(batchSize);
    
    words = data;
    error = queryError;
  }
  
  if (error) {
    return { error: error.message };
  }
  
  if (!words || words.length === 0) {
    return { message: "No words to process", processed: 0 };
  }
  
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
    lastProcessedId: startId,
    wordResults: [] as any[]
  };
  
  // Process each word
  for (const wordObj of words) {
    results.processed++;
    results.lastProcessedId = wordObj.id;
    
    try {
      // Skip if no word
      if (!wordObj.word) {
        continue;
      }
      
      const wordResult = await processWord(wordObj);
      results.wordResults.push(wordResult);
      
      if (wordResult.success) {
        results.successful++;
      } else {
        results.failed++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
    } catch (e) {
      results.failed++;
      console.error(`Error processing word ${wordObj.word}:`, e);
    }
  }
  
  return {
    ...results,
    message: `Processed ${results.processed} words: ${results.successful} successful, ${results.failed} failed.`,
    nextStartId: results.lastProcessedId
  };
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { method } = req;
    
    if (method === "POST") {
      const { wordIds = [], startId = 0, batchSize = 10 } = await req.json();
      const result = await processWordBatch(wordIds, startId, batchSize);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 