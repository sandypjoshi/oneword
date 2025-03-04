/**
 * User store
 * Manages user state and preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WordDifficulty } from '../lib/api/wordsAPI';

// Define user state interface
interface UserState {
  deviceId: string | null;
  difficulty: WordDifficulty;
  streak: number;
  totalWordsLearned: number;
  daysActive: number;
  lastActive: string | null; // ISO date string
  favorites: string[]; // Array of word IDs
  settings: {
    notifications: boolean;
    darkMode: 'system' | 'light' | 'dark';
  };
  
  // Actions
  setDeviceId: (deviceId: string) => void;
  setDifficulty: (difficulty: WordDifficulty) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  incrementWordsLearned: () => void;
  updateLastActive: () => void;
  toggleFavorite: (wordId: string) => void;
  updateSettings: (settings: Partial<UserState['settings']>) => void;
}

/**
 * User store using Zustand with persistence
 * Stores user preferences and statistics
 */
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      deviceId: null,
      difficulty: WordDifficulty.BEGINNER,
      streak: 0,
      totalWordsLearned: 0,
      daysActive: 0,
      lastActive: null,
      favorites: [],
      settings: {
        notifications: true,
        darkMode: 'system',
      },
      
      // Set the device ID
      setDeviceId: (deviceId: string) => set({ deviceId }),
      
      // Update user's chosen difficulty level
      setDifficulty: (difficulty: WordDifficulty) => set({ difficulty }),
      
      // Increment the streak counter
      incrementStreak: () => set((state) => ({ streak: state.streak + 1 })),
      
      // Reset the streak counter
      resetStreak: () => set({ streak: 0 }),
      
      // Increment the total words learned counter
      incrementWordsLearned: () => 
        set((state) => ({ totalWordsLearned: state.totalWordsLearned + 1 })),
      
      // Update the last active date and potentially increment days active
      updateLastActive: () => {
        const today = new Date().toISOString().split('T')[0];
        const lastActive = get().lastActive;
        
        // If this is the first time or a different day than last active
        if (!lastActive || lastActive !== today) {
          set({
            lastActive: today,
            daysActive: get().daysActive + 1,
          });
        }
      },
      
      // Toggle a word in the favorites list
      toggleFavorite: (wordId: string) => {
        set((state) => {
          const isFavorited = state.favorites.includes(wordId);
          
          return {
            favorites: isFavorited
              ? state.favorites.filter((id) => id !== wordId)
              : [...state.favorites, wordId],
          };
        });
      },
      
      // Update user settings
      updateSettings: (newSettings: Partial<UserState['settings']>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          },
        }));
      },
    }),
    {
      name: 'oneword-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useUserStore; 