/**
 * Supabase Schema Definitions
 * 
 * This file defines TypeScript interfaces and types that map to our Supabase database tables.
 * It serves as a contract between our app and the database, ensuring type safety.
 * 
 * The schema includes:
 * - words: Table storing word data fetched from WordsAPI
 * - daily_words: Table mapping words to specific dates and difficulty levels
 * - user_progress: Table tracking user progress with words
 * - word_distractors: Table storing quality distractors for word quizzes
 */

/**
 * Difficulty levels for words
 */
export enum WordDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

/**
 * Database schema for the words table
 * Stores detailed information about each word fetched from WordsAPI
 */
export interface WordSchema {
  id: string; // UUID primary key
  word: string; // The actual word text
  pronunciation: string | null; // Pronunciation guide
  part_of_speech: string | null; // E.g., noun, verb, adjective
  definitions: string[]; // Array of definitions
  examples: string[] | null; // Example sentences using the word
  synonyms: string[] | null; // Similar words
  antonyms: string[] | null; // Opposite words
  created_at: string; // Timestamp when the word was added to the database
  metadata: {
    syllables?: {
      count: number;
      list: string[];
    };
    frequency?: number;
    etymology?: string; // Origin of the word
  } | null; // Additional metadata
}

/**
 * Database schema for the daily_words table
 * Maps words to specific dates and difficulty levels
 */
export interface DailyWordSchema {
  id: string; // UUID primary key
  word_id: string; // Foreign key to words table
  date: string; // Date in ISO format (YYYY-MM-DD)
  difficulty: WordDifficulty; // Difficulty level
  options: string[]; // Multiple choice options for quiz
  correct_option_index: number; // Index of correct option in options array
  created_at: string; // Timestamp when the mapping was created
}

/**
 * Database schema for the user_progress table
 * Tracks user interactions with daily words
 */
export interface UserProgressSchema {
  id: string; // UUID primary key
  device_id: string; // Unique identifier for the user's device
  daily_word_id: string; // Foreign key to daily_words table
  correct: boolean; // Whether the user answered correctly
  attempts: number; // Number of attempts made
  time_spent: number | null; // Time spent in seconds (optional)
  favorited: boolean; // Whether the user has favorited this word
  created_at: string; // Timestamp when the progress was recorded
  updated_at: string; // Timestamp when the progress was last updated
}

/**
 * Joined type representing a daily word with its full details
 * Used when querying the data for display in the app
 */
export interface DailyWordWithDetails {
  id: string;
  date: string;
  difficulty: WordDifficulty;
  options: string[];
  correct_option_index: number;
  word: {
    word: string;
    pronunciation: string | null;
    part_of_speech: string | null;
    definitions: string[];
    examples: string[] | null;
    synonyms: string[] | null;
    antonyms: string[] | null;
    metadata: WordSchema['metadata'];
  };
  progress?: {
    correct: boolean;
    attempts: number;
    favorited: boolean;
  };
}

/**
 * Database schema for the word_distractors table
 * Stores quality distractors for word definitions
 */
export interface WordDistractorSchema {
  id: string; // UUID primary key
  word: string; // The word the distractor is for
  part_of_speech: string | null; // Part of speech of the word
  correct_definition: string; // The correct definition of the word
  distractor: string; // The distractor (incorrect definition)
  difficulty: WordDifficulty; // Difficulty level
  source: string; // Where the distractor came from (e.g., 'template', 'synonym', 'related_word')
  quality_score: number; // Score to indicate the quality of the distractor (0-1)
  usage_count: number; // Number of times this distractor has been used
  created_at: string; // Timestamp when the distractor was created
}

/**
 * Database table names
 * Used to ensure consistent table name references across the application
 */
export enum Tables {
  WORDS = 'words',
  DAILY_WORDS = 'daily_words',
  USER_PROGRESS = 'user_progress',
  WORD_DISTRACTORS = 'word_distractors',
}

export default {
  Tables,
}; 