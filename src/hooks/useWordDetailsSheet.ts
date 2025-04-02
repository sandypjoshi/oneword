import { useState, useRef, useCallback } from 'react';
import { WordOfDay } from '../types/wordOfDay';
import { WordDetailsBottomSheetRef } from '../components/today/WordDetailsBottomSheet'; // Adjust path as needed

/**
 * Hook to manage the state and interactions for the WordDetailsBottomSheet.
 */
export function useWordDetailsSheet() {
  const [selectedWord, setSelectedWord] = useState<WordOfDay | null>(null);
  const bottomSheetRef = useRef<WordDetailsBottomSheetRef>(null);

  const openWordDetails = useCallback((word: WordOfDay) => {
    setSelectedWord(word);
    // Need a slight delay to ensure state is set before opening
    setTimeout(() => {
        bottomSheetRef.current?.open();
    }, 50);
  }, []);

  const handleSheetDismiss = useCallback(() => {
    // Optionally clear selected word when sheet is dismissed
    // setSelectedWord(null);
    // console.log('Word details sheet dismissed');
  }, []);

  return {
    bottomSheetRef,
    selectedWord,
    openWordDetails,
    handleSheetDismiss,
  };
}

export default useWordDetailsSheet; 