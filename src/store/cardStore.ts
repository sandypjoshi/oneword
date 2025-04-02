import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { speak, isSpeaking } from '../utils/tts';

// Option state types
export type OptionState = 'default' | 'correct' | 'incorrect';

interface CardState {
  // Card flip state
  flippedCardIds: string[];
  selectedOptions: Record<string, string | undefined>; // wordId -> selectedOption
  optionStates: Record<string, Record<string, OptionState>>;
  speakingWordIds: string[];
  attempts: Record<string, number>;
  
  // Actions
  flipCard: (wordId: string, flipped: boolean) => void;
  selectOption: (wordId: string, option: string, isCorrect: boolean) => void;
  speakWord: (wordId: string, word: string) => Promise<number>;
  resetCardState: (wordId: string) => void;
  isCardFlipped: (wordId: string) => boolean;
  isWordSpeaking: (wordId: string) => boolean;
  getOptionState: (wordId: string, option: string) => OptionState;
  getSelectedOption: (wordId: string) => string | undefined;
  getAttempts: (wordId: string) => number | undefined;
  _dangerouslyResetAllState: () => void;
  clearSelection: (wordId: string) => void;
}

const initialState = { // Define initial state separately
  flippedCardIds: [],
  selectedOptions: {},
  optionStates: {},
  speakingWordIds: [],
  attempts: {},
};

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      ...initialState, // Spread initial state
      
      flipCard: (wordId, flipped) => {
        console.log(`[cardStore.flipCard] Called for Word: ${wordId}, Flipped: ${flipped}`);
        set((state) => ({
          flippedCardIds: flipped 
            ? [...state.flippedCardIds, wordId]
            : state.flippedCardIds.filter(id => id !== wordId)
        }));
      },
      
      selectOption: (wordId, option, isCorrect) => {
        console.log(`[cardStore.selectOption] Called for Word: ${wordId}, Option: ${option}, Correct: ${isCorrect}`);
        set((state) => {
          // --- Attempts Logic --- 
          const currentAttempts = state.attempts[wordId] || 0;
          const newAttemptsCount = currentAttempts + 1;

          // Get current option states for this word
          const currentWordOptionStates = state.optionStates[wordId] || {};
          
          // Create new option states with correct typing
          const newOptionStates: Record<string, OptionState> = { ...currentWordOptionStates };
          // Set the option state based on correctness
          newOptionStates[option] = isCorrect ? 'correct' : 'incorrect';
          
          // Update the stores
          const newState: Partial<CardState> = {
            selectedOptions: {
              ...state.selectedOptions,
              [wordId]: option
            },
            optionStates: {
              ...state.optionStates,
              [wordId]: newOptionStates
            },
            // --- Add attempts update ---
            attempts: {
              ...state.attempts,
              [wordId]: newAttemptsCount,
            }
          };
          
          // --- Flip card state only if correct ---
          if (isCorrect) {
             // Ensure uniqueness and add current wordId if correct
            newState.flippedCardIds = [...new Set([...state.flippedCardIds, wordId])];
          }
          
          console.log(`[cardStore.selectOption] Word: ${wordId}, New Attempts: ${newAttemptsCount}, New State:`, newState);
          return newState;
        });
      },
      
      speakWord: async (wordId, word) => {
        set((state) => ({
          speakingWordIds: [...state.speakingWordIds, wordId]
        }));
        
        try {
          // Use the speak utility to pronounce the word
          const duration = await speak(word);
          
          // Use recursive setTimeout instead of setInterval for better performance
          const checkSpeaking = () => {
            if (!isSpeaking()) {
              set((state) => ({
                speakingWordIds: state.speakingWordIds.filter(id => id !== wordId)
              }));
            } else {
              setTimeout(checkSpeaking, 250); // Check less frequently (250ms vs 100ms)
            }
          };
          
          // Start checking after a short delay
          setTimeout(checkSpeaking, 250);
          
          return duration;
        } catch (error) {
          // Clear speaking state on error
          set((state) => ({
            speakingWordIds: state.speakingWordIds.filter(id => id !== wordId)
          }));
          return 0;
        }
      },
      
      resetCardState: (wordId) => {
        console.log(`[cardStore.resetCardState] Called for Word: ${wordId}`);
        set((state) => {
          const newSelectedOptions = { ...state.selectedOptions };
          delete newSelectedOptions[wordId];
          const newOptionStates = { ...state.optionStates };
          newOptionStates[wordId] = {};
          // --- Reset attempts ---
          const newAttempts = { ...state.attempts };
          delete newAttempts[wordId];
          
          return {
            flippedCardIds: state.flippedCardIds.filter(id => id !== wordId),
            selectedOptions: newSelectedOptions,
            optionStates: newOptionStates,
            attempts: newAttempts,
          };
        });
      },
      
      isCardFlipped: (wordId) => {
        const isFlipped = get().flippedCardIds.includes(wordId);
        // console.log(`[cardStore.isCardFlipped] Checked for Word: ${wordId}, Result: ${isFlipped}`); // Noisy
        return isFlipped;
      },
      
      isWordSpeaking: (wordId) => {
        const isSpeaking = get().speakingWordIds.includes(wordId);
        // console.log(`[cardStore.isWordSpeaking] Checked for Word: ${wordId}, Result: ${isSpeaking}`); // Noisy
        return isSpeaking;
      },
      
      getOptionState: (wordId, option) => {
        const state = get().optionStates[wordId]?.[option] || 'default';
        // console.log(`[cardStore.getOptionState] Checked for Word: ${wordId}, Option: ${option}, Result: ${state}`); // Noisy
        return state;
      },
      
      getSelectedOption: (wordId) => {
        const option = get().selectedOptions[wordId];
        // console.log(`[cardStore.getSelectedOption] Checked for Word: ${wordId}, Result: ${option}`); // Noisy
        return option;
      },

      // --- Add getAttempts selector ---
      getAttempts: (wordId) => {
        const attemptsCount = get().attempts[wordId];
        // console.log(`[cardStore.getAttempts] Checked for Word: ${wordId}, Result: ${attemptsCount}`); // Noisy
        return attemptsCount;
      },

      // --- Add reset action implementation ---
      _dangerouslyResetAllState: () => {
        console.warn('[cardStore] Resetting ALL card state!');
        set(initialState); // Reset to initial state
      },

      // Add clearSelection implementation
      clearSelection: (wordId) => {
        console.log(`[cardStore.clearSelection] Called for Word: ${wordId}`);
        set((state) => {
          const newSelectedOptions = { ...state.selectedOptions };
          delete newSelectedOptions[wordId];
          // Also mark as flipped when clearing selection after seeing reflection
          const newState: Partial<CardState> = {
            selectedOptions: newSelectedOptions,
          };
          return newState;
        });
      },
    }),
    {
      name: 'card-ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persist flipped card IDs to maintain card state between sessions
        flippedCardIds: state.flippedCardIds,
        // Only persist selection state, not temporary UI states
        selectedOptions: state.selectedOptions,
        // Filter out empty option states to save storage space
        optionStates: Object.fromEntries(
          Object.entries(state.optionStates)
            .filter(([_, value]) => Object.keys(value).length > 0)
        ),
        attempts: state.attempts,
      }),
    }
  )
); 