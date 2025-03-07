// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Create a Supabase client with the Auth context
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  try {
    // Parse request body
    const { word, includeFactors = false } = await req.json();
    
    if (!word) {
      return new Response(
        JSON.stringify({ error: 'Word parameter is required' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get word data with proper joins based on the schema
    const { data: wordData, error: wordError } = await supabaseClient
      .from('words')
      .select(`
        id, 
        word, 
        pos, 
        difficulty_score,
        difficulty_level,
        polysemy,
        definitions,
        examples,
        frequency
      `)
      .eq('word', word.toLowerCase())
      .maybeSingle();
    
    if (wordError || !wordData) {
      return new Response(
        JSON.stringify({ error: `Word "${word}" not found in database` }),
        { headers: { 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Get related synsets for this word
    const { data: wordSynsets, error: synsetError } = await supabaseClient
      .from('word_synsets')
      .select('synset_id, synsets:synset_id(id, definition, pos, domain)')
      .eq('word_id', wordData.id);
      
    if (synsetError) {
      console.error('Error fetching synsets:', synsetError);
    }
    
    // Get additional metadata if available
    const { data: metadata } = await supabaseClient
      .from('word_metadata')
      .select('*')
      .eq('word', word.toLowerCase())
      .maybeSingle();
    
    // Check if we already have a calculated difficulty score
    if (wordData.difficulty_score !== null && wordData.difficulty_level) {
      // Return existing difficulty score if already calculated
      const result: any = {
        word: wordData.word,
        score: wordData.difficulty_score,
        level: wordData.difficulty_level
      };
      
      // Include factors if requested and recalculate them for display
      if (includeFactors) {
        // Calculate factors for display only
        const lengthScore = calculateLengthScore(wordData.word);
        const syllableScore = calculateSyllableScore(wordData.word);
        const polysemyScore = calculatePolysemyScore(wordData.polysemy || (wordSynsets?.length || 1));
        const frequencyScore = calculateFrequencyScore(wordData, metadata);
        const domainScore = calculateDomainScore(wordSynsets?.map(ws => ws.synsets) || []);
        
        result.factors = {
          length: { value: wordData.word.length, score: lengthScore },
          syllables: { value: estimateSyllableCount(wordData.word), score: syllableScore },
          polysemy: { value: wordData.polysemy || (wordSynsets?.length || 1), score: polysemyScore },
          frequency: { value: wordData.frequency, score: frequencyScore },
          domain: { value: null, score: domainScore }
        };
      }
      
      return new Response(
        JSON.stringify(result),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Calculate difficulty factors
    const lengthScore = calculateLengthScore(wordData.word);
    const syllableScore = calculateSyllableScore(wordData.word);
    const polysemyScore = calculatePolysemyScore(wordData.polysemy || (wordSynsets?.length || 1));
    const frequencyScore = calculateFrequencyScore(wordData, metadata);
    const domainScore = calculateDomainScore(wordSynsets?.map(ws => ws.synsets) || []);
    
    // Calculate composite score with weights
    const score = (
      0.15 * lengthScore +         // Reduced from 0.30
      0.15 * syllableScore +       // Reduced from 0.25
      0.10 * (1 - polysemyScore) + // Reduced from 0.20
      0.50 * (1 - frequencyScore) + // Increased from 0.15 - now the dominant factor
      0.10 * domainScore
    );
    
    // Determine difficulty level
    const level = getDifficultyLevel(score);
    
    // Update word difficulty in database
    await supabaseClient
      .from('words')
      .update({
        difficulty_score: score,
        difficulty_level: level,
        updated_at: new Date().toISOString()
      })
      .eq('id', wordData.id);
    
    // Create result object
    const result: any = {
      word: wordData.word,
      score: Math.round(score * 100) / 100, // Round to 2 decimal places
      level
    };
    
    // Include factor details if requested
    if (includeFactors) {
      result.factors = {
        length: { value: wordData.word.length, score: lengthScore },
        syllables: { value: estimateSyllableCount(wordData.word), score: syllableScore },
        polysemy: { value: wordData.polysemy || (wordSynsets?.length || 1), score: polysemyScore },
        frequency: { value: wordData.frequency, score: frequencyScore },
        domain: { value: null, score: domainScore }
      };
    }
    
    return new Response(
      JSON.stringify(result),
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
 * Maps score to difficulty level
 */
function getDifficultyLevel(score: number): string {
  if (score < 0.33) return 'beginner';
  if (score < 0.67) return 'intermediate';
  return 'advanced';
}

/**
 * Calculates word length score (0-1)
 * Longer words tend to be more difficult
 */
function calculateLengthScore(word: string): number {
  const length = word.length;
  
  // Very short words (1-3 chars) get lowest score
  if (length <= 3) return 0.0;
  
  // Most words are between 4-10 chars
  if (length <= 5) return 0.2;
  if (length <= 7) return 0.4;
  if (length <= 9) return 0.6;
  if (length <= 12) return 0.8;
  
  // Very long words (13+ chars) get highest score
  return 1.0;
}

/**
 * Estimates syllable count for English words
 */
function estimateSyllableCount(word: string): number {
  word = word.toLowerCase();
  if (!word) return 0;
  
  // Remove non-alphanumeric characters
  word = word.replace(/[^a-z]/g, '');
  
  // Special cases
  if (word.length <= 3) return 1;
  
  // Count vowel groups as syllables
  const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
  let count = 0;
  let prevIsVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !prevIsVowel) {
      count++;
    }
    prevIsVowel = isVowel;
  }
  
  // Handle silent e
  if (word.length > 2 && word.endsWith('e') && !vowels.includes(word[word.length - 2])) {
    count--;
  }
  
  // Minimum 1 syllable
  return Math.max(count, 1);
}

/**
 * Calculates syllable-based difficulty score
 */
function calculateSyllableScore(word: string): number {
  const syllableCount = estimateSyllableCount(word);
  
  // Map syllable count to difficulty score
  if (syllableCount === 1) return 0.0;
  if (syllableCount === 2) return 0.3;
  if (syllableCount === 3) return 0.6;
  return Math.min(0.9, 0.6 + (syllableCount - 3) * 0.1); // Max out at 0.9
}

/**
 * Calculates polysemy score based on number of meanings
 * More meanings generally indicate more common/basic words
 */
function calculatePolysemyScore(synsetsCount: number): number {
  // Words with more meanings tend to be more common/basic
  if (synsetsCount >= 8) return 1.0; // Very polysemous words (high score = common)
  if (synsetsCount >= 5) return 0.8;
  if (synsetsCount >= 3) return 0.6;
  if (synsetsCount === 2) return 0.4;
  return 0.2; // Words with only one meaning are often more specialized
}

/**
 * Calculates frequency score using available data
 * Higher return value indicates a more common word (lower difficulty)
 */
function calculateFrequencyScore(wordData: any, metadata: any): number {
  // Use frequency from word table if available (normalized value from SUBTLEX)
  if (wordData.frequency !== null && wordData.frequency !== undefined) {
    return wordData.frequency; // Already normalized to 0-1 scale
  }
  
  // Fallback to metadata frequency if available
  if (metadata?.frequency !== null && metadata?.frequency !== undefined) {
    return metadata.frequency; // Assuming normalized
  }
  
  // If we have Zipf value in metadata (from SUBTLEX or other sources)
  if (metadata?.zipf_value !== null && metadata?.zipf_value !== undefined) {
    // Zipf values typically range from 1 (very rare) to 7 (extremely common)
    // Convert to 0-1 scale
    const zipf = parseFloat(metadata.zipf_value);
    return Math.min(Math.max((zipf - 1) / 6, 0), 1);
  }
  
  // If no direct frequency data, estimate based on polysemy as a fallback
  // More meanings (higher polysemy) generally indicates more common words
  const polysemyScore = wordData.polysemy 
    ? calculatePolysemyScore(wordData.polysemy) 
    : 0.3;
    
  return polysemyScore * 0.7; // Scale down since this is just an estimate
}

/**
 * Calculates domain specificity score using synset domains
 */
function calculateDomainScore(synsets: any[]): number {
  // Default moderate score if we can't determine
  if (!synsets || synsets.length === 0) {
    return 0.5;
  }
  
  // Check domains for technical domains
  const technicalDomains = [
    'medical', 'technical', 'scientific', 'academic', 'legal',
    'biology', 'chemistry', 'physics', 'mathematics',
    'finance', 'economics', 'technology', 'engineering'
  ];
  
  let domainSpecificCount = 0;
  
  for (const synset of synsets) {
    if (!synset) continue;
    
    // Check domain field
    if (synset.domain && typeof synset.domain === 'string') {
      const domain = synset.domain.toLowerCase();
      if (technicalDomains.some(td => domain.includes(td))) {
        domainSpecificCount++;
        continue;
      }
    }
    
    // Check definition for technical terms as backup
    const definition = synset.definition?.toLowerCase() || '';
    if (technicalDomains.some(td => definition.includes(td))) {
      domainSpecificCount++;
    }
  }
  
  // Calculate domain score (higher = more specialized)
  const totalSynsets = synsets.filter(s => s).length;
  return Math.min(0.3 + (domainSpecificCount / Math.max(totalSynsets, 1)) * 0.7, 1.0);
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/calculate-word-difficulty' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"word":"example","includeFactors":true}'

*/
