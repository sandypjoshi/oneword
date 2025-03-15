// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Create a Supabase client with the Auth context
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Datamuse API configuration
const DATAMUSE_BASE_URL = 'https://api.datamuse.com/words';
const DATAMUSE_RATE_LIMIT = 1000; // 1000ms between calls
let lastDatamuseCall = 0;

// Cache for Datamuse API results to avoid duplicate calls
const datamuseCache = new Map();

// Function to call Datamuse API with rate limiting
async function callDatamuseApi(params: Record<string, string>): Promise<any> {
  // Generate a cache key from the parameters
  const cacheKey = JSON.stringify(params);
  
  // Check cache first
  if (datamuseCache.has(cacheKey)) {
    console.log(`[CACHE] Using cached Datamuse result for ${cacheKey}`);
    return datamuseCache.get(cacheKey);
  }
  
  // Build URL with parameters
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  const url = `${DATAMUSE_BASE_URL}?${queryString}`;
  
  // Implement rate limiting
  const now = Date.now();
  const timeSinceLastCall = now - lastDatamuseCall;
  
  if (timeSinceLastCall < DATAMUSE_RATE_LIMIT) {
    const waitTime = DATAMUSE_RATE_LIMIT - timeSinceLastCall;
    console.log(`[DATAMUSE] Rate limiting - waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  try {
    console.log(`[DATAMUSE] Calling API: ${url}`);
    lastDatamuseCall = Date.now();
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Datamuse API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Store in cache
    datamuseCache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error(`[DATAMUSE] API call failed: ${error.message}`);
    throw error;
  }
}

// Get comprehensive word data from Datamuse API
async function getDatamuseWordData(word: string): Promise<{
  frequency: number,
  syllables: number,
  tags: string[],
  score: number
}> {
  try {
    // Get word data with frequency, syllable count, and part of speech
    const data = await callDatamuseApi({
      'sp': word,
      'md': 'fps', // f = frequency, p = parts of speech, s = syllables
      'max': '1'
    });
    
    if (!data || data.length === 0) {
      console.log(`[DATAMUSE] No data found for word "${word}"`);
      return {
        frequency: 0.5, // Default mid-range
        syllables: estimateSyllables(word),
        tags: [],
        score: 0.5
      };
    }
    
    const wordData = data[0];
    
    // Extract frequency metadata (format: f:123.45)
    let frequency = 0.5; // Default
    const freqTag = wordData.tags?.find((tag: string) => tag.startsWith('f:'));
    if (freqTag) {
      const freqValue = parseFloat(freqTag.substring(2));
      // Convert Datamuse frequency to our scale (higher value = more difficult)
      // Datamuse f: values range from ~0 to ~7 for common to rare
      const MAX_FREQ = 7;
      const normalizedFreq = Math.min(Math.log(freqValue + 1) / Math.log(MAX_FREQ + 1), 1);
      // Invert: higher value = more difficult (less frequent)
      frequency = 1 - normalizedFreq;
    }
    
    // Extract syllable count
    const syllables = wordData.numSyllables || estimateSyllables(word);
    
    // Extract part of speech tags
    const posTags = wordData.tags?.filter((tag: string) => !tag.includes(':')) || [];
    
    return {
      frequency,
      syllables,
      tags: posTags,
      score: wordData.score || 0
    };
  } catch (error) {
    console.error(`[DATAMUSE] Error getting data for word "${word}": ${error.message}`);
    
    // Return fallback values
    return {
      frequency: 0.5,
      syllables: estimateSyllables(word),
      tags: [],
      score: 0.5
    };
  }
}

// Calculate syllables when not available from API
function estimateSyllables(word: string): number {
  const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
  let count = 0;
  let prevIsVowel = false;
  
  for (const char of word.toLowerCase()) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevIsVowel) {
      count++;
    }
    prevIsVowel = isVowel;
  }
  
  // Handle special cases
  if (count === 0) count = 1;
  if (word.endsWith('e') && count > 1) count--;
  
  return count;
}

// Default thresholds for difficulty levels
const DIFFICULTY_THRESHOLDS = {
  beginner: 0.35,    // 0.0 - 0.35
  intermediate: 0.65 // 0.35 - 0.65
  // advanced: > 0.65
};

// Calculate comprehensive difficulty score
async function calculateDifficulty(word: string, customThresholds?: Record<string, number>): Promise<{
  score: number,
  level: string,
  metrics: Record<string, number>
}> {
  // Use custom thresholds if provided, otherwise use defaults
  const thresholds = customThresholds || DIFFICULTY_THRESHOLDS;
  
  try {
    // Get data from Datamuse API
    const wordData = await getDatamuseWordData(word);
    
    // Length score (normalized by max reasonable length of 15)
    const lengthScore = Math.min(word.length / 15, 1);
    
    // Syllable score (normalized by max reasonable syllables of 7)
    const syllableScore = Math.min(wordData.syllables / 7, 1);
    
    // Part of speech complexity factor (nouns easier, adjectives harder, etc.)
    let posComplexity = 0.5; // Default mid-range
    
    if (wordData.tags.includes('n')) posComplexity = 0.3; // Nouns (easier)
    else if (wordData.tags.includes('v')) posComplexity = 0.5; // Verbs (medium)
    else if (wordData.tags.includes('adj')) posComplexity = 0.7; // Adjectives (harder)
    else if (wordData.tags.includes('adv')) posComplexity = 0.8; // Adverbs (harder)
    
    // Check for hyphenation (increases difficulty)
    const hyphenationFactor = word.includes('-') ? 0.1 : 0;
    
    // Check for uncommon letter combinations
    const uncommonLettersFactor = (word.includes('z') || word.includes('x') || 
                                  word.includes('qu') || word.includes('ph')) ? 0.1 : 0;
    
    // Calculate weighted score
    // Frequency is most important (50%)
    // Syllables and length together (30%)
    // Other factors (20%)
    const score = (
      (wordData.frequency * 0.5) + 
      (syllableScore * 0.15) + 
      (lengthScore * 0.15) + 
      (posComplexity * 0.1) + 
      (hyphenationFactor * 0.05) + 
      (uncommonLettersFactor * 0.05)
    );
    
    // Ensure score is between 0 and 1
    const finalScore = Math.min(Math.max(score, 0), 1);
    
    // Determine difficulty level
    let level = 'beginner';
    if (finalScore > thresholds.intermediate) {
      level = 'advanced';
    } else if (finalScore > thresholds.beginner) {
      level = 'intermediate';
    }
    
    return {
      score: finalScore,
      level,
      metrics: {
        frequency: wordData.frequency,
        syllables: syllableScore,
        length: lengthScore,
        posComplexity,
        hyphenation: hyphenationFactor,
        uncommonLetters: uncommonLettersFactor
      }
    };
  } catch (error) {
    console.error(`[ERROR] Error calculating difficulty for "${word}": ${error.message}`);
    
    // Fallback to a simple calculation
    const lengthScore = Math.min(word.length / 15, 1);
    const syllables = estimateSyllables(word);
    const syllableScore = Math.min(syllables / 7, 1);
    
    // Simple score based on length and syllables
    const score = (lengthScore * 0.5) + (syllableScore * 0.5);
    
    // Determine difficulty level
    let level = 'beginner';
    if (score > thresholds.intermediate) {
      level = 'advanced';
    } else if (score > thresholds.beginner) {
      level = 'intermediate';
    }
    
    return {
      score,
      level,
      metrics: {
        frequency: 0.5,
        syllables: syllableScore,
        length: lengthScore,
        posComplexity: 0.5,
        hyphenation: 0,
        uncommonLetters: 0
      }
    };
  }
}

Deno.serve(async (req) => {
  try {
    // Parse request body
    const { word, includeFactors = false, thresholds } = await req.json();
    
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
    
    // Calculate difficulty score
    const difficultyResult = await calculateDifficulty(word, thresholds);
    
    // Update the word in the database if it exists
    if (wordData?.id) {
      await supabaseClient
        .from('words')
        .update({
          difficulty_score: difficultyResult.score,
          difficulty_level: difficultyResult.level
        })
        .eq('id', wordData.id);
    }
    
    // Prepare response
    const response: any = {
      word,
      score: difficultyResult.score,
      level: difficultyResult.level
    };
    
    // Include additional metrics if requested
    if (includeFactors) {
      response.factors = difficultyResult.metrics;
    }
    
    return new Response(
      JSON.stringify(response),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    
    return new Response(
      JSON.stringify({ error: error.message }),
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
