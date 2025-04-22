import { useState, useEffect, useRef, useCallback } from 'react';
import { WordOfDay } from '../types/wordOfDay';
import { wordOfDayService } from '../services/wordOfDayService';
// import { useWordStore } from '../store/wordStore'; // Remove dependency on wordStore for state merging
// import { useWordCardStore } from '../store/wordCardStore'; // This store is not used here

// Extended WordOfDay type to include placeholder flag
// export interface ExtendedWordOfDay extends WordOfDay {
//   isPlaceholder?: boolean;
// }

// Define the placeholder object structure once
const placeholderTemplate = {
  word: '',
  pronunciation: '',
  partOfSpeech: '',
  definition: '',
  isPlaceholder: true,
  // Add other WordOfDay fields with default values if needed by components consuming placeholders
  id: '', // Placeholder needs an ID
  date: '', // Placeholder needs a date
  // options: [], // Optional, might not be needed for placeholder rendering
};

/**
 * Hook to manage fetching and providing the list of daily words.
 */
export function useDailyWords(daysToFetch: number = 14) {
  // State type is now WordOfDay | (typeof placeholderTemplate & { id: string; date: string })
  const [words, setWords] = useState<(WordOfDay | typeof placeholderTemplate)[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadAttempted = useRef(false);

  // Zustand store hooks needed for initial state sync
  // const storedWords = useWordStore(state => state.words); // Removed

  // Define the loading function using useCallback
  const loadWords = useCallback(
    async (forceRefresh = false) => {
      console.log(`[useDailyWords] Fetching words for ${daysToFetch} days...`);
      // Skip if already attempted initial load and not forcing refresh
      if (initialLoadAttempted.current && !forceRefresh) return;
      if (!forceRefresh) {
        initialLoadAttempted.current = true;
      }

      setIsLoading(true);
      setError(null);

      // Initialize allDays outside try block to make it available in finally block
      let allDays: (WordOfDay | typeof placeholderTemplate)[] = [];

      try {
        // Get words for the past N days
        const recentWords = wordOfDayService.getWordsForPastDays(daysToFetch);

        // Create a complete array of the last N days, with placeholders for missing days
        const today = new Date();
        allDays = [];

        for (let i = daysToFetch - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateString = date.toISOString().split('T')[0];

          const wordForDate = recentWords.find(word => {
            // Ensure word.date is treated as a string for comparison
            const wordDateStr = typeof word.date === 'string' ? word.date.split('T')[0] : '';
            return wordDateStr === dateString;
          });

          if (wordForDate) {
            // --- REMOVED STATE MERGING LOGIC ---
            // const storedWord = storedWords.find(w => w.id === wordForDate.id);
            // if (storedWord) {
            //   const wordWithState = {
            //     ...wordForDate,
            //     isRevealed: storedWord.isRevealed, // State should come from wordCardStore
            //     userAttempts: storedWord.userAttempts, // State should come from progressStore
            //   };
            //   allDays.push(wordWithState);
            // } else {
            //   allDays.push(wordForDate);
            // }
            allDays.push(wordForDate); // Push the raw word data
            // --- END REMOVED STATE MERGING LOGIC ---
          } else {
            allDays.push({
              ...placeholderTemplate,
              id: `placeholder-${dateString}`,
              date: dateString,
            });
          }
        }
        setWords(allDays);
      } catch (err) {
        console.error('[useDailyWords] Error fetching words:', err);
        setError(
          err instanceof Error ? err : new Error('Failed to fetch words')
        );
      } finally {
        console.log('[useDailyWords] Fetching complete.');
        setIsLoading(false);
        console.log(
          `[useDailyWords] Final words array length: ${allDays.length}`
        );
      }
    },
    // [daysToFetch, storedWords] // Removed storedWords dependency
    [daysToFetch]
  );

  // Effect to load words on mount or when daysToFetch changes
  useEffect(() => {
    loadWords();
  }, [loadWords]);

  // Add effect to log words length when it changes
  useEffect(() => {
    if (!isLoading) {
      console.log(
        `[useDailyWords] Words state updated. Length: ${words.length}`
      );
      // console.log('[useDailyWords] Words state:', words); // Uncomment for detailed view
    }
  }, [words, isLoading]);

  // Expose a refetch function
  const refetchWords = useCallback(() => {
    loadWords(true); // Call loadWords with forceRefresh = true
  }, [loadWords]);

  // Return state and refetch function, removed setWords
  return { words, isLoading, error, refetchWords };
}

export default useDailyWords;
