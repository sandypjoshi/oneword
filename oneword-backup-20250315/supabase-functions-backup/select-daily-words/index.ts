// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Select Daily Words Function
 * 
 * Purpose: Selects appropriate words for a given date or date range
 * Features:
 * - Selects words based on difficulty levels (beginner, intermediate, advanced)
 * - Ensures diverse part-of-speech representation
 * - Filters out recently used words
 * - Supports date ranges for batch processing
 * - Can force recalculation of difficulty scores
 */

// Create a Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Configuration options
const CONFIG = {
  DEFAULT_WORDS_PER_DAY: 3,
  MIN_WORD_LENGTH: 3,
  LOOKBACK_DAYS: 90, // Don't repeat words used in the last 90 days
  DIFFICULTY_DISTRIBUTION: {
    beginner: 1,
    intermediate: 1, 
    advanced: 1
  },
  POS_DISTRIBUTION: {
    'n': 0.4,  // nouns
    'v': 0.3,  // verbs
    'adj': 0.2, // adjectives
    'adv': 0.1  // adverbs
  }
};

// Cache to store word eligibility results
const eligibilityCache = new Map();

/**
 * Main function to select words for a date or date range
 */
async function selectWordsForDate(dateStr: string, options = {}) {
  const {
    force = false,
    wordsPerDay = CONFIG.DEFAULT_WORDS_PER_DAY,
    skipFilters = false,
    useMockData = false
  } = options;
  
  try {
    console.log(`Processing date: ${dateStr}`);
    const targetDate = new Date(dateStr);
    
    if (isNaN(targetDate.getTime())) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }
    
    // Check if words already exist for this date
    const { data: existingWords } = await supabaseClient
      .from('daily_words')
      .select('*')
      .eq('date', dateStr);
      
    if (existingWords && existingWords.length > 0) {
      if (!force) {
        console.log(`Words already assigned for ${dateStr}. Use 'force: true' to reassign.`);
        return { 
          date: dateStr, 
          words: existingWords,
          message: 'Words already assigned for this date'
        };
      }
      
      // Delete existing words for this date if force flag is true
      console.log(`Force flag set. Removing existing words for ${dateStr}...`);
      await supabaseClient
        .from('daily_words')
        .delete()
        .eq('date', dateStr);
    }
    
    // Get all difficulty levels we need to assign
    const difficultyLevels = Object.keys(CONFIG.DIFFICULTY_DISTRIBUTION);
    const wordsNeeded = difficultyLevels.reduce((acc, level) => {
      acc[level] = CONFIG.DIFFICULTY_DISTRIBUTION[level];
      return acc;
    }, {});
    
    // Get words that have been used recently to avoid repetition
    const lookbackDate = new Date(targetDate);
    lookbackDate.setDate(lookbackDate.getDate() - CONFIG.LOOKBACK_DAYS);
    
    const { data: recentWords } = await supabaseClient
      .from('daily_words')
      .select('word_id')
      .gte('date', lookbackDate.toISOString().split('T')[0])
      .lt('date', targetDate.toISOString().split('T')[0]);
      
    const recentWordIds = recentWords ? recentWords.map(w => w.word_id) : [];
    console.log(`Found ${recentWordIds.length} recent words to exclude`);
    
    // Get part of speech distribution for variety
    const partOfSpeechDistribution = CONFIG.POS_DISTRIBUTION;
    
    // Select words for each difficulty level
    const selectedWords = [];
    let usedPOS = {}; // Track POS usage for this day
    
    for (const level of difficultyLevels) {
      const count = wordsNeeded[level];
      console.log(`Selecting ${count} ${level} words...`);
      
      // Get eligible words of this difficulty level
      const eligibleWords = await getEligibleWords({
        level,
        excludeIds: [...recentWordIds, ...selectedWords.map(w => w.id)],
        skipFilters,
        useMockData
      });
      
      if (eligibleWords.length === 0) {
        console.warn(`No eligible ${level} words found!`);
        continue;
      }
      
      // Prioritize words by part of speech to ensure variety
      const wordsByPriority = prioritizeWordsByPOS(eligibleWords, partOfSpeechDistribution, usedPOS);
      
      // Select the top N words based on priority
      const wordsToAdd = wordsByPriority.slice(0, count);
      
      // Update POS tracking
      wordsToAdd.forEach(word => {
        const pos = word.pos || 'unknown';
        usedPOS[pos] = (usedPOS[pos] || 0) + 1;
      });
      
      selectedWords.push(...wordsToAdd);
    }
    
    if (selectedWords.length === 0) {
      throw new Error('No eligible words found for assignment');
    }
    
    console.log(`Selected ${selectedWords.length} words for ${dateStr}`);
    
    // Insert selected words into daily_words table
    const dailyWordEntries = selectedWords.map(word => ({
      date: dateStr,
      word_id: word.id,
      difficulty_level: word.difficulty_level,
      word: word.word
    }));
    
    const { data: insertedWords, error } = await supabaseClient
      .from('daily_words')
      .insert(dailyWordEntries)
      .select();
      
    if (error) {
      throw new Error(`Error inserting daily words: ${error.message}`);
    }
    
    return {
      date: dateStr,
      words: insertedWords,
      message: 'Words successfully assigned'
    };
  } catch (error) {
    console.error(`Error selecting words for ${dateStr}:`, error);
    throw error;
  }
}

/**
 * Get eligible words based on specified criteria
 */
async function getEligibleWords({ 
  level, 
  excludeIds = [], 
  minLength = CONFIG.MIN_WORD_LENGTH,
  skipFilters = false,
  useMockData = false
}) {
  // If using mock data for testing
  if (useMockData) {
    return getMockWords(level);
  }
  
  // Generate cache key
  const cacheKey = `${level}_${excludeIds.length}_${minLength}_${skipFilters}`;
  
  // Check cache
  if (eligibilityCache.has(cacheKey)) {
    return eligibilityCache.get(cacheKey);
  }
  
  // Base query to get words of specified difficulty level
  let query = supabaseClient
    .from('words')
    .select(`
      id, 
      word, 
      pos, 
      difficulty_score,
      difficulty_level,
      definitions,
      examples
    `)
    .eq('difficulty_level', level);
    
  // Apply filters unless skipped
  if (!skipFilters) {
    // Filter by minimum length
    query = query.gte('length(word)', minLength);
    
    // Exclude recently used words
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }
    
    // Only include words that have definitions
    query = query.not('definitions', 'is', null);
  }
  
  // Limit to a reasonable number and order by score for consistent selection
  query = query.order('difficulty_score').limit(100);
  
  const { data, error } = await query;
  
  if (error) {
    console.error(`Error fetching eligible ${level} words:`, error);
    return [];
  }
  
  // Filter valid words (must have definition)
  const validWords = data.filter(word => {
    return word.word && 
           word.definitions && 
           word.word.length >= minLength &&
           !word.word.includes(' '); // No phrases
  });
  
  console.log(`Found ${validWords.length} eligible ${level} words`);
  
  // Store in cache
  eligibilityCache.set(cacheKey, validWords);
  
  return validWords;
}

/**
 * Prioritize words based on part of speech to ensure variety
 */
function prioritizeWordsByPOS(words, posDistribution, usedPOS) {
  // Clone the words array to avoid modifying the original
  const wordsWithScores = [...words];
  
  // Calculate priority score for each word based on POS distribution
  wordsWithScores.forEach(word => {
    const pos = word.pos || 'unknown';
    const posWeight = posDistribution[pos] || 0.1;
    const posUsageCount = usedPOS[pos] || 0;
    
    // Words with underrepresented POS get higher priority
    word.priorityScore = posWeight / (posUsageCount + 1);
  });
  
  // Sort by priority score (higher = better)
  return wordsWithScores.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Get mock words for testing
 */
function getMockWords(level) {
  const mockWords = {
    beginner: [
      { id: 1, word: 'plant', pos: 'n', difficulty_level: 'beginner', difficulty_score: 0.2, definitions: ['A living organism'], examples: ['The plant needs water'] },
      { id: 2, word: 'happy', pos: 'adj', difficulty_level: 'beginner', difficulty_score: 0.25, definitions: ['Feeling joy'], examples: ['She is happy'] },
      { id: 3, word: 'walk', pos: 'v', difficulty_level: 'beginner', difficulty_score: 0.3, definitions: ['Move by foot'], examples: ['I walk to work'] }
    ],
    intermediate: [
      { id: 4, word: 'masterpiece', pos: 'n', difficulty_level: 'intermediate', difficulty_score: 0.5, definitions: ['A work of art'], examples: ['The painting is a masterpiece'] },
      { id: 5, word: 'calculate', pos: 'v', difficulty_level: 'intermediate', difficulty_score: 0.55, definitions: ['To determine by math'], examples: ['Calculate the sum'] },
      { id: 6, word: 'influential', pos: 'adj', difficulty_level: 'intermediate', difficulty_score: 0.6, definitions: ['Having influence'], examples: ['An influential person'] }
    ],
    advanced: [
      { id: 7, word: 'relation', pos: 'n', difficulty_level: 'advanced', difficulty_score: 0.75, definitions: ['A connection between things'], examples: ['The relation between X and Y'] },
      { id: 8, word: 'elucidate', pos: 'v', difficulty_level: 'advanced', difficulty_score: 0.8, definitions: ['To explain clearly'], examples: ['Elucidate your reasoning'] },
      { id: 9, word: 'epiphanic', pos: 'adj', difficulty_level: 'advanced', difficulty_score: 0.85, definitions: ['Relating to an epiphany'], examples: ['An epiphanic moment'] }
    ]
  };
  
  return mockWords[level] || [];
}

/**
 * Process a date range
 */
async function processDateRange(startDate, endDate, options = {}) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format');
  }
  
  if (start > end) {
    throw new Error('Start date must be before end date');
  }
  
  const results = [];
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    try {
      const result = await selectWordsForDate(dateStr, options);
      results.push(result);
    } catch (error) {
      console.error(`Error processing ${dateStr}:`, error);
      results.push({
        date: dateStr,
        error: error.message
      });
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return results;
}

// Process the HTTP request
Deno.serve(async (req) => {
  try {
    const { 
      date, 
      startDate, 
      endDate, 
      force = false, 
      wordsPerDay = CONFIG.DEFAULT_WORDS_PER_DAY,
      skipFilters = false,
      useMockData = false
    } = await req.json();
    
    // Options object
    const options = { force, wordsPerDay, skipFilters, useMockData };
    
    // Process date range if provided
    if (startDate && endDate) {
      const results = await processDateRange(startDate, endDate, options);
      return new Response(
        JSON.stringify(results),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Process single date (default to today if not specified)
    const targetDate = date || new Date().toISOString().split('T')[0];
    const result = await selectWordsForDate(targetDate, options);
    
    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/select-daily-words' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"date":"2025-03-07","days":1,"force":true}'

*/ 