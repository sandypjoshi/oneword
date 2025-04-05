import { useCardStore } from '../store/cardStore';
import { useWordStore } from '../store/wordStore';
import { useWordCardStore } from '../store/wordCardStore';

/**
 * Migrates data from the legacy card and word stores to the new unified word card store.
 * This function should be called once during app initialization to ensure no data is lost
 * when transitioning to the new state management approach.
 */
export const migrateToUnifiedStore = (): void => {
  console.log('[Migration] Starting migration to unified word card store');
  
  // Get the states from all stores
  const cardState = useCardStore.getState();
  const wordState = useWordStore.getState();
  const wordCardState = useWordCardStore.getState();
  
  // 1. Migrate flipped card states
  cardState.flippedCardIds.forEach(wordId => {
    // Set card face to answer for previously flipped cards
    wordCardState.setCardFace(wordId, 'answer');
  });
  
  // 2. Migrate option states and selections
  Object.entries(cardState.selectedOptions).forEach(([wordId, option]) => {
    if (option) {
      // Find the word data to check if the selected option is correct
      const word = wordState.words.find(w => w.id === wordId);
      if (word?.options) {
        const isCorrect = word.options.find(o => o.value === option)?.isCorrect ?? false;
        
        // If the option already exists in the new store, don't overwrite it
        if (!wordCardState.getSelectedOption(wordId)) {
          wordCardState.selectOption(wordId, option, isCorrect);
        }
      }
    }
  });
  
  // 3. Migrate attempt counts
  Object.entries(cardState.attempts).forEach(([wordId, attempts]) => {
    if (attempts && attempts > 0) {
      // Only set attempts if they don't already exist in the new store
      if (wordCardState.getAttempts(wordId) === 0) {
        const word = wordState.words.find(w => w.id === wordId);
        const isRevealed = word?.isRevealed ?? false;
        
        // If the word is revealed, also mark it as revealed in the new store
        if (isRevealed) {
          wordCardState.markWordRevealed(wordId, attempts);
        }
      }
    }
  });
  
  // 4. Migrate revealed word states
  wordState.words.forEach(word => {
    if (word.isRevealed) {
      // Only mark as revealed if not already revealed in the new store
      if (!wordCardState.isWordRevealed(word.id)) {
        // Get attempts from card store or default to 1
        const attempts = cardState.attempts[word.id] ?? 1;
        wordCardState.markWordRevealed(word.id, attempts);
      }
    }
  });
  
  console.log('[Migration] Successfully migrated data to unified word card store');
};

/**
 * Resets the unified store to ensure a clean slate, typically used for testing
 * or when deliberately resetting user progress.
 */
export const resetUnifiedStore = (): void => {
  console.log('[Migration] Resetting unified word card store');
  useWordCardStore.getState()._dangerouslyResetAllState();
}; 