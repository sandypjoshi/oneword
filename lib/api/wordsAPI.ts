/**
 * WordsAPI service
 * Handles interactions with the Words API
 */

// WordsAPI key from the project requirements
const WORDSAPI_KEY = '8cc3ff3281msh7ea7e190a1f4805p13cbdejsnb32d65962e66';
const WORDSAPI_HOST = 'wordsapiv1.p.rapidapi.com';
const WORDSAPI_BASE_URL = 'https://wordsapiv1.p.rapidapi.com/words';

// Word difficulty levels
export enum WordDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

// Word information interfaces
export interface WordDefinition {
  definition: string;
  partOfSpeech: string;
  synonyms?: string[];
  antonyms?: string[];
  examples?: string[];
}

export interface WordResponse {
  word: string;
  pronunciation?: {
    all?: string;
    noun?: string;
    verb?: string;
  };
  frequency?: number;
  results?: WordDefinition[];
  syllables?: {
    count?: number;
    list?: string[];
  };
}

/**
 * Fetch detailed information about a word
 * @param word The word to look up
 * @returns Promise with word information
 */
export const getWordDetails = async (word: string): Promise<WordResponse> => {
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
    return data;
  } catch (error) {
    console.error('Error fetching word details:', error);
    throw error;
  }
};

/**
 * Get random words with a specific difficulty level
 * Note: WordsAPI doesn't support filtering by difficulty directly,
 * so we would need to implement this on the server side with Supabase
 * This is just a placeholder for the interface
 */
export const getRandomWord = async (difficulty: WordDifficulty): Promise<string> => {
  // This would be replaced by a call to our Supabase edge function
  // or directly to the database once implemented
  console.log(`Fetching random word with difficulty: ${difficulty}`);
  
  // Mock implementation - in reality, this would be handled by Supabase
  const mockWords = {
    [WordDifficulty.BEGINNER]: ['simple', 'happy', 'friend', 'learn', 'water'],
    [WordDifficulty.INTERMEDIATE]: ['abundance', 'scrutinize', 'verbose', 'arduous', 'meticulous'],
    [WordDifficulty.ADVANCED]: ['ephemeral', 'surreptitious', 'nebulous', 'perfidious', 'parsimonious'],
  };
  
  const words = mockWords[difficulty];
  const randomIndex = Math.floor(Math.random() * words.length);
  
  return words[randomIndex];
};

export default {
  getWordDetails,
  getRandomWord,
}; 