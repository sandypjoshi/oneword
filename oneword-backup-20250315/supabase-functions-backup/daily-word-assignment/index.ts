// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Daily Word Assignment Edge Function
 * 
 * This function is designed to be scheduled to run daily.
 * It selects words from the database, calculates difficulty using Datamuse API data,
 * and assigns them to the specified date.
 * 
 * Enhanced with comprehensive Datamuse API integration:
 * - Frequency data (f: tag)
 * - Syllable count (numSyllables)
 * - Part of speech (tags)
 * - Word relationships and contexts
 * 
 * Can be configured with:
 * - customDate: Optional specific date to assign words for (YYYY-MM-DD format)
 * - force: Whether to reassign words even if already assigned (default: false)
 * - useMockData: Use mock data instead of API calls (default: false)
 */

// Create a Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Define difficulty levels and thresholds
const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];
const DIFFICULTY_THRESHOLDS = {
  beginner: 0.35,    // 0.0 - 0.35
  intermediate: 0.65 // 0.35 - 0.65
  // advanced: > 0.65
};

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
    console.log(`[DATAMUSE] Rate limiting - waiting ${DATAMUSE_RATE_LIMIT - timeSinceLastCall}ms`);
    await new Promise(resolve => setTimeout(resolve, DATAMUSE_RATE_LIMIT - timeSinceLastCall));
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
async function getDatamuseWordData(word: string, useMock = false): Promise<{
  frequency: number,
  syllables: number,
  tags: string[],
  score: number
}> {
  if (useMock) {
    // Return mock data for testing
    return {
      frequency: Math.random(),
      syllables: Math.ceil(word.length / 3),
      tags: ['n', 'v', 'adj'].slice(0, Math.ceil(Math.random() * 2)),
      score: Math.random()
    };
  }
  
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
    
    // Additional contextual info from Datamuse if needed
    
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

// Calculate comprehensive difficulty score
async function calculateWordDifficulty(word: string, useMock = false): Promise<{
  score: number,
  level: string,
  metrics: Record<string, number>
}> {
  try {
    // Get data from Datamuse API
    const wordData = await getDatamuseWordData(word, useMock);
    
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
    if (finalScore > DIFFICULTY_THRESHOLDS.intermediate) {
      level = 'advanced';
    } else if (finalScore > DIFFICULTY_THRESHOLDS.beginner) {
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
    if (score > DIFFICULTY_THRESHOLDS.intermediate) {
      level = 'advanced';
    } else if (score > DIFFICULTY_THRESHOLDS.beginner) {
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
    // Parse request parameters
    const { date, force = false, useMockData = false } = await req.json() || {};
    
    // Calculate tomorrow's date if no date was provided
    const targetDate = date || (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    })();
    
    console.log(`[INFO] Assigning words for date: ${targetDate}, force: ${force}, mock: ${useMockData}`);
    
    // First, check the daily_words table schema to understand its structure
    const { data: dailyWordsColumns, error: schemaError } = await supabaseClient
      .from('daily_words')
      .select('*')
      .limit(1);
    
    let hasIsFeatured = false;
    
    if (!schemaError && dailyWordsColumns) {
      // Check if the sample row has an is_featured field
      const sampleRow = dailyWordsColumns[0];
      hasIsFeatured = sampleRow && 'is_featured' in sampleRow;
      console.log(`[INFO] Daily words schema ${hasIsFeatured ? 'has' : 'does not have'} is_featured column`);
    }
    
    // Check if words already exist for this date
    const { data: existingWords } = await supabaseClient
      .from('daily_words')
      .select('*')
      .eq('date', targetDate);
    
    if (existingWords && existingWords.length > 0 && !force) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Words already assigned for ${targetDate}`,
          data: existingWords
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // If force is true, delete existing words
    if (existingWords && existingWords.length > 0 && force) {
      await supabaseClient
        .from('daily_words')
        .delete()
        .eq('date', targetDate);
    }
    
    // Get recently used words (last 30 days)
    const pastDate = new Date(targetDate);
    pastDate.setDate(pastDate.getDate() - 30);
    const pastDateStr = pastDate.toISOString().split('T')[0];
    
    const { data: recentWords } = await supabaseClient
      .from('daily_words')
      .select('word')
      .gte('date', pastDateStr)
      .lt('date', targetDate);
    
    const recentWordsSet = new Set((recentWords || []).map(w => w.word));
    console.log(`[INFO] Found ${recentWordsSet.size} recently used words to exclude`);
    
    // Get a pool of candidate words
    let wordPool = [];
    
    // Try different views to get words with definitions
    // Try view: word_definitions
    const { data: wordsWithDefs, error: defsError } = await supabaseClient
      .from('word_definitions')
      .select('word_id, word, definition')
      .limit(200);
    
    if (!defsError && wordsWithDefs && wordsWithDefs.length > 0) {
      console.log(`[INFO] Found ${wordsWithDefs.length} words from word_definitions view`);
      
      wordPool = wordsWithDefs.map(w => ({ 
        id: w.word_id, 
        word: w.word, 
        hasDefinition: !!w.definition,
        definition: w.definition
      }));
    } else {
      // If word_definitions doesn't work, try complete_word_view
      const { data: completeWords, error: completeError } = await supabaseClient
        .from('complete_word_view')
        .select('id, word, definitions')
        .limit(200);
      
      if (!completeError && completeWords && completeWords.length > 0) {
        console.log(`[INFO] Found ${completeWords.length} words from complete_word_view`);
        
        wordPool = completeWords.map(w => ({ 
          id: w.id, 
          word: w.word, 
          hasDefinition: Array.isArray(w.definitions) && w.definitions.length > 0,
          definitions: w.definitions
        }));
      } else {
        // If all views fail, fall back to basic words table
        const { data: basicWords, error: basicError } = await supabaseClient
          .from('words')
          .select('id, word, pos')
          .limit(200);
        
        if (basicError || !basicWords || basicWords.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Could not retrieve words from database'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        console.log(`[INFO] Found ${basicWords.length} basic words`);
        
        wordPool = basicWords.map(w => ({ 
          id: w.id, 
          word: w.word, 
          hasDefinition: false,
          pos: w.pos
        }));
      }
    }
    
    // Filter for quality words
    const qualityWords = wordPool.filter(w => 
      // Must be a string (not null)
      typeof w.word === 'string' && 
      // No multi-word phrases
      !w.word.includes(' ') &&
      // No special characters except hyphens
      /^[a-zA-Z\-]+$/.test(w.word) &&
      // Must not be recently used
      !recentWordsSet.has(w.word)
    );
    
    if (qualityWords.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No quality words available after filtering'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[INFO] Found ${qualityWords.length} quality words after filtering`);
    
    // Shuffle the words
    const shuffledWords = [...qualityWords].sort(() => Math.random() - 0.5);
    
    // For each difficulty level, find words that match
    const selectedWords = [];
    const assignedDifficulties = new Map();
    
    // First pass: calculate difficulty for all words
    console.log(`[INFO] Calculating difficulties for candidate words...`);
    
    const wordDifficulties = [];
    
    // Process words in batches to avoid overwhelming Datamuse API
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < Math.min(shuffledWords.length, 50); i += BATCH_SIZE) {
      const batch = shuffledWords.slice(i, i + BATCH_SIZE);
      
      // Process batch in parallel with Promise.all
      const batchResults = await Promise.all(
        batch.map(async (wordObj) => {
          try {
            const difficultyResult = await calculateWordDifficulty(wordObj.word, useMockData);
            return {
              ...wordObj,
              difficulty: difficultyResult
            };
          } catch (e) {
            console.error(`[ERROR] Failed to calculate difficulty for "${wordObj.word}": ${e}`);
            return null;
          }
        })
      );
      
      // Filter out failed calculations
      const validResults = batchResults.filter(result => result !== null);
      wordDifficulties.push(...validResults);
    }
    
    console.log(`[INFO] Calculated difficulties for ${wordDifficulties.length} words`);
    
    // Group words by difficulty level
    const wordsByLevel = {
      beginner: wordDifficulties.filter(w => w.difficulty.level === 'beginner'),
      intermediate: wordDifficulties.filter(w => w.difficulty.level === 'intermediate'),
      advanced: wordDifficulties.filter(w => w.difficulty.level === 'advanced')
    };
    
    // Log the distribution
    console.log(`[INFO] Word distribution by level:`);
    console.log(`- Beginner: ${wordsByLevel.beginner.length} words`);
    console.log(`- Intermediate: ${wordsByLevel.intermediate.length} words`);
    console.log(`- Advanced: ${wordsByLevel.advanced.length} words`);
    
    // For each difficulty level, select a word
    const result = [];
    
    for (const level of DIFFICULTY_LEVELS) {
      const candidatesForLevel = wordsByLevel[level];
      
      if (!candidatesForLevel || candidatesForLevel.length === 0) {
        console.warn(`[WARN] No words available for difficulty level: ${level}`);
        continue;
      }
      
      // Select the best candidate - for now just the first one after shuffling
      const selectedWord = candidatesForLevel[Math.floor(Math.random() * candidatesForLevel.length)];
      
      console.log(`[INFO] Selected word for ${level}: "${selectedWord.word}" (score: ${selectedWord.difficulty.score.toFixed(3)})`);
      console.log(`[INFO] Metrics: ${JSON.stringify(selectedWord.difficulty.metrics)}`);
      
      // Create daily word entry based on schema
      const dailyWord: any = {
        date: targetDate,
        word: selectedWord.word,
        difficulty_level: level
      };
      
      // Only add is_featured if the schema supports it
      if (hasIsFeatured) {
        dailyWord.is_featured = false;
      }
      
      result.push(dailyWord);
      
      // Update the word in the database with the difficulty
      try {
        await supabaseClient
          .from('words')
          .update({
            difficulty_score: selectedWord.difficulty.score,
            difficulty_level: level
          })
          .eq('id', selectedWord.id);
      } catch (updateError) {
        console.error(`[ERROR] Error updating word difficulty: ${updateError.message}`);
        // Continue anyway - we don't want to fail the whole process for an update error
      }
    }
    
    // Insert words into daily_words table
    if (result.length > 0) {
      try {
        const { error } = await supabaseClient
          .from('daily_words')
          .insert(result);
        
        if (error) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Failed to insert words: ${error.message}`
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch (insertError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to insert words: ${insertError.message}`
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully assigned ${result.length} words for ${targetDate}`,
        data: result
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error(`[ERROR] General error: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}); 