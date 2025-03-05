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
const seedWordsForDateRange = async (startDate: string, endDate: string) => {
  try {
    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { error: 'Invalid date format. Use YYYY-MM-DD.' };
    }
    
    // Generate all dates in the range
    const dates = generateDateRange(start, end);
    
    // For each date, generate words for each difficulty level
    for (const date of dates) {
      for (const difficulty of Object.values(WordDifficulty)) {
        await assignWordToDate(date, difficulty);
      }
    }
    
    return { success: true, message: `Words seeded for ${dates.length} days.` };
  } catch (error) {
    console.error('Error in seedWordsForDateRange:', error);
    return { error: 'Failed to seed words.' };
  }
};

/**
 * Generate an array of date strings in the format YYYY-MM-DD
 */
const generateDateRange = (startDate: Date, endDate: Date): string[] => {
  const dates: string[] = [];
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
  // This would be replaced with a more sophisticated system in production
  // For now, we'll use a simple approach based on word length and frequency
  
  // Mock implementation using wordnik or another random word API
  const randomWordUrl = `https://api.wordnik.com/v4/words.json/randomWord`;
  
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
  
  // In a real implementation, we'd make an API call here
  // For now, return a mock word based on difficulty
  const mockWords = {
    [WordDifficulty.BEGINNER]: ['simple', 'happy', 'friend', 'learn', 'water'],
    [WordDifficulty.INTERMEDIATE]: ['abundance', 'scrutinize', 'verbose', 'arduous', 'meticulous'],
    [WordDifficulty.ADVANCED]: ['ephemeral', 'surreptitious', 'nebulous', 'perfidious', 'parsimonious'],
  };
  
  const words = mockWords[difficulty];
  const randomIndex = Math.floor(Math.random() * words.length);
  
  return words[randomIndex];
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
      'To move quickly',
      'A type of food',
      'A body of water',
      'To speak loudly',
      'A small animal',
    ],
    [WordDifficulty.INTERMEDIATE]: [
      'A mathematical concept',
      'A rare medical condition',
      'A type of ancient architecture',
      'A philosophical principle',
      'A meteorological phenomenon',
    ],
    [WordDifficulty.ADVANCED]: [
      'A complex biological process',
      'An obscure literary technique',
      'A quantum physics theory',
      'An architectural style from ancient Mesopotamia',
      'A rare linguistic phenomenon',
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
    // Get a random word based on difficulty
    const word = await getRandomWordByDifficulty(difficulty);
    
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
export default seedWordsForDateRange; 