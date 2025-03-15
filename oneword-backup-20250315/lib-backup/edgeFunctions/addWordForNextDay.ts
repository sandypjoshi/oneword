/**
 * Supabase Edge Function: addWordForNextDay
 * 
 * This edge function is designed to run daily as a scheduled task to:
 * 1. Check if tomorrow's date already has words assigned
 * 2. If not, generate and assign a word for each difficulty level
 * 
 * To deploy as a Supabase Edge Function:
 * 1. Create a new Edge Function in the Supabase dashboard
 * 2. Paste this code (adjusted for the Edge Function environment)
 * 3. Deploy the function
 * 4. Set up a scheduler to run this function daily (e.g., at midnight UTC)
 */

// Import necessary Supabase client libraries
// When deployed as an Edge Function, these would be available in the environment
// import { createClient } from '@supabase/supabase-js';
// const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// This is a mock implementation to show the logic

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
    // Get list of used words
    const usedWords = await getUsedWords();
    
    // Get a random word based on difficulty (that hasn't been used)
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
    
    // In a real edge function, we would insert the data into Supabase here
    /*
    // Check if word already exists
    const { data: existingWord } = await supabaseAdmin
      .from('words')
      .select('id')
      .eq('word', word)
      .single();
    
    let wordId;
    
    if (existingWord) {
      wordId = existingWord.id;
    } else {
      // Insert the word
      const { data: newWord, error: wordError } = await supabaseAdmin
        .from('words')
        .insert({
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
      
      if (wordError) throw wordError;
      wordId = newWord.id;
    }
    
    // Insert the daily word
    const { error: dailyWordError } = await supabaseAdmin
      .from('daily_words')
      .insert({
        word_id: wordId,
        date,
        difficulty,
        options: shuffledOptions,
        correct_option_index: correctOptionIndex,
      });
    
    if (dailyWordError) throw dailyWordError;
    */
    
    console.log(`Assigned word "${word}" to ${date} with difficulty ${difficulty}`);
  } catch (error) {
    console.error(`Error assigning word to ${date} with difficulty ${difficulty}:`, error);
    throw error;
  }
};

// Export the function for testing
export default addWordForNextDay; 