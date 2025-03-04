/**
 * useWordService.ts
 * 
 * This hook provides access to word-related services for the OneWord app.
 * It wraps the Supabase client and provides methods for:
 * - Fetching daily words
 * - Tracking user progress and favorites
 * - Handling offline functionality and syncing
 * 
 * The hook also handles caching of words to enable offline use.
 */

import { useState, useEffect } from 'react';
import { supabase } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyWordSchema, DailyWordWithDetails, WordDifficulty, UserProgressSchema } from './schema';
import * as wordService from './wordService';
import { useDeviceId } from '../hooks/useDeviceId';

// Keys for AsyncStorage
const CACHED_WORDS_KEY = 'oneword:cached_words';
const PENDING_PROGRESS_UPDATES_KEY = 'oneword:pending_progress_updates';
const PENDING_FAVORITES_KEY = 'oneword:pending_favorites';

interface WordFetchOptions {
  forceRefresh?: boolean;
  maxCacheDays?: number;
}

export function useWordService() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { deviceId } = useDeviceId();
  
  /**
   * Initialize the service and sync any pending updates
   */
  useEffect(() => {
    if (deviceId) {
      syncPendingUpdates();
    }
  }, [deviceId]);
  
  /**
   * Get the word for today with the specified difficulty
   */
  const getTodayWord = async (
    difficulty: WordDifficulty = WordDifficulty.INTERMEDIATE,
    options: WordFetchOptions = {}
  ): Promise<DailyWordWithDetails | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check cache first unless forceRefresh is true
      if (!options.forceRefresh) {
        const cachedWord = await getCachedWordForDate(today, difficulty);
        if (cachedWord) {
          setIsLoading(false);
          return cachedWord;
        }
      }
      
      // Fetch from Supabase
      const dailyWord = await wordService.getDailyWord(today, difficulty, deviceId);
      
      if (dailyWord) {
        // Cache the result
        await cacheWord(dailyWord);
        setIsLoading(false);
        return dailyWord;
      } else {
        setError('No word available for today');
        setIsLoading(false);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch today\'s word';
      setError(errorMessage);
      console.error('Error fetching today\'s word:', err);
      setIsLoading(false);
      return null;
    }
  };
  
  /**
   * Get words for a date range
   */
  const getWordsForDateRange = async (
    startDate: string,
    endDate: string,
    difficulty: WordDifficulty = WordDifficulty.INTERMEDIATE,
    options: WordFetchOptions = {}
  ): Promise<DailyWordWithDetails[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check cache first unless forceRefresh is true
      if (!options.forceRefresh) {
        const cachedWords = await getCachedWordsForRange(startDate, endDate, difficulty);
        if (cachedWords.length > 0) {
          setIsLoading(false);
          return cachedWords;
        }
      }
      
      // Fetch from Supabase
      const words = await wordService.getDailyWordsRange(
        startDate,
        endDate,
        difficulty,
        deviceId
      );
      
      // Cache the results
      for (const word of words) {
        await cacheWord(word);
      }
      
      setIsLoading(false);
      return words;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch words for date range';
      setError(errorMessage);
      console.error('Error fetching words for date range:', err);
      setIsLoading(false);
      return [];
    }
  };
  
  /**
   * Submit an answer for the daily word
   */
  const submitAnswer = async (
    dailyWordId: string,
    isCorrect: boolean,
    attempts: number,
    timeSpent?: number
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!deviceId) {
        throw new Error('Device ID not available');
      }
      
      // Try to update online
      let success = false;
      
      try {
        await wordService.updateWordProgress(
          dailyWordId,
          deviceId,
          isCorrect,
          attempts,
          timeSpent
        );
        success = true;
      } catch (err) {
        // If offline, queue the update
        const progressUpdate = {
          dailyWordId,
          deviceId,
          isCorrect,
          attempts,
          timeSpent,
          timestamp: new Date().toISOString(),
        };
        
        await queueProgressUpdate(progressUpdate);
        
        // Consider this a success even though it's queued
        success = true;
      }
      
      // Update the cache
      if (success) {
        await updateCachedWordProgress(dailyWordId, {
          correct: isCorrect,
          attempts,
          time_spent: timeSpent,
        });
      }
      
      setIsLoading(false);
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit answer';
      setError(errorMessage);
      console.error('Error submitting answer:', err);
      setIsLoading(false);
      return false;
    }
  };
  
  /**
   * Toggle favorite status for a word
   */
  const toggleFavorite = async (dailyWordId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!deviceId) {
        throw new Error('Device ID not available');
      }
      
      // Try to update online
      let success = false;
      let newFavoriteStatus = false;
      
      try {
        const result = await wordService.toggleFavoriteWord(dailyWordId, deviceId);
        success = true;
        newFavoriteStatus = result.favorited;
      } catch (err) {
        // If offline, queue the update and toggle the cached status
        const cachedStatus = await getCachedFavoriteStatus(dailyWordId);
        newFavoriteStatus = !cachedStatus;
        
        const favoriteUpdate = {
          dailyWordId,
          deviceId,
          favorited: newFavoriteStatus,
          timestamp: new Date().toISOString(),
        };
        
        await queueFavoriteUpdate(favoriteUpdate);
        
        // Consider this a success even though it's queued
        success = true;
      }
      
      // Update the cache
      if (success) {
        await updateCachedFavoriteStatus(dailyWordId, newFavoriteStatus);
      }
      
      setIsLoading(false);
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle favorite';
      setError(errorMessage);
      console.error('Error toggling favorite:', err);
      setIsLoading(false);
      return false;
    }
  };
  
  /**
   * Get favorite words
   */
  const getFavoriteWords = async (options: WordFetchOptions = {}): Promise<DailyWordWithDetails[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!deviceId) {
        throw new Error('Device ID not available');
      }
      
      // Check cache first unless forceRefresh is true
      if (!options.forceRefresh) {
        const cachedFavorites = await getCachedFavorites();
        if (cachedFavorites.length > 0) {
          setIsLoading(false);
          return cachedFavorites;
        }
      }
      
      // Fetch from Supabase
      const favorites = await wordService.getFavoriteWords(deviceId);
      
      // Cache the results
      for (const word of favorites) {
        await cacheWord(word);
      }
      
      setIsLoading(false);
      return favorites;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch favorite words';
      setError(errorMessage);
      console.error('Error fetching favorite words:', err);
      setIsLoading(false);
      return [];
    }
  };
  
  /**
   * Sync any pending updates when online
   */
  const syncPendingUpdates = async (): Promise<void> => {
    if (!deviceId) return;
    
    try {
      // Sync progress updates
      const pendingProgressUpdates = await getPendingProgressUpdates();
      for (const update of pendingProgressUpdates) {
        try {
          await wordService.updateWordProgress(
            update.dailyWordId,
            deviceId,
            update.isCorrect,
            update.attempts,
            update.timeSpent
          );
          
          // Remove from pending queue
          await removePendingProgressUpdate(update);
        } catch (err) {
          console.error('Failed to sync progress update:', err);
          // Keep in queue to try again later
        }
      }
      
      // Sync favorite updates
      const pendingFavoriteUpdates = await getPendingFavoriteUpdates();
      for (const update of pendingFavoriteUpdates) {
        try {
          // For favorites, we need to check the current state to ensure
          // we're applying the correct toggle
          const currentStatus = await wordService.getCurrentFavoriteStatus(update.dailyWordId, deviceId);
          
          if (currentStatus !== update.favorited) {
            await wordService.toggleFavoriteWord(update.dailyWordId, deviceId);
          }
          
          // Remove from pending queue
          await removePendingFavoriteUpdate(update);
        } catch (err) {
          console.error('Failed to sync favorite update:', err);
          // Keep in queue to try again later
        }
      }
    } catch (err) {
      console.error('Error syncing pending updates:', err);
    }
  };
  
  /**
   * Utility functions for caching and managing offline data
   */
  
  // Cache a daily word
  const cacheWord = async (word: DailyWordWithDetails): Promise<void> => {
    try {
      const cachedWords = await getAllCachedWords();
      
      // Find and replace if exists, otherwise add
      const index = cachedWords.findIndex(w => 
        w.id === word.id && 
        w.difficulty === word.difficulty && 
        w.date === word.date
      );
      
      if (index >= 0) {
        cachedWords[index] = word;
      } else {
        cachedWords.push(word);
      }
      
      await AsyncStorage.setItem(CACHED_WORDS_KEY, JSON.stringify(cachedWords));
    } catch (err) {
      console.error('Error caching word:', err);
    }
  };
  
  // Get all cached words
  const getAllCachedWords = async (): Promise<DailyWordWithDetails[]> => {
    try {
      const cached = await AsyncStorage.getItem(CACHED_WORDS_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (err) {
      console.error('Error getting cached words:', err);
      return [];
    }
  };
  
  // Get cached word for a specific date and difficulty
  const getCachedWordForDate = async (
    date: string,
    difficulty: WordDifficulty
  ): Promise<DailyWordWithDetails | null> => {
    try {
      const cachedWords = await getAllCachedWords();
      return cachedWords.find(word => 
        word.date === date && 
        word.difficulty === difficulty
      ) || null;
    } catch (err) {
      console.error('Error getting cached word for date:', err);
      return null;
    }
  };
  
  // Get cached words for a date range
  const getCachedWordsForRange = async (
    startDate: string,
    endDate: string,
    difficulty: WordDifficulty
  ): Promise<DailyWordWithDetails[]> => {
    try {
      const cachedWords = await getAllCachedWords();
      return cachedWords.filter(word => 
        word.date >= startDate && 
        word.date <= endDate && 
        word.difficulty === difficulty
      );
    } catch (err) {
      console.error('Error getting cached words for range:', err);
      return [];
    }
  };
  
  // Update cached word progress
  const updateCachedWordProgress = async (
    dailyWordId: string,
    progress: Partial<UserProgressSchema>
  ): Promise<void> => {
    try {
      const cachedWords = await getAllCachedWords();
      const index = cachedWords.findIndex(word => word.id === dailyWordId);
      
      if (index >= 0) {
        cachedWords[index].user_progress = {
          ...cachedWords[index].user_progress,
          ...progress,
        };
        
        await AsyncStorage.setItem(CACHED_WORDS_KEY, JSON.stringify(cachedWords));
      }
    } catch (err) {
      console.error('Error updating cached word progress:', err);
    }
  };
  
  // Get cached favorite status for a word
  const getCachedFavoriteStatus = async (dailyWordId: string): Promise<boolean> => {
    try {
      const cachedWords = await getAllCachedWords();
      const word = cachedWords.find(word => word.id === dailyWordId);
      return word?.user_progress?.favorited || false;
    } catch (err) {
      console.error('Error getting cached favorite status:', err);
      return false;
    }
  };
  
  // Update cached favorite status
  const updateCachedFavoriteStatus = async (
    dailyWordId: string,
    favorited: boolean
  ): Promise<void> => {
    try {
      const cachedWords = await getAllCachedWords();
      const index = cachedWords.findIndex(word => word.id === dailyWordId);
      
      if (index >= 0) {
        if (!cachedWords[index].user_progress) {
          cachedWords[index].user_progress = {
            id: '',
            device_id: deviceId || '',
            daily_word_id: dailyWordId,
            correct: false,
            attempts: 0,
            favorited,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        } else {
          cachedWords[index].user_progress.favorited = favorited;
          cachedWords[index].user_progress.updated_at = new Date().toISOString();
        }
        
        await AsyncStorage.setItem(CACHED_WORDS_KEY, JSON.stringify(cachedWords));
      }
    } catch (err) {
      console.error('Error updating cached favorite status:', err);
    }
  };
  
  // Get cached favorite words
  const getCachedFavorites = async (): Promise<DailyWordWithDetails[]> => {
    try {
      const cachedWords = await getAllCachedWords();
      return cachedWords.filter(word => word.user_progress?.favorited);
    } catch (err) {
      console.error('Error getting cached favorites:', err);
      return [];
    }
  };
  
  // Queue a progress update for offline sync
  const queueProgressUpdate = async (update: any): Promise<void> => {
    try {
      const updates = await getPendingProgressUpdates();
      updates.push(update);
      await AsyncStorage.setItem(PENDING_PROGRESS_UPDATES_KEY, JSON.stringify(updates));
    } catch (err) {
      console.error('Error queueing progress update:', err);
    }
  };
  
  // Get pending progress updates
  const getPendingProgressUpdates = async (): Promise<any[]> => {
    try {
      const updates = await AsyncStorage.getItem(PENDING_PROGRESS_UPDATES_KEY);
      return updates ? JSON.parse(updates) : [];
    } catch (err) {
      console.error('Error getting pending progress updates:', err);
      return [];
    }
  };
  
  // Remove a pending progress update
  const removePendingProgressUpdate = async (updateToRemove: any): Promise<void> => {
    try {
      const updates = await getPendingProgressUpdates();
      const filteredUpdates = updates.filter(update => 
        update.dailyWordId !== updateToRemove.dailyWordId || 
        update.timestamp !== updateToRemove.timestamp
      );
      await AsyncStorage.setItem(PENDING_PROGRESS_UPDATES_KEY, JSON.stringify(filteredUpdates));
    } catch (err) {
      console.error('Error removing pending progress update:', err);
    }
  };
  
  // Queue a favorite update for offline sync
  const queueFavoriteUpdate = async (update: any): Promise<void> => {
    try {
      const updates = await getPendingFavoriteUpdates();
      updates.push(update);
      await AsyncStorage.setItem(PENDING_FAVORITES_KEY, JSON.stringify(updates));
    } catch (err) {
      console.error('Error queueing favorite update:', err);
    }
  };
  
  // Get pending favorite updates
  const getPendingFavoriteUpdates = async (): Promise<any[]> => {
    try {
      const updates = await AsyncStorage.getItem(PENDING_FAVORITES_KEY);
      return updates ? JSON.parse(updates) : [];
    } catch (err) {
      console.error('Error getting pending favorite updates:', err);
      return [];
    }
  };
  
  // Remove a pending favorite update
  const removePendingFavoriteUpdate = async (updateToRemove: any): Promise<void> => {
    try {
      const updates = await getPendingFavoriteUpdates();
      const filteredUpdates = updates.filter(update => 
        update.dailyWordId !== updateToRemove.dailyWordId || 
        update.timestamp !== updateToRemove.timestamp
      );
      await AsyncStorage.setItem(PENDING_FAVORITES_KEY, JSON.stringify(filteredUpdates));
    } catch (err) {
      console.error('Error removing pending favorite update:', err);
    }
  };
  
  return {
    isLoading,
    error,
    getTodayWord,
    getWordsForDateRange,
    submitAnswer,
    toggleFavorite,
    getFavoriteWords,
    syncPendingUpdates,
  };
} 