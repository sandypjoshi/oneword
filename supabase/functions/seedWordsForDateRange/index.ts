/**
 * Supabase Edge Function: seedWordsForDateRange
 * 
 * Populates words for the specified date range:
 * 1. Generates a range of dates from startDate to endDate
 * 2. For each day, assigns words for each difficulty level
 * 3. Fetches detailed word info from WordsAPI and Twinword API
 * 4. Stores the word with distractors in the database
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Define enums first to avoid reference errors
enum WordDifficulty {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced"
}

// API Configuration
const WORDSAPI_KEY = Deno.env.get("WORDSAPI_KEY") || "";
const WORDSAPI_HOST = "wordsapiv1.p.rapidapi.com";
const WORDSAPI_BASE_URL = `https://${WORDSAPI_HOST}/words`;

// Twinword API Configuration
const TWINWORD_API_KEY = Deno.env.get("TWINWORD_API_KEY") || "";
const TWINWORD_HOST = "twinword-word-graph-dictionary.p.rapidapi.com";
const TWINWORD_BASE_URL = `https://${TWINWORD_HOST}/associate`;

// Difficulty mapping from numeric score to WordDifficulty enum
const DIFFICULTY_RANGES = {
  [WordDifficulty.BEGINNER]: { min: 1, max: 3.5 },
  [WordDifficulty.INTERMEDIATE]: { min: 3.5, max: 6 },
  [WordDifficulty.ADVANCED]: { min: 6, max: 10 }
};

// Word data structure
interface WordDetails {
  word: string;
  pronunciation?: string;
  partOfSpeech?: string;
  definitions: { definition: string, partOfSpeech: string }[];
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
  metadata?: any;
  difficultyScore?: number;
}

/**
 * Main function to seed words for date range
 */
const seedWordsForDateRange = async (
  startDate: string, 
  endDate: string
): Promise<{
  success: boolean;
  message: string;
  dates?: string[];
}> => {
  console.log(`Seeding words from ${startDate} to ${endDate}`);
  
  // Create Supabase client
  const supabase = createSupabaseClient();
  
  try {
    // Generate date range
    const dates = generateDateRange(startDate, endDate);
    console.log(`Generated ${dates.length} dates to process`);
    
    // Process each date
    const results = [];
    for (const date of dates) {
      try {
        console.log(`Processing date: ${date}`);
        
        // Skip if words already exist for this date
        const wordsExist = await checkIfWordsExistForDate(supabase, date);
        if (wordsExist) {
          console.log(`Words already exist for ${date}, skipping...`);
          results.push({ 
            date, 
            status: 'skipped', 
            message: 'Words already exist for this date' 
          });
          continue;
        }
        
        // Get list of words already used
        const usedWords = await getUsedWords(supabase);
        console.log(`Found ${usedWords.length} words already used`);
        
        // Add a word for each difficulty level
        await assignWordToDate(supabase, date, WordDifficulty.BEGINNER, usedWords);
        await assignWordToDate(supabase, date, WordDifficulty.INTERMEDIATE, usedWords);
        await assignWordToDate(supabase, date, WordDifficulty.ADVANCED, usedWords);
        
        results.push({ 
          date, 
          status: 'success', 
          message: 'Words added successfully' 
        });
      } catch (error) {
        console.error(`Error processing date ${date}:`, error);
        results.push({ 
          date, 
          status: 'error', 
          message: error.message 
        });
      }
    }
    
    // Count successes and errors
    const successes = results.filter(r => r.status === 'success').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const errors = results.filter(r => r.status === 'error').length;
    
    return {
      success: true,
      message: `Processed ${dates.length} dates: ${successes} successful, ${skipped} skipped, ${errors} errors`,
      dates: dates
    };
  } catch (error) {
    console.error('Error in seedWordsForDateRange:', error);
    return {
      success: false,
      message: `Error seeding words: ${error.message}`
    };
  }
};

/**
 * Generate a range of dates from start to end
 */
const generateDateRange = (startDateStr: string, endDateStr: string): string[] => {
  const dates: string[] = [];
  
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  
  // Validate dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date format. Please use YYYY-MM-DD format.');
  }
  
  // Ensure start date is before end date
  if (startDate > endDate) {
    throw new Error('Start date must be before end date.');
  }
  
  // Generate date range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

/**
 * Check if words already exist for a specific date
 */
const checkIfWordsExistForDate = async (supabase: any, date: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('daily_words')
      .select('id')
      .eq('date', date);
    
    if (error) throw error;
    
    return data && data.length > 0;
  } catch (error) {
    console.error(`Error checking if words exist for date ${date}:`, error);
    throw error;
  }
};

/**
 * Get words that have already been used
 */
const getUsedWords = async (supabase: any): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('daily_words')
      .select('words(word)');
    
    if (error) throw error;
    
    const usedWords = data
      .filter(entry => entry.words)
      .map(entry => entry.words.word);
    
    return usedWords;
  } catch (error) {
    console.error('Error fetching used words:', error);
    return [];
  }
};

/**
 * Assign a word for a specific date and difficulty
 */
const assignWordToDate = async (
  supabase: any,
  date: string,
  difficulty: WordDifficulty,
  usedWords: string[]
): Promise<void> => {
  try {
    console.log(`Finding word for date ${date}, difficulty ${difficulty}`);
    
    // Get random word for this difficulty
    const word = await getRandomWord(difficulty, usedWords);
    console.log(`Selected word: ${word}`);
    
    // Get detailed information about the word
    const wordDetails = await getWordDetails(word);
    
    // Choose primary definition for the quiz
    // Select the first definition that matches the primary part of speech
    let primaryDefinition = '';
    
    if (wordDetails.definitions && wordDetails.definitions.length > 0) {
      // Find a definition matching the primary part of speech if possible
      const matchingDef = wordDetails.definitions.find(
        def => def.partOfSpeech === wordDetails.partOfSpeech
      );
      
      if (matchingDef) {
        primaryDefinition = matchingDef.definition;
      } else {
        // Otherwise use the first definition
        primaryDefinition = wordDetails.definitions[0].definition;
      }
    }
    
    // Generate wrong options for the quiz
    const wrongOptions = await generateWrongOptions(
      supabase,
      word,
      primaryDefinition,
      wordDetails.partOfSpeech || '',
      difficulty
    );
    
    // Insert into the database
    const wordEntry = {
      word,
      phonetic: wordDetails.pronunciation || '',
      part_of_speech: wordDetails.partOfSpeech || '',
      difficulty,
      definition: primaryDefinition,
      examples: wordDetails.examples ? wordDetails.examples.join(' | ') : '',
      quiz_options: [primaryDefinition, ...wrongOptions].sort(() => Math.random() - 0.5),
      correct_answer: primaryDefinition,
      metadata: wordDetails.metadata || {}
    };
    
    // Insert into words table
    const { data: wordData, error: wordError } = await supabase
      .from('words')
      .upsert(wordEntry)
      .select('id');
    
    if (wordError) throw wordError;
    
    // Insert into daily_words table
    const { error: dailyWordError } = await supabase
      .from('daily_words')
      .insert({
        date,
        difficulty,
        word_id: wordData[0].id
      });
    
    if (dailyWordError) throw dailyWordError;
    
    console.log(`Successfully added word "${word}" (${difficulty}) for date ${date}`);
  } catch (error) {
    console.error(`Error assigning word for date ${date}, difficulty ${difficulty}:`, error);
    throw error;
  }
};

/**
 * Get a random word by difficulty level
 */
const getRandomWord = async (
  difficulty: WordDifficulty,
  usedWords: string[]
): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    try {
      attempts++;
      
      // 1. Get a random word from WordsAPI
      const randomLetterStart = String.fromCharCode(97 + Math.floor(Math.random() * 26));
      const url = `${WORDSAPI_BASE_URL}/?random=true&hasDetails=definitions&letterPattern=^${randomLetterStart}.*&frequencyMin=3`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': WORDSAPI_KEY,
          'x-rapidapi-host': WORDSAPI_HOST
        }
      });
      
      if (!response.ok) {
        throw new Error(`WordsAPI error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const word = data.word;
      
      // Skip words less than 3 characters or more than 10
      if (!word || word.length < 3 || word.length > 10 || word.includes(' ')) {
        console.log(`Skipping inappropriate word: ${word}`);
        continue;
      }
      
      // Skip words that have already been used
      if (usedWords.includes(word)) {
        console.log(`Word '${word}' has already been used, trying another...`);
        continue;
      }
      
      // 2. Verify word difficulty with Twinword API
      const twinwordData = await fetchFromTwinword(word, supabase);
      
      // Parse difficulty (default to 5 if not available)
      const difficultyScore = parseFloat(twinwordData.difficulty) || 5;
      
      // Check if the word matches our target difficulty
      if (!isCorrectDifficulty(difficultyScore, difficulty)) {
        console.log(`Word '${word}' has difficulty ${difficultyScore}, but we need ${difficulty}. Trying another...`);
        continue;
      }
      
      console.log(`Selected word '${word}' with difficulty score ${difficultyScore} for ${difficulty} level`);
      return word;
      
    } catch (error) {
      console.error(`Error in attempt ${attempts}/${maxAttempts} to get a random word:`, error);
      // Continue to the next attempt
    }
  }
  
  // Fallback words if all attempts fail, categorized by difficulty
  const fallbackWords = {
    [WordDifficulty.BEGINNER]: ['book', 'tree', 'fish', 'house', 'ball', 'car'],
    [WordDifficulty.INTERMEDIATE]: ['balance', 'feature', 'impact', 'journey', 'resource'],
    [WordDifficulty.ADVANCED]: ['ambiguous', 'consensus', 'infrastructure', 'phenomenon', 'theoretical']
  };
  
  // Pick a random fallback word that matches the difficulty
  // and hasn't been used before (if possible)
  const fallbackOptions = fallbackWords[difficulty].filter(word => !usedWords.includes(word));
  
  // If all fallbacks have been used, just pick any one
  const options = fallbackOptions.length > 0 ? fallbackOptions : fallbackWords[difficulty];
  const randomIndex = Math.floor(Math.random() * options.length);
  const fallbackWord = options[randomIndex];
  
  console.warn(`Failed to get a random word after ${maxAttempts} attempts. Using fallback word: ${fallbackWord}`);
  return fallbackWord;
};

/**
 * Create a Supabase client with service role
 */
const createSupabaseClient = () => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
};

/**
 * Enhanced function to fetch and cache Twinword API associations
 */
const fetchFromTwinword = async (word: string, supabase: any): Promise<any> => {
  try {
    // First check if we have cached results
    const { data: cachedData, error: cacheError } = await supabase
      .from('twinword_associations')
      .select('associated_words')
      .eq('word', word)
      .maybeSingle();
    
    if (!cacheError && cachedData) {
      console.log(`Using cached Twinword data for "${word}"`);
      return cachedData.associated_words;
    }
    
    // No cached data found, make API call
    const url = `${TWINWORD_BASE_URL}?entry=${encodeURIComponent(word)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': TWINWORD_API_KEY,
        'X-RapidAPI-Host': TWINWORD_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`Twinword API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Cache the response for future use
    if (result && result.result_code === "200") {
      try {
        await supabase
          .from('twinword_associations')
          .upsert({
            word,
            associated_words: result
          }, { onConflict: 'word' });
        
        console.log(`Cached Twinword data for "${word}"`);
      } catch (cacheError) {
        console.error(`Error caching Twinword data: ${cacheError}`);
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error fetching from Twinword: ${error}`);
    return null;
  }
};

/**
 * Checks if a difficulty score is within the correct range for the specified difficulty level
 */
const isCorrectDifficulty = (score: number, targetDifficulty: WordDifficulty): boolean => {
  const range = DIFFICULTY_RANGES[targetDifficulty];
  return score >= range.min && score < range.max;
};

/**
 * Sort associations by relevance score in descending order
 */
const sortByRelevance = (associations: string): string[] => {
  if (!associations) return [];
  
  // Split and clean the association string
  return associations
    .split(',')
    .map(word => word.trim())
    .filter(word => word.length > 0);
};

/**
 * Get detailed information about a word
 */
const getWordDetails = async (word: string): Promise<WordDetails> => {
  // Create a base word details object with defaults
    const wordDetails: WordDetails = {
    word,
    definitions: [],
  };
  
  try {
    // 1. Fetch data from WordsAPI
    const wordsApiUrl = `${WORDSAPI_BASE_URL}/${encodeURIComponent(word)}`;
    const wordsApiResponse = await fetch(wordsApiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': WORDSAPI_KEY,
        'x-rapidapi-host': WORDSAPI_HOST
      }
    });
    
    if (!wordsApiResponse.ok) {
      console.warn(`WordsAPI error for word "${word}": ${wordsApiResponse.status}`);
      // Continue to try Twinword as fallback
    } else {
      const wordsApiData = await wordsApiResponse.json();
      
      // Process WordsAPI data
      wordDetails.pronunciation = wordsApiData.pronunciation?.all || '';
      
      // Get primary part of speech
      const partOfSpeechCounts: Record<string, number> = {};
      (wordsApiData.results || []).forEach((result: any) => {
        const pos = result.partOfSpeech;
        if (pos) {
          partOfSpeechCounts[pos] = (partOfSpeechCounts[pos] || 0) + 1;
        }
      });
      
      // Find most common part of speech
      let maxCount = 0;
      for (const [pos, count] of Object.entries(partOfSpeechCounts)) {
        if (count > maxCount) {
          maxCount = count;
          wordDetails.partOfSpeech = pos;
        }
      }
      
      // Extract definitions
      if (wordsApiData.results) {
        wordDetails.definitions = wordsApiData.results.map((result: any) => ({
          definition: result.definition,
          partOfSpeech: result.partOfSpeech
        }));
      }
      
      // Extract examples
      if (wordsApiData.results) {
        wordDetails.examples = wordsApiData.results
          .filter((result: any) => result.examples && result.examples.length > 0)
          .flatMap((result: any) => result.examples)
          .slice(0, 3); // Take up to 3 examples
      }
      
      // Extract synonyms and antonyms
      wordDetails.synonyms = wordsApiData.results
        ?.flatMap((result: any) => result.synonyms || [])
        .filter((syn: string, i: number, arr: string[]) => arr.indexOf(syn) === i)
        .slice(0, 10);
      
      wordDetails.antonyms = wordsApiData.results
        ?.flatMap((result: any) => result.antonyms || [])
        .filter((ant: string, i: number, arr: string[]) => arr.indexOf(ant) === i)
        .slice(0, 5);
      
      // Store additional metadata
      wordDetails.metadata = {
        frequency: wordsApiData.frequency,
        syllables: wordsApiData.syllables,
      };
    }
    
    // 2. Enrich with Twinword API data
    try {
      const twinwordData = await fetchFromTwinword(word, supabase);
      
      if (twinwordData) {
        // Set difficulty score
        wordDetails.difficultyScore = parseFloat(twinwordData.difficulty) || 5;
        
        // Add Twinword associations to synonyms if available
        if (twinwordData.assoc_word) {
          const associations = sortByRelevance(twinwordData.assoc_word);
          
          // If we don't have synonyms from WordsAPI, use associations
          if (!wordDetails.synonyms || wordDetails.synonyms.length === 0) {
            wordDetails.synonyms = associations.slice(0, 10);
          } 
          // Otherwise, combine them without duplicates
          else {
            const existingSynonyms = new Set(wordDetails.synonyms);
            for (const assoc of associations) {
              if (!existingSynonyms.has(assoc)) {
                wordDetails.synonyms.push(assoc);
                existingSynonyms.add(assoc);
                // Limit to 15 total synonyms
                if (wordDetails.synonyms.length >= 15) break;
              }
            }
          }
        }
        
        // Add data to metadata
        wordDetails.metadata = {
          ...wordDetails.metadata,
          twinword: {
            difficulty: twinwordData.difficulty,
            associations: twinwordData.assoc_word,
          }
        };
      }
    } catch (twinwordError) {
      console.error(`Error enriching with Twinword data for "${word}":`, twinwordError);
      // Continue with whatever data we have from WordsAPI
    }

    return wordDetails;
  } catch (error) {
    console.error(`Error getting word details for "${word}":`, error);
    // Return basic structure with minimal data
    return {
      word,
      definitions: [{ definition: `A word with no available definition`, partOfSpeech: '' }],
    };
  }
};

/**
 * Enhanced generateWrongOptions function to leverage Twinword API and word_distractors
 */
const generateWrongOptions = async (
  supabase: any,
  word: string,
  correctDefinition: string,
  partOfSpeech: string,
  difficulty: WordDifficulty
): Promise<string[]> => {
  const wrongOptions: string[] = [];
  const targetCount = 3; // We want 3 wrong options
  
  try {
    // Strategy 1: Use stored distractors from word_distractors table
    const { data: storedDistractors, error: distError } = await supabase
      .from('word_distractors')
      .select('distractor, quality_score, semantic_distance')
      .eq('word', word)
      .eq('part_of_speech', partOfSpeech)
      .eq('correct_definition', correctDefinition)
      .order('quality_score', { ascending: false })
      .limit(targetCount);
    
    if (!distError && storedDistractors && storedDistractors.length > 0) {
      // Use stored high-quality distractors
      for (const distractor of storedDistractors) {
        if (!wrongOptions.includes(distractor.distractor) && 
            !checkSimilarity(distractor.distractor, correctDefinition)) {
          wrongOptions.push(distractor.distractor);
          
          // Increment usage count
          try {
            await supabase.rpc('increment', { 
              table_name: 'word_distractors',
              column_name: 'usage_count',
              row_id: distractor.id
            });
          } catch (e) {
            console.warn('Failed to increment usage count:', e);
          }
        }
      }
      
      console.log(`Found ${wrongOptions.length} stored distractors for "${word}"`);
    }
    
    // If we don't have enough stored distractors, try alternative definitions
    if (wrongOptions.length < targetCount) {
      // Get word details to find alternative definitions
    const wordDetails = await getWordDetails(word);
    
      if (wordDetails.definitions.length > 1) {
        // Filter definitions for the correct part of speech
        const otherDefinitions = wordDetails.definitions
          .filter((def, index) => {
            // Assuming definitions array contains simple strings
            return def !== correctDefinition;
          });
        
        // Use other definitions as wrong options
        for (const def of otherDefinitions) {
          if (wrongOptions.length >= targetCount) break;
          
          // Ensure this distractor isn't too similar to correct definition
          if (!checkSimilarity(def, correctDefinition) && 
              !wrongOptions.includes(def)) {
            wrongOptions.push(def);
            
            // Store this distractor for future use
            try {
              await supabase
                .from('word_distractors')
                .insert({
                  word,
                  correct_definition: correctDefinition,
                  distractor: def,
                  part_of_speech: partOfSpeech,
                  difficulty,
                  source: 'alternative_definition',
                  quality_score: 0.8,
                  semantic_distance: 0.3 // Medium distance since it's the same word
                });
            } catch (e) {
              console.warn('Failed to store alternative definition distractor:', e);
            }
          }
        }
        
        console.log(`Added ${wrongOptions.length} alternative definition distractors`);
      }
    }
    
    // Strategy 3: Use Twinword API for semantic associations
    if (wrongOptions.length < targetCount) {
      const twinwordData = await fetchFromTwinword(word, supabase);
      
      if (twinwordData && twinwordData.result_code === "200" && twinwordData.associations) {
        const associations = sortByRelevance(twinwordData.associations);
        
        // Get definitions for associated words to use as distractors
        for (const assocWord of associations) {
          if (wrongOptions.length >= targetCount) break;
          
          try {
            const assocDetails = await getWordDetails(assocWord);
            
            if (assocDetails.definitions && assocDetails.definitions.length > 0) {
              // Get the most relevant definition
              let assocDefinition = assocDetails.definitions[0];
              
              if (!checkSimilarity(assocDefinition, correctDefinition) && 
                  !wrongOptions.includes(assocDefinition)) {
                wrongOptions.push(assocDefinition);
                
                // Store this distractor
                try {
                  await supabase
                    .from('word_distractors')
                    .insert({
                      word,
                      correct_definition: correctDefinition,
                      distractor: assocDefinition,
                      part_of_speech: partOfSpeech,
                      difficulty,
                      source: 'twinword_association',
                      quality_score: 0.9, // High quality as it's semantically related
                      semantic_distance: 0.5 // Moderate distance
                    });
                } catch (e) {
                  console.warn('Failed to store Twinword distractor:', e);
                }
              }
            }
          } catch (e) {
            console.warn(`Failed to get details for associated word "${assocWord}":`, e);
          }
        }
        
        console.log(`Added ${wrongOptions.length} Twinword association distractors`);
      }
    }
    
    // Strategy 4: Fallback to generic distractors if we still don't have enough
    if (wrongOptions.length < targetCount) {
      // Get some generic distractors for the given part of speech
      const genericDistractors = [
        `Not a definition of ${word}`,
        `The opposite meaning of ${word}`,
        `A common misunderstanding of ${word}`
      ];
      
      for (const distractor of genericDistractors) {
        if (wrongOptions.length >= targetCount) break;
        wrongOptions.push(distractor);
      }
      
      console.log(`Added generic fallback distractors to reach ${wrongOptions.length} total distractors`);
    }
    
    // Make sure we don't have more than the target count
    while (wrongOptions.length > targetCount) {
      wrongOptions.pop();
    }
    
    // If somehow we still don't have enough (unlikely), add placeholders
    while (wrongOptions.length < targetCount) {
      wrongOptions.push(`Option ${wrongOptions.length + 1}`);
    }
    
    return wrongOptions;
  } catch (error) {
    console.error(`Error generating wrong options: ${error}`);
    
    // Return fallback options in case of error
    return [
      `Not related to ${word}`,
      `Incorrect meaning of ${word}`,
      `Not a definition of ${word}`
    ];
  }
};

/**
 * Checks if two strings are too similar based on word overlap
 */
const checkSimilarity = (text1: string, text2: string): boolean => {
  // Normalize and tokenize both texts
  const normalize = (text: string) => {
    return text.toLowerCase()
      .replace(/[.,;:!?()"']/g, '') // Remove punctuation
      .split(/\s+/)                  // Split by whitespace
      .filter(word => word.length > 3); // Filter out short words
  };
  
  const words1 = normalize(text1);
  const words2 = normalize(text2);
  
  // Count overlapping significant words
  const overlap = words1.filter(word => words2.includes(word)).length;
  
  // Calculate similarity ratio based on the shorter text
  const minLength = Math.min(words1.length, words2.length);
  const similarityRatio = minLength > 0 ? overlap / minLength : 0;
  
  // Return true if texts are too similar (over 40% word overlap)
  return similarityRatio > 0.4;
};

/**
 * Shuffles an array in place using Fisher-Yates algorithm
 */
const shuffleArray = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Estimates syllables for fallback if API data doesn't include it
const estimateSyllables = (word: string): number => {
  const phonetics = word.toLowerCase()
    .replace(/(?:[^laeiouy]|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g);
  
  return phonetics ? phonetics.length : 1;
};

// HTTP request handler for the Edge Function
serve(async (req) => {
  try {
    // Parse request parameters
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    // Validate required parameters
    if (!startDate || !endDate) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Missing required parameters: startDate and endDate'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    // Execute main function
    const result = await seedWordsForDateRange(startDate, endDate);
    
    // Return result as JSON
    return new Response(JSON.stringify({
      status: result.success ? 'success' : 'error',
      message: result.message,
      dates: result.dates
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: result.success ? 200 : 500
    });
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Return error as JSON
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message || 'An unexpected error occurred'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}); 