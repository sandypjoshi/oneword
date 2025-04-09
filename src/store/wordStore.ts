import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wordOfDayService } from '../services/wordOfDayService';
import { WordOfDay } from '../types/wordOfDay';

interface WordState {
  // Word collection data
  words: WordOfDay[];
  activeIndex: number;
  isLoading: boolean;
  error: Error | null;

  // Actions
  fetchWords: (days: number, forceRefresh?: boolean) => Promise<void>;
  setActiveIndex: (index: number) => void;
  _dangerouslyResetAllState: () => void;
}

const initialState = {
  words: [],
  activeIndex: 0,
  isLoading: false,
  error: null,
};

export const useWordStore = create<WordState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchWords: async (days = 14, forceRefresh = false) => {
        // Skip fetching if we already have words and don't need to refresh
        if (get().words.length > 0 && !forceRefresh) return;

        set({ isLoading: true, error: null });
        try {
          const recentWords = wordOfDayService.getWordsForPastDays(days);

          // Create complete array with placeholders for missing days
          const today = new Date();
          const allWords = Array.from({ length: days }, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (days - i - 1));
            const dateString = date.toISOString().split('T')[0];

            // Find word for this date or create placeholder
            const wordForDate = recentWords.find(word => {
              const wordDate = new Date(word.date);
              return wordDate.toISOString().split('T')[0] === dateString;
            });

            if (wordForDate) return wordForDate;

            // Create placeholder
            return {
              id: `placeholder-${dateString}`,
              word: '',
              pronunciation: '',
              partOfSpeech: '',
              definition: '',
              date: dateString,
              isPlaceholder: true,
            };
          });

          set({
            words: allWords,
            activeIndex: allWords.length - 1, // Set to today
            isLoading: false,
          });
        } catch (error) {
          set({ error: error as Error, isLoading: false });
        }
      },

      setActiveIndex: index => set({ activeIndex: index }),

      _dangerouslyResetAllState: () => {
        console.warn('[wordStore] Resetting ALL word state!');
        set(initialState);
      },
    }),
    {
      name: 'word-progress-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        // Only persist basic word data, not interaction state
        words: state.words.map(({ id, date, word }) => ({
          id,
          date,
          word,
        })),
      }),
    }
  )
);
