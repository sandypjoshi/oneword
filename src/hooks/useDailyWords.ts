import { useState, useEffect, useRef, useCallback } from 'react';
import { WordOfDay } from '../types/wordOfDay';
import { wordOfDayService } from '../services/wordOfDayService';
import { useWordStore } from '../store/wordStore';
import { useCardStore } from '../store/cardStore';

// Extended WordOfDay type to include placeholder flag
export interface ExtendedWordOfDay extends WordOfDay {
  isPlaceholder?: boolean;
}

// Define the placeholder object structure once
const placeholderTemplate = {
  word: '', pronunciation: '', partOfSpeech: '', definition: '',
  isPlaceholder: true
};

/**
 * Hook to manage fetching and providing the list of daily words.
 */
export function useDailyWords(daysToFetch: number = 14) {
  const [words, setWords] = useState<ExtendedWordOfDay[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadAttempted = useRef(false);

  // Zustand store hooks needed for initial state sync
  const storedWords = useWordStore(state => state.words);
  const flipCard = useCardStore(state => state.flipCard);

  // Define the loading function using useCallback
  const loadWords = useCallback(async (forceRefresh = false) => {
    // Skip if already attempted initial load and not forcing refresh
    if (initialLoadAttempted.current && !forceRefresh) return;
    if (!forceRefresh) {
      initialLoadAttempted.current = true;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get words for the past N days
      const recentWords = wordOfDayService.getWordsForPastDays(daysToFetch);

      // Create a complete array of the last N days, with placeholders for missing days
      const today = new Date();
      const allDays: ExtendedWordOfDay[] = [];

      for (let i = daysToFetch - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        const wordForDate = recentWords.find(word => {
          const wordDate = new Date(word.date);
          return wordDate.toISOString().split('T')[0] === dateString;
        });

        if (wordForDate) {
          const storedWord = storedWords.find(w => w.id === wordForDate.id);
          if (storedWord) {
            const wordWithState = {
              ...wordForDate,
              isRevealed: storedWord.isRevealed,
              userAttempts: storedWord.userAttempts
            };
            allDays.push(wordWithState);
            if (storedWord.isRevealed) {
              setTimeout(() => flipCard(wordForDate.id, true), 150);
            }
          } else {
            allDays.push(wordForDate);
          }
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
      console.error('Error loading words:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  // Include dependencies needed by the function
  }, [daysToFetch, storedWords, flipCard]);

  // Load words on mount
  useEffect(() => {
    loadWords();
  // loadWords is memoized, safe to include
  }, [loadWords]);

  // Expose a refetch function
  const refetchWords = useCallback(() => {
    loadWords(true); // Call loadWords with forceRefresh = true
  }, [loadWords]);

  // Return state and refetch function, removed setWords
  return { words, isLoading, error, refetchWords };
}

export default useDailyWords; 