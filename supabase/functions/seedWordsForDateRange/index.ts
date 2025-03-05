/**
 * Supabase Edge Function: seedWordsForDateRange
 * 
 * This edge function is designed to be a one-time operation to pre-populate
 * the database with words for a date range (Jan 1, 2025 - Mar 3, 2025).
 * 
 * It:
 * 1. Fetches random words from external sources
 * 2. Retrieves detailed word information from WordsAPI
 * 3. Generates quiz options (wrong answers)
 * 4. Assigns words to dates based on difficulty level
 * 
 * To deploy as a Supabase Edge Function:
 * 1. Create a new Edge Function in the Supabase dashboard
 * 2. Paste this code (adjusted for the Edge Function environment)
 * 3. Deploy the function
 * 4. Invoke it once to seed the initial data
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// WordsAPI configuration
const WORDSAPI_KEY = '8cc3ff3281msh7ea7e190a1f4805p13cbdejsnb32d65962e66';
const WORDSAPI_HOST = 'wordsapiv1.p.rapidapi.com';
const WORDSAPI_BASE_URL = 'https://wordsapiv1.p.rapidapi.com/words';

// Difficulty levels
enum WordDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

// Word data structure
interface WordDetails {
  word: string;
  pronunciation?: string;
  partOfSpeech?: string;
  definitions: string[];
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
  metadata?: any;
}

/**
 * Main handler for the Edge Function
 */
// Serve function would be defined differently in the actual Edge Function environment
// export const serve = async (req) => {
const seedWordsForDateRange = async (startDate: string, endDate: string) => {
  console.log(`Seeding words from ${startDate} to ${endDate}...`);
  
  try {
    // Generate dates in the specified range
    const dateRange = generateDateRange(new Date(startDate), new Date(endDate));
    
    // Process each date
    for (const date of dateRange) {
      console.log(`Processing date: ${date}`);
      
      // Assign a word for each difficulty level
      await assignWordToDate(date, WordDifficulty.BEGINNER);
      await assignWordToDate(date, WordDifficulty.INTERMEDIATE);
      await assignWordToDate(date, WordDifficulty.ADVANCED);
    }
    
    return {
      success: true,
      message: `Successfully seeded words for ${dateRange.length} dates from ${startDate} to ${endDate}`,
      dates: dateRange,
    };
  } catch (error) {
    console.error('Error seeding words:', error);
    return {
      success: false,
      message: `Error seeding words: ${error.message}`,
    };
  }
};

/**
 * Generate an array of date strings in the format YYYY-MM-DD
 */
const generateDateRange = (startDate: Date, endDate: Date): string[] => {
  const dates = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

/**
 * Get a random word based on difficulty
 */
const getRandomWordByDifficulty = async (difficulty: WordDifficulty): Promise<string> => {
  const supabase = createSupabaseClient();
  
  // We need to determine the appropriate WordsAPI difficulty mapping
  const apiDifficulty = {
    [WordDifficulty.BEGINNER]: 'elementary',
    [WordDifficulty.INTERMEDIATE]: 'intermediate',
    [WordDifficulty.ADVANCED]: 'advanced',
  }[difficulty];
  
  // Get previously used words to avoid duplicates
  const { data: usedWords, error: usedWordsError } = await supabase
    .from('daily_words')
    .select('words(word)')
    .eq('difficulty', difficulty);
  
  if (usedWordsError) {
    console.error('Error fetching used words:', usedWordsError);
  }
  
  const usedWordsList = usedWords 
    ? usedWords
        .filter(entry => entry.words)
        .map(entry => entry.words.word)
    : [];
  
  // Try fetching a random word from WordsAPI with appropriate difficulty
  let word = '';
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    try {
      const randomLetterStart = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // 'a' to 'z'
      const response = await fetch(`https://wordsapiv1.p.rapidapi.com/words/?random=true&hasDetails=definitions&letterPattern=^${randomLetterStart}.*&frequencyMin=3`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': WORDSAPI_KEY,
          'X-RapidAPI-Host': WORDSAPI_HOST,
        },
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      word = data.word;
      
      // Check if the word has already been used
      if (!usedWordsList.includes(word)) {
        break;
      }
      
      attempts++;
    } catch (error) {
      console.error('Error fetching random word:', error);
      attempts++;
    }
  }
  
  if (word) {
    return word;
  } else {
    throw new Error('Failed to get a random word after multiple attempts');
  }
};

/**
 * Get detailed information about a word from WordsAPI
 */
const getWordDetails = async (word: string): Promise<WordDetails> => {
  try {
    const response = await fetch(`${WORDSAPI_BASE_URL}/${encodeURIComponent(word)}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': WORDSAPI_KEY,
        'X-RapidAPI-Host': WORDSAPI_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform API response to our schema
    const wordDetails: WordDetails = {
      word: data.word,
      pronunciation: data.pronunciation?.all,
      partOfSpeech: data.results?.[0]?.partOfSpeech,
      definitions: data.results?.map(result => result.definition) || [],
      examples: data.results?.flatMap(result => result.examples || []) || [],
      synonyms: data.results?.flatMap(result => result.synonyms || []) || [],
      antonyms: data.results?.flatMap(result => result.antonyms || []) || [],
      metadata: {
        syllables: data.syllables,
        frequency: data.frequency,
        etymology: data.results?.[0]?.derivation?.[0],
      },
    };

    return wordDetails;
  } catch (error) {
    console.error('Error fetching word details:', error);
    throw error;
  }
};

/**
 * Generate wrong options for the quiz
 */
const generateWrongOptions = async (
  correctDefinition: string,
  difficulty: WordDifficulty,
  word: string,
  wordDetails: WordDetails
): Promise<string[]> => {
  // Create Supabase client
  const supabase = createSupabaseClient();
  
  try {
    // Use multiple approaches to generate high-quality distractors
    const wrongOptions: string[] = [];
    const usedApproaches: string[] = [];
    const partOfSpeech = wordDetails.partOfSpeech || null;
    
    // APPROACH 1: Check if we have stored distractors for this word
    try {
      const { data: storedDistractors } = await supabase
        .from('word_distractors')
        .select('distractor, quality_score')
        .eq('word', word)
        .eq('difficulty', difficulty)
        .order('quality_score', { ascending: false })
        .order('usage_count', { ascending: true })
        .limit(3);
      
      if (storedDistractors && storedDistractors.length > 0) {
        usedApproaches.push("stored distractors");
        // Add stored distractors that aren't too similar to the correct definition
        for (const item of storedDistractors) {
          if (wrongOptions.length >= 3) break;
          
          // Simple similarity check
          const isTooSimilar = checkSimilarity(item.distractor, correctDefinition);
          
          if (!isTooSimilar && !wrongOptions.includes(item.distractor)) {
            wrongOptions.push(item.distractor);
            
            // Update usage count
            await supabase
              .from('word_distractors')
              .update({ usage_count: supabase.rpc('increment', { inc: 1 }) })
              .eq('word', word)
              .eq('distractor', item.distractor);
          }
        }
      }
    } catch (error) {
      console.error('Error retrieving stored distractors:', error);
      // Continue to other approaches if there's an error
    }
    
    // APPROACH 2: Use alternative definitions of the same word
    if (wrongOptions.length < 3 && wordDetails.definitions && wordDetails.definitions.length > 1) {
      usedApproaches.push("alternative definitions");
      
      // Filter out definitions that are too similar to the correct one
      const altDefinitions = wordDetails.definitions
        .filter(def => def !== correctDefinition && !checkSimilarity(def, correctDefinition))
        .slice(0, 3 - wrongOptions.length);
      
      for (const def of altDefinitions) {
        if (wrongOptions.length >= 3) break;
        if (!wrongOptions.includes(def)) {
          wrongOptions.push(def);
          
          // Save this quality distractor for future use
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
                quality_score: 0.9, // High quality score since it's from the same word
                usage_count: 1
              })
              // Remove the onConflict for now to simplify
              // .onConflict(['word', 'distractor'])
              // .merge(['usage_count', 'quality_score']);
            
            console.log(`Successfully stored alternative definition distractor for word "${word}"`);
          } catch (error) {
            console.error('Error saving alternative definition distractor:', error);
          }
        }
      }
    }
    
    // APPROACH 3: Use definitions from synonyms/antonyms
    if (wrongOptions.length < 3 && 
        ((wordDetails.synonyms && wordDetails.synonyms.length > 0) || 
         (wordDetails.antonyms && wordDetails.antonyms.length > 0))) {
      usedApproaches.push("related words");
      
      // Combine synonyms and antonyms, prioritizing synonyms
      const relatedWords = [
        ...(wordDetails.synonyms || []).slice(0, 5),
        ...(wordDetails.antonyms || []).slice(0, 3)
      ];
      
      // Get definitions for related words
      for (const relatedWord of relatedWords) {
        if (wrongOptions.length >= 3) break;
        
        try {
          // Get related word details using WordsAPI
          const relatedWordDetails = await getWordDetails(relatedWord);
          
          if (relatedWordDetails.definitions && relatedWordDetails.definitions.length > 0) {
            // Get best definition that isn't too similar to correct definition
            const relatedDefinition = relatedWordDetails.definitions
              .find(def => !checkSimilarity(def, correctDefinition));
            
            if (relatedDefinition && !wrongOptions.includes(relatedDefinition)) {
              wrongOptions.push(relatedDefinition);
              
              // Determine if it's from a synonym or antonym
              const source = wordDetails.synonyms?.includes(relatedWord) 
                ? 'synonym_definition' 
                : 'antonym_definition';
              
              // Save this quality distractor for future use
              try {
                await supabase
                  .from('word_distractors')
                  .insert({
                    word,
                    correct_definition: correctDefinition,
                    distractor: relatedDefinition,
                    part_of_speech: partOfSpeech,
                    difficulty,
                    source,
                    quality_score: 0.85, // High quality score since it's from a related word
                    usage_count: 1
                  })
                  // Remove the onConflict for now to simplify
                  // .onConflict(['word', 'distractor'])
                  // .merge(['usage_count', 'quality_score']);
                
                console.log(`Successfully stored distractor from ${source} for word "${word}"`);
              } catch (error) {
                console.error('Error saving related word distractor:', error);
                // Continue to next related word if there's an error
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching related word "${relatedWord}":`, error);
          // Continue to next related word if there's an error
        }
      }
    }
    
    // APPROACH 4: Use simplified direct fallbacks if we still need more options
    if (wrongOptions.length < 3) {
      usedApproaches.push("direct fallbacks");
      
      const fallbacks = [
        `A different meaning than "${word}"`,
        `Not related to ${partOfSpeech || 'the concept of'} "${word}"`,
        `A ${difficulty} level term unrelated to "${word}"`,
        `The opposite of "${word}"`,
        `A concept from a different category than "${word}"`,
        `A term with no connection to "${word}"`
      ];
      
      // If we have part of speech info, add a specific fallback
      if (partOfSpeech) {
        switch(partOfSpeech.toLowerCase()) {
          case 'noun':
            fallbacks.push(`A different type of object or concept than "${word}"`);
            break;
          case 'verb':
            fallbacks.push(`An action different from "${word}"`);
            break;
          case 'adjective':
            fallbacks.push(`A quality or characteristic unlike "${word}"`);
            break;
          case 'adverb':
            fallbacks.push(`A manner or method distinct from "${word}"`);
            break;
        }
      }
      
      // Shuffle and add fallbacks until we have enough options
      const shuffledFallbacks = shuffleArray(fallbacks);
      
      for (const fallback of shuffledFallbacks) {
        if (wrongOptions.length >= 3) break;
        if (!wrongOptions.includes(fallback)) {
          wrongOptions.push(fallback);
          
          // Save this fallback distractor for future use
          try {
            await supabase
              .from('word_distractors')
              .insert({
                word,
                correct_definition: correctDefinition,
                distractor: fallback,
                part_of_speech: partOfSpeech,
                difficulty,
                source: 'dynamic_fallback',
                quality_score: 0.6, // Lower quality score since it's a generic fallback
                usage_count: 1
              })
              // Remove the onConflict for now to simplify
              // .onConflict(['word', 'distractor'])
              // .merge(['usage_count']);
            
            console.log(`Successfully stored fallback distractor for word "${word}"`);
          } catch (error) {
            console.error('Error saving fallback distractor:', error);
          }
        }
      }
    }
    
    // Log the approaches used for analytics
    console.log(`Generated distractors for "${word}" using: ${usedApproaches.join(", ")}`);
    
    return wrongOptions.slice(0, 3);
  } catch (error) {
    console.error('Error in generateWrongOptions:', error);
    
    // Even in error cases, create word-specific fallbacks
    return [
      `A concept unrelated to "${word}"`,
      `A different type of ${wordDetails.partOfSpeech || 'word'} for ${difficulty} level`,
      `A term from a different category than "${word}"`
    ];
  }
};

/**
 * Check if two text strings are too similar
 */
function checkSimilarity(text1: string, text2: string): boolean {
  if (!text1 || !text2) return false;
  
  // Simple word overlap check
  const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  
  // Count common significant words
  const commonWords = words1.filter(word => words2.includes(word));
  
  // Too similar if more than 30% overlap for significant words
  const overlapPercentage = commonWords.length / Math.min(words1.length, words2.length);
  return overlapPercentage > 0.3;
}

/**
 * Utility function to shuffle an array
 */
function shuffleArray<T>(arr: T[]): T[] {
  const newArray = [...arr];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Assign a word to a specific date with a specific difficulty
 */
const assignWordToDate = async (date: string, difficulty: WordDifficulty) => {
  const supabase = createSupabaseClient();
  
  try {
    // Check if there's already a word for this date and difficulty
    const { data: existingWords } = await supabase
      .from('daily_words')
      .select('id')
      .eq('date', date)
      .eq('difficulty', difficulty);
    
    if (existingWords && existingWords.length > 0) {
      console.log(`Word already exists for ${date} with difficulty ${difficulty}`);
      return;
    }
    
    // Get a random word
    const word = await getRandomWordByDifficulty(difficulty);
    
    // Get details about the word
    const wordDetails = await getWordDetails(word);
    
    // Ensure we have at least one definition
    if (!wordDetails.definitions || wordDetails.definitions.length === 0) {
      throw new Error(`No definitions found for word: ${word}`);
    }
    
    // Get the primary definition (first one)
    const primaryDefinition = wordDetails.definitions[0];
    
    // Store the word in the database
    const { data: wordRecord, error: wordError } = await supabase
      .from('words')
      .upsert({
        word: wordDetails.word,
        pronunciation: wordDetails.pronunciation,
        part_of_speech: wordDetails.partOfSpeech,
        definitions: wordDetails.definitions,
        examples: wordDetails.examples,
        synonyms: wordDetails.synonyms,
        antonyms: wordDetails.antonyms,
        metadata: wordDetails.metadata,
      })
      .select('id')
      .single();
    
    if (wordError) {
      throw new Error(`Error storing word: ${wordError.message}`);
    }
    
    // Generate wrong options for the quiz
    const wrongOptions = await generateWrongOptions(
      primaryDefinition,
      difficulty,
      word,
      wordDetails
    );
    
    // Combine correct and wrong options
    const allOptions = [primaryDefinition, ...wrongOptions];
    
    // Shuffle options
    const shuffledOptions = shuffleArray(allOptions);
    
    // Find the index of the correct option
    const correctOptionIndex = shuffledOptions.indexOf(primaryDefinition);
    
    // Store the daily word
    const { error: dailyWordError } = await supabase
      .from('daily_words')
      .insert({
        word_id: wordRecord.id,
        date,
        difficulty,
        options: shuffledOptions,
        correct_option_index: correctOptionIndex,
      });
    
    if (dailyWordError) {
      throw new Error(`Error storing daily word: ${dailyWordError.message}`);
    }
    
    console.log(`Successfully assigned word "${word}" to ${date} with difficulty ${difficulty}`);
  } catch (error) {
    console.error(`Error assigning word to date ${date} with difficulty ${difficulty}:`, error);
    throw error;
  }
};

// Create a Supabase client
const createSupabaseClient = () => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://ipljgsggnbdwaomjfuok.supabase.co';
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbGpnc2dnbmJkd2FvbWpmdW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwODAxMDYsImV4cCI6MjA1NjY1NjEwNn0.Tpqr0Btu0AolHltIv2qa4dLNxd7_wr3eC8NF2oLbGRI';
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  return createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
  );
};

// HTTP handler for the Edge Function
serve(async (req) => {
  try {
    // Parse query parameters from URL instead of trying to parse JSON body
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required parameters: startDate and endDate.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const result = await seedWordsForDateRange(startDate, endDate);
    
    return new Response(
      JSON.stringify(result),
      { status: result.success ? 200 : 500, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in seedWordsForDateRange handler:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error: ${error.message}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 