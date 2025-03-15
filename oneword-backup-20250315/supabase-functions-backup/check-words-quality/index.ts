// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Create a Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  try {
    const { limit = 20 } = await req.json();
    
    // Get count of all words
    const { count: totalWords, error: countError } = await supabaseClient
      .from('words')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw new Error(`Error counting words: ${countError.message}`);
    }
    
    // Get a sample of words
    const { data: wordSample, error: sampleError } = await supabaseClient
      .from('words')
      .select('id, word, definitions, examples, pos')
      .limit(limit);
      
    if (sampleError) {
      throw new Error(`Error fetching word sample: ${sampleError.message}`);
    }
    
    // Count and categorize sample words
    let wordsWithDefinitions = 0;
    let wordsWithGoodDefinitions = 0;
    let wordsWithoutDefinitions = 0;
    
    const goodWords = [];
    const badWords = [];
    
    for (const word of wordSample || []) {
      if (Array.isArray(word.definitions) && word.definitions.length > 0) {
        wordsWithDefinitions++;
        
        if (word.definitions[0]?.length > 5) {
          wordsWithGoodDefinitions++;
          goodWords.push(word);
        } else {
          badWords.push({ ...word, reason: 'Short definition' });
        }
      } else {
        wordsWithoutDefinitions++;
        badWords.push({ ...word, reason: 'No definitions' });
      }
    }
    
    // Get total with definitions
    const { count: totalWithDefs, error: defsCountError } = await supabaseClient
      .from('words')
      .select('*', { count: 'exact', head: true })
      .not('definitions', 'is', null);
    
    if (defsCountError) {
      throw new Error(`Error counting words with definitions: ${defsCountError.message}`);
    }
    
    // Get sample of multi-word phrases (containing spaces)
    const { data: phrasesSample, error: phrasesError } = await supabaseClient
      .from('words')
      .select('word')
      .ilike('word', '% %')
      .limit(10);
    
    if (phrasesError) {
      throw new Error(`Error fetching phrases: ${phrasesError.message}`);
    }
    
    // Get counts of words by POS
    const { data: posCounts, error: posError } = await supabaseClient.rpc('get_word_pos_counts');
    
    return new Response(
      JSON.stringify({
        totalWords,
        totalWithDefinitions: totalWithDefs,
        percentWithDefinitions: totalWithDefs ? (totalWithDefs / totalWords * 100).toFixed(2) : 0,
        
        // Sample statistics
        sampleSize: wordSample?.length || 0,
        sampleWithDefinitions: wordsWithDefinitions,
        sampleWithGoodDefinitions: wordsWithGoodDefinitions,
        sampleWithoutDefinitions: wordsWithoutDefinitions,
        percentGoodInSample: wordSample?.length ? (wordsWithGoodDefinitions / wordSample.length * 100).toFixed(2) : 0,
        
        // POS distribution
        posCounts: posCounts || [],
        
        // Multi-word samples
        containsSpaces: phrasesSample?.length || 0,
        phraseSamples: phrasesSample || [],
        
        // Examples
        goodWordSamples: goodWords.slice(0, 5),
        badWordSamples: badWords.slice(0, 5),
      }),
      { 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}); 