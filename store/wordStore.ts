/**
 * Word store
 * Manages daily words and vocabulary state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WordDifficulty, WordResponse } from '../lib/api/wordsAPI';

// Define a daily word interface
interface DailyWord {
  id: string; // Typically date-difficulty format, e.g., "2023-03-01-beginner"
  word: string;
  date: string; // ISO date string
  difficulty: WordDifficulty;
  details: WordResponse | null;
  learned: boolean;
  correctOption?: number; // Index of the correct option (for quiz)
  options?: string[]; // Array of meaning options for quiz
}

// Define word state interface
interface WordState {
  currentDate: string; // ISO date string
  selectedDate: string; // ISO date string
  dailyWords: DailyWord[];
  loadingWord: boolean;
  errorMessage: string | null;
  
  // Actions
  setCurrentDate: (date: string) => void;
  setSelectedDate: (date: string) => void;
  addDailyWord: (dailyWord: DailyWord) => void;
  updateDailyWordDetails: (id: string, details: WordResponse) => void;
  markWordAsLearned: (id: string) => void;
  setLoadingWord: (loading: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  getWordForDate: (date: string, difficulty: WordDifficulty) => DailyWord | undefined;
  clearOldWords: (keepDays: number) => void;
}

/**
 * Word store using Zustand with persistence
 * Stores daily words and related vocabulary state
 */
export const useWordStore = create<WordState>()(
  persist(
    (set, get) => ({
      currentDate: new Date().toISOString().split('T')[0],
      selectedDate: new Date().toISOString().split('T')[0],
      dailyWords: [],
      loadingWord: false,
      errorMessage: null,
      
      // Set the current date
      setCurrentDate: (date: string) => set({ currentDate: date }),
      
      // Set the selected date
      setSelectedDate: (date: string) => set({ selectedDate: date }),
      
      // Add a daily word to the store
      addDailyWord: (dailyWord: DailyWord) => {
        set((state) => {
          // Avoid duplicates
          const exists = state.dailyWords.some((word) => word.id === dailyWord.id);
          
          if (exists) {
            return state;
          }
          
          return {
            dailyWords: [...state.dailyWords, dailyWord],
          };
        });
      },
      
      // Update a daily word with its details from the API
      updateDailyWordDetails: (id: string, details: WordResponse) => {
        set((state) => ({
          dailyWords: state.dailyWords.map((word) =>
            word.id === id ? { ...word, details } : word
          ),
        }));
      },
      
      // Mark a word as learned
      markWordAsLearned: (id: string) => {
        set((state) => ({
          dailyWords: state.dailyWords.map((word) =>
            word.id === id ? { ...word, learned: true } : word
          ),
        }));
      },
      
      // Set loading state
      setLoadingWord: (loading: boolean) => set({ loadingWord: loading }),
      
      // Set error message
      setErrorMessage: (message: string | null) => set({ errorMessage: message }),
      
      // Get a daily word for a specific date and difficulty
      getWordForDate: (date: string, difficulty: WordDifficulty) => {
        const { dailyWords } = get();
        const id = `${date}-${difficulty}`;
        
        return dailyWords.find((word) => word.id === id);
      },
      
      // Clear words older than a specific number of days
      clearOldWords: (keepDays: number) => {
        const today = new Date();
        
        set((state) => {
          // Filter out words that are older than keepDays
          const keptWords = state.dailyWords.filter((word) => {
            const wordDate = new Date(word.date);
            const diffTime = Math.abs(today.getTime() - wordDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return diffDays <= keepDays;
          });
          
          return {
            dailyWords: keptWords,
          };
        });
      },
    }),
    {
      name: 'oneword-word-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useWordStore; 