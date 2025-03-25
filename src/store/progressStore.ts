import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProgressState {
  streak: number;
  longestStreak: number;
  totalWordsLearned: number;
  lastCompletedDate: string | null;
  
  // Actions
  incrementStreak: () => void;
  resetStreak: () => void;
  incrementWordsLearned: () => void;
  checkAndUpdateStreak: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      streak: 0,
      longestStreak: 0,
      totalWordsLearned: 0,
      lastCompletedDate: null,
      
      incrementStreak: () => set(state => {
        const newStreak = state.streak + 1;
        return {
          streak: newStreak,
          longestStreak: Math.max(newStreak, state.longestStreak)
        };
      }),
      
      resetStreak: () => set({ streak: 0 }),
      
      incrementWordsLearned: () => set(state => ({
        totalWordsLearned: state.totalWordsLearned + 1
      })),
      
      checkAndUpdateStreak: () => {
        const { streak, lastCompletedDate } = get();
        const today = new Date().toISOString().split('T')[0];
        
        if (lastCompletedDate === null) {
          // First word ever completed
          set({ 
            streak: 1, 
            longestStreak: 1,
            lastCompletedDate: today 
          });
          return;
        }
        
        // If already completed today, do nothing
        if (lastCompletedDate === today) {
          return;
        }
        
        // Check if we completed a word yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastCompletedDate === yesterdayStr) {
          // We're maintaining our streak
          set(state => ({ 
            streak: state.streak + 1,
            longestStreak: Math.max(state.streak + 1, state.longestStreak),
            lastCompletedDate: today
          }));
        } else {
          // We broke our streak
          set({ 
            streak: 1, // Start a new streak
            lastCompletedDate: today 
          });
        }
      }
    }),
    {
      name: 'user-progress-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 