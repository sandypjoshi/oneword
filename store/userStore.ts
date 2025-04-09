/**
 * User store
 * Manages user state and preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local definition of word difficulty levels
export enum WordDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

interface UserSettings {
  darkMode: 'light' | 'dark' | 'system';
  wordDifficulty: 'beginner' | 'intermediate' | 'advanced';
  notifications: boolean;
}

interface UserState {
  deviceId: string | null;
  difficulty: WordDifficulty;
  streak: number;
  totalWordsLearned: number;
  daysActive: number;
  lastActive: Date | null;
  favorites: string[]; // Array of word IDs
  settings: UserSettings;

  // Actions
  setDeviceId: (id: string) => void;
  setDifficulty: (difficulty: WordDifficulty) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  incrementWordsLearned: () => void;
  updateLastActive: () => void;
  toggleFavorite: (wordId: string) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
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
        darkMode: 'system',
        wordDifficulty: 'intermediate',
        notifications: true,
      },

      // Set the device ID
      setDeviceId: (id: string) => set({ deviceId: id }),

      // Update user's chosen difficulty level
      setDifficulty: (difficulty: WordDifficulty) => set({ difficulty }),

      // Increment the streak counter
      incrementStreak: () => set(state => ({ streak: state.streak + 1 })),

      // Reset the streak counter
      resetStreak: () => set({ streak: 0 }),

      // Increment the total words learned counter
      incrementWordsLearned: () =>
        set(state => ({ totalWordsLearned: state.totalWordsLearned + 1 })),

      // Update the last active date and potentially increment days active
      updateLastActive: () => {
        set({ lastActive: new Date() });
      },

      // Toggle a word in the favorites list
      toggleFavorite: (wordId: string) => {
        set(state => {
          const isFavorited = state.favorites.includes(wordId);

          return {
            favorites: isFavorited
              ? state.favorites.filter(id => id !== wordId)
              : [...state.favorites, wordId],
          };
        });
      },

      // Update user settings
      updateSettings: (newSettings: Partial<UserSettings>) => {
        set(state => ({
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
      partialize: state => ({
        deviceId: state.deviceId,
        settings: state.settings,
      }),
    }
  )
);

export default useUserStore;
