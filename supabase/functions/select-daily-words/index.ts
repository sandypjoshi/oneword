// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Create a Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Define word difficulty levels
const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];

Deno.serve(async (req) => {
  try {
    // Parse request
    const { date, days = 1, force = false } = await req.json();
    
    if (!date) {
      return new Response(
        JSON.stringify({ error: 'Date parameter is required (YYYY-MM-DD)' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response(
        JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const results = {
      dates: [],
      selected: 0,
      skipped: 0,
      errors: []
    };
    
    // Process each date in the range
    const startDate = new Date(date);
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      try {
        // Select words for this date
        const selectedWords = await selectWordsForDate(dateStr, force);
        
        results.dates.push({
          date: dateStr,
          words: selectedWords.map(w => ({
            word: w.word,
            difficulty_level: w.difficulty_level,
            is_featured: w.is_featured || false
          }))
        });
        
        if (selectedWords.length > 0) {
          results.selected++;
        } else {
          results.skipped++;
        }
      } catch (error) {
        console.error(`Error selecting words for ${dateStr}:`, error);
        results.errors.push({ date: dateStr, error: (error as Error).message });
      }
    }
    
    return new Response(
      JSON.stringify(results),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Selects words for a specific date
 */
async function selectWordsForDate(date: string, force = false) {
  // Check if words already exist for this date
  const { data: existingWords } = await supabaseClient
    .from('daily_words')
    .select('*')
    .eq('date', date);
  
  if (existingWords && existingWords.length > 0 && !force) {
    console.log(`Words already selected for ${date}, skipping...`);
    return existingWords;
  }
  
  // If force is true, delete existing words
  if (existingWords && existingWords.length > 0 && force) {
    await supabaseClient
      .from('daily_words')
      .delete()
      .eq('date', date);
  }
  
  // Get recently used words (last 30 days)
  const pastDate = new Date(date);
  pastDate.setDate(pastDate.getDate() - 30);
  
  const { data: recentWords } = await supabaseClient
    .from('daily_words')
    .select('word')
    .gte('date', pastDate.toISOString().split('T')[0])
    .lt('date', date);
  
  const recentWordsSet = new Set((recentWords || []).map(w => w.word));
  
  // Selected words will be stored here
  const selectedWords = [];
  
  // For each difficulty level, select a word
  for (const level of DIFFICULTY_LEVELS) {
    // Get candidate words for this difficulty level
    const { data: candidates } = await supabaseClient
      .from('words')
      .select('id, word, difficulty_level, definitions, examples')
      .eq('difficulty_level', level)
      .not('word', 'in', Array.from(recentWordsSet)) // Exclude recently used words
      .order('RANDOM()') // Randomly select words
      .limit(10);
    
    if (!candidates || candidates.length === 0) {
      console.warn(`No ${level} words available for selection`);
      continue;
    }
    
    // Filter candidates to prefer words with good definitions
    const qualityWords = candidates.filter(w => 
      Array.isArray(w.definitions) && 
      w.definitions.length > 0 && 
      w.definitions[0]?.length > 5
    );
    
    // Select the best candidate
    const wordToUse = qualityWords.length > 0 ? qualityWords[0] : candidates[0];
    
    // Add to selected words
    selectedWords.push({
      date,
      word: wordToUse.word,
      difficulty_level: level,
      is_featured: false // We don't have featured_words in the schema
    });
    
    // Add to recently used set to avoid duplicates in the same batch
    recentWordsSet.add(wordToUse.word);
  }
  
  // Insert selected words into daily_words table
  if (selectedWords.length > 0) {
    const { error } = await supabaseClient
      .from('daily_words')
      .insert(selectedWords);
    
    if (error) {
      throw new Error(`Error storing daily words: ${error.message}`);
    }
  }
  
  return selectedWords;
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/select-daily-words' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"date":"2025-03-07","days":1,"force":true}'

*/ 