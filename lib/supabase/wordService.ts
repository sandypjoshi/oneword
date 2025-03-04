/**
 * Word Service for Supabase
 * 
 * This file provides functions to interact with word-related data in Supabase.
 * It handles fetching, storing, and managing words, daily words, and user progress.
 * 
 * The service includes:
 * - Fetching words for specific dates and difficulties
 * - Fetching user progress for words
 * - Updating user progress (tracking learned words, favorites)
 * - Mock functions for word generation (to be replaced by Supabase Edge Functions)
 */

import { supabase } from './client';
import { getDeviceId } from './client';
import { 
  Tables, 
  WordSchema, 
  DailyWordSchema, 
  UserProgressSchema,
  DailyWordWithDetails
} from './schema';
import { WordDifficulty, getWordDetails, WordResponse } from '../api/wordsAPI';

/**
 * Get daily word for a specific date and difficulty
 * This function fetches the word assigned to a date with its full details
 * 
 * @param date ISO date string (YYYY-MM-DD)
 * @param difficulty Word difficulty level
 * @returns Promise with the daily word and its details
 */
export const getDailyWord = async (
  date: string,
  difficulty: WordDifficulty
): Promise<DailyWordWithDetails | null> => {
  try {
    // Get the device ID for tracking user progress
    const deviceId = await getDeviceId();
    
    // Query to get the daily word with its details and user progress
    const { data, error } = await supabase
      .from(Tables.DAILY_WORDS)
      .select(`
        id, date, difficulty, options, correct_option_index,
        word:word_id(word, pronunciation, part_of_speech, definitions, examples, synonyms, antonyms, metadata),
        progress:user_progress(correct, attempts, favorited)
      `)
      .eq('date', date)
      .eq('difficulty', difficulty)
      .eq('progress.device_id', deviceId)
      .single();

    if (error) {
      console.error('Error fetching daily word:', error);
      return null;
    }

    // Transform the data to match our expected format
    const result: DailyWordWithDetails = {
      id: data.id,
      date: data.date,
      difficulty: data.difficulty,
      options: data.options,
      correct_option_index: data.correct_option_index,
      word: data.word,
      progress: data.progress?.length > 0 ? data.progress[0] : undefined,
    };

    return result;
  } catch (error) {
    console.error('Error in getDailyWord:', error);
    return null;
  }
};

/**
 * Get daily words for a date range
 * Used to fetch words for the timeline display (e.g., 7-day view)
 * 
 * @param startDate Start date in ISO format
 * @param endDate End date in ISO format
 * @param difficulty Word difficulty level
 * @returns Promise with an array of daily words
 */
export const getDailyWordsRange = async (
  startDate: string,
  endDate: string,
  difficulty: WordDifficulty
): Promise<DailyWordWithDetails[]> => {
  try {
    const deviceId = await getDeviceId();
    
    const { data, error } = await supabase
      .from(Tables.DAILY_WORDS)
      .select(`
        id, date, difficulty, options, correct_option_index,
        word:word_id(word, pronunciation, part_of_speech, definitions, examples, synonyms, antonyms, metadata),
        progress:user_progress(correct, attempts, favorited)
      `)
      .eq('difficulty', difficulty)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('progress.device_id', deviceId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching daily words range:', error);
      return [];
    }

    // Transform the data to match our expected format
    const result: DailyWordWithDetails[] = data.map(item => ({
      id: item.id,
      date: item.date,
      difficulty: item.difficulty,
      options: item.options,
      correct_option_index: item.correct_option_index,
      word: item.word,
      progress: item.progress?.length > 0 ? item.progress[0] : undefined,
    }));

    return result;
  } catch (error) {
    console.error('Error in getDailyWordsRange:', error);
    return [];
  }
};

/**
 * Update user progress for a daily word
 * Tracks whether the user answered correctly and updates stats
 * 
 * @param dailyWordId ID of the daily word
 * @param correct Whether the user answered correctly
 * @param attempts Number of attempts made
 * @param timeSpent Time spent in seconds (optional)
 * @returns Promise with success status
 */
export const updateWordProgress = async (
  dailyWordId: string,
  correct: boolean,
  attempts: number = 1,
  timeSpent?: number
): Promise<boolean> => {
  try {
    const deviceId = await getDeviceId();
    
    // Check if a progress record already exists
    const { data: existingData, error: queryError } = await supabase
      .from(Tables.USER_PROGRESS)
      .select('id')
      .eq('device_id', deviceId)
      .eq('daily_word_id', dailyWordId)
      .maybeSingle();
    
    if (queryError) {
      console.error('Error checking existing progress:', queryError);
      return false;
    }
    
    if (existingData) {
      // Update existing record
      const { error } = await supabase
        .from(Tables.USER_PROGRESS)
        .update({
          correct,
          attempts,
          time_spent: timeSpent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingData.id);
      
      if (error) {
        console.error('Error updating progress:', error);
        return false;
      }
    } else {
      // Create new record
      const { error } = await supabase
        .from(Tables.USER_PROGRESS)
        .insert({
          device_id: deviceId,
          daily_word_id: dailyWordId,
          correct,
          attempts,
          time_spent: timeSpent,
          favorited: false,
        });
      
      if (error) {
        console.error('Error creating progress:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateWordProgress:', error);
    return false;
  }
};

/**
 * Toggle favorite status for a word
 * 
 * @param dailyWordId ID of the daily word
 * @returns Promise with the new favorite status
 */
export const toggleFavoriteWord = async (
  dailyWordId: string
): Promise<boolean> => {
  try {
    const deviceId = await getDeviceId();
    
    // Check current favorite status
    const { data: existingData, error: queryError } = await supabase
      .from(Tables.USER_PROGRESS)
      .select('id, favorited')
      .eq('device_id', deviceId)
      .eq('daily_word_id', dailyWordId)
      .maybeSingle();
    
    if (queryError) {
      console.error('Error checking favorite status:', queryError);
      return false;
    }
    
    let newFavoriteStatus = true;
    
    if (existingData) {
      // Toggle existing record
      newFavoriteStatus = !existingData.favorited;
      
      const { error } = await supabase
        .from(Tables.USER_PROGRESS)
        .update({
          favorited: newFavoriteStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingData.id);
      
      if (error) {
        console.error('Error updating favorite status:', error);
        return false;
      }
    } else {
      // Create new record with favorited=true
      const { error } = await supabase
        .from(Tables.USER_PROGRESS)
        .insert({
          device_id: deviceId,
          daily_word_id: dailyWordId,
          correct: false,
          attempts: 0,
          favorited: true,
        });
      
      if (error) {
        console.error('Error creating favorited record:', error);
        return false;
      }
    }
    
    return newFavoriteStatus;
  } catch (error) {
    console.error('Error in toggleFavoriteWord:', error);
    return false;
  }
};

/**
 * Get user's favorite words
 * 
 * @returns Promise with array of favorite words
 */
export const getFavoriteWords = async (): Promise<DailyWordWithDetails[]> => {
  try {
    const deviceId = await getDeviceId();
    
    const { data, error } = await supabase
      .from(Tables.USER_PROGRESS)
      .select(`
        daily_word:daily_word_id(
          id, date, difficulty, options, correct_option_index,
          word:word_id(word, pronunciation, part_of_speech, definitions, examples, synonyms, antonyms, metadata)
        ),
        correct, attempts, favorited
      `)
      .eq('device_id', deviceId)
      .eq('favorited', true);
    
    if (error) {
      console.error('Error fetching favorite words:', error);
      return [];
    }
    
    // Transform the data to match our expected format
    const result: DailyWordWithDetails[] = data.map(item => ({
      ...item.daily_word,
      progress: {
        correct: item.correct,
        attempts: item.attempts,
        favorited: item.favorited,
      },
    }));
    
    return result;
  } catch (error) {
    console.error('Error in getFavoriteWords:', error);
    return [];
  }
};

// Export all functions
export default {
  getDailyWord,
  getDailyWordsRange,
  updateWordProgress,
  toggleFavoriteWord,
  getFavoriteWords,
}; 