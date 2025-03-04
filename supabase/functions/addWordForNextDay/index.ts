/**
 * Supabase Edge Function: addWordForNextDay
 * 
 * This edge function is designed to run daily via a cron job to add new words
 * for the next day. It performs the following tasks:
 * 
 * 1. Find the latest date in the daily_words table
 * 2. Fetch random words for the next day (for each difficulty level)
 * 3. Get detailed word information from WordsAPI
 * 4. Generate wrong options for the quiz
 * 5. Insert the new words into the database
 */

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

// Create a Supabase client
const createSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

/**
 * Main handler for the Edge Function
 */
// Serve function would be defined differently in the actual Edge Function environment
// export const serve = async (req) => {
const addWordForNextDay = async () => {
  try {
    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Check if words already exist for tomorrow
    const wordsExistForTomorrow = await checkIfWordsExistForDate(tomorrowStr);
    
    if (wordsExistForTomorrow) {
      console.log(`Words already exist for ${tomorrowStr}. No action needed.`);
      return { success: true, message: 'Words already exist for tomorrow.' };
    }
    
    // Generate words for each difficulty level
    for (const difficulty of Object.values(WordDifficulty)) {
      await assignWordToDate(tomorrowStr, difficulty);
    }
    
    return { 
      success: true, 
      message: `Words successfully added for ${tomorrowStr}.` 
    };
  } catch (error) {
    console.error('Error in addWordForNextDay:', error);
    return { error: 'Failed to add word for next day.' };
  }
};

/**
 * Check if words already exist for a specific date
 */
const checkIfWordsExistForDate = async (date: string): Promise<boolean> => {
  // In a real edge function, we would check Supabase here
  /*
  const { data, error } = await supabaseAdmin
    .from('daily_words')
    .select('id')
    .eq('date', date)
    .limit(1);
  
  if (error) {
    throw error;
  }
  
  return data.length > 0;
  */
  
  // Mock implementation
  console.log(`Checking if words exist for ${date}`);
  return false; // Assume no words exist
};

/**
 * Get words that have already been used
 */
const getUsedWords = async (): Promise<string[]> => {
  // In a real edge function, we would query Supabase here
  /*
  const { data, error } = await supabaseAdmin
    .from('words')
    .select('word');
  
  if (error) {
    throw error;
  }
  
  return data.map(item => item.word);
  */
  
  // Mock implementation
  return [
    'simple', 'happy', 'friend', 'learn', 'water',
    'abundance', 'scrutinize', 'verbose', 'arduous', 'meticulous',
    'ephemeral', 'surreptitious', 'nebulous', 'perfidious', 'parsimonious'
  ];
};

/**
 * Get a random word from Wordnik or another external API
 */
const getRandomWord = async (
  difficulty: WordDifficulty,
  usedWords: string[]
): Promise<string> => {
  // This would be replaced with a real API call in production
  // For now, we'll use a simple approach
  
  let minLength, maxLength;
  
  switch (difficulty) {
    case WordDifficulty.BEGINNER:
      minLength = 3;
      maxLength = 6;
      break;
    case WordDifficulty.INTERMEDIATE:
      minLength = 6;
      maxLength = 9;
      break;
    case WordDifficulty.ADVANCED:
      minLength = 9;
      maxLength = 15;
      break;
  }
  
  // Mock implementation
  const mockWords = {
    [WordDifficulty.BEGINNER]: ['house', 'apple', 'smile', 'beach', 'light'],
    [WordDifficulty.INTERMEDIATE]: ['convince', 'delegate', 'harmonize', 'navigate', 'optimize'],
    [WordDifficulty.ADVANCED]: ['clandestine', 'mellifluous', 'perspicacious', 'ubiquitous', 'vicissitude'],
  };
  
  // Filter out already used words
  const availableWords = mockWords[difficulty].filter(word => !usedWords.includes(word));
  
  if (availableWords.length === 0) {
    throw new Error(`No more available words for difficulty ${difficulty}`);
  }
  
  const randomIndex = Math.floor(Math.random() * availableWords.length);
  return availableWords[randomIndex];
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
  difficulty: WordDifficulty
): Promise<string[]> => {
  // In a real implementation, we'd generate truly random wrong options
  // For now, use mock wrong definitions
  const mockWrongDefinitions = {
    [WordDifficulty.BEGINNER]: [
      'A small insect',
      'A type of vehicle',
      'A musical instrument',
      'A seasonal event',
      'A color',
    ],
    [WordDifficulty.INTERMEDIATE]: [
      'A historical event',
      'A scientific theory',
      'A cultural tradition',
      'A type of plant',
      'A cooking technique',
    ],
    [WordDifficulty.ADVANCED]: [
      'A psychological condition',
      'A philosophical doctrine',
      'An economic principle',
      'A mathematical formula',
      'A legal precedent',
    ],
  };
  
  // Get random wrong definitions
  const wrongDefinitions = mockWrongDefinitions[difficulty];
  const shuffled = [...wrongDefinitions].sort(() => 0.5 - Math.random());
  
  // Return 3 wrong options
  return shuffled.slice(0, 3);
};

/**
 * Assign a word to a specific date with a specific difficulty
 */
const assignWordToDate = async (date: string, difficulty: WordDifficulty) => {
  try {
    // Get a list of used words to avoid duplicates
    const usedWords = await getUsedWords();
    
    // Get a random word based on difficulty
    const word = await getRandomWord(difficulty, usedWords);
    
    // Get details for the word from WordsAPI
    const wordDetails = await getWordDetails(word);
    
    // Generate quiz options
    const correctDefinition = wordDetails.definitions[0] || 'No definition available';
    const wrongOptions = await generateWrongOptions(correctDefinition, difficulty);
    
    // Combine correct and wrong options, shuffle them
    const allOptions = [correctDefinition, ...wrongOptions];
    const shuffledOptions = [...allOptions].sort(() => 0.5 - Math.random());
    
    // Find the index of the correct option in the shuffled array
    const correctOptionIndex = shuffledOptions.indexOf(correctDefinition);
    
    // Create Supabase client
    const supabase = createSupabaseClient();
    
    // Check if word already exists
    const { data: existingWord, error: wordError } = await supabase
      .from('words')
      .select('id')
      .eq('word', word)
      .single();
    
    let wordId;
    
    if (existingWord) {
      wordId = existingWord.id;
    } else {
      // Insert the word
      const { data: newWord, error: insertError } = await supabase
        .from('words')
        .insert({
          word: wordDetails.word,
          pronunciation: wordDetails.pronunciation,
          part_of_speech: wordDetails.partOfSpeech,
          definitions: wordDetails.definitions,
          examples: wordDetails.examples,
          synonyms: wordDetails.synonyms,
          antonyms: wordDetails.antonyms,
          metadata: wordDetails.metadata
        })
        .select('id')
        .single();
      
      if (insertError) {
        throw new Error(`Error inserting word: ${insertError.message}`);
      }
      
      wordId = newWord.id;
    }
    
    // Check if a daily word already exists for this date and difficulty
    const { data: existingDailyWord, error: dailyWordError } = await supabase
      .from('daily_words')
      .select('id')
      .eq('date', date)
      .eq('difficulty', difficulty)
      .single();
    
    if (!existingDailyWord) {
      // Insert the daily word
      const { error: insertDailyWordError } = await supabase
        .from('daily_words')
        .insert({
          word_id: wordId,
          date: date,
          difficulty: difficulty,
          options: shuffledOptions,
          correct_option_index: correctOptionIndex
        });
      
      if (insertDailyWordError) {
        throw new Error(`Error inserting daily word: ${insertDailyWordError.message}`);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in assignWordToDate:', error);
    return { error: 'Failed to assign word to date.' };
  }
};

// This serves as the main entry point for the edge function
Deno.serve(async (req) => {
  try {
    // Add word for the next day
    const result = await addWordForNextDay();
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Successfully added word for the next day',
        data: result
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error adding word for next day:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to add word for next day'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 