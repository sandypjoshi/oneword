import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { speak, isSpeaking } from '../utils/tts';

// Define card states using a state machine approach
export type CardFace = 'question' | 'answer' | 'reflection';

// Define the option states for better type checking
export type OptionState = 'default' | 'correct' | 'incorrect';

interface WordCardState {
  // Core state tracking
  cardFaces: Record<string, CardFace>; // wordId -> current face
  selectedOptions: Record<string, string | undefined>; // wordId -> selectedOption
  optionStates: Record<string, Record<string, OptionState>>; // wordId -> { optionValue -> state }
  speakingWordIds: string[]; // IDs of words currently being spoken
  attempts: Record<string, number>; // wordId -> number of attempts
  revealedWordIds: string[]; // List of revealed word IDs
  
  // Actions - card face management
  setCardFace: (wordId: string, face: CardFace) => void;
  getCardFace: (wordId: string) => CardFace;
  
  // Actions - option selection
  selectOption: (wordId: string, option: string, isCorrect: boolean) => void;
  getSelectedOption: (wordId: string) => string | undefined;
  getOptionState: (wordId: string, option: string) => OptionState;
  clearSelection: (wordId: string) => void;
  
  // Actions - speech related
  speakWord: (wordId: string, word: string) => Promise<number>;
  isWordSpeaking: (wordId: string) => boolean;
  
  // Actions - revealed word tracking
  markWordRevealed: (wordId: string, attempts: number) => void;
  isWordRevealed: (wordId: string) => boolean;
  getRevealedWords: () => string[];
  
  // Actions - attempt tracking
  getAttempts: (wordId: string) => number;
  
  // Reset functionality
  resetCardState: (wordId: string) => void;
  _dangerouslyResetAllState: () => void;
}

// Define initial state
const initialState = {
  cardFaces: {},
  selectedOptions: {},
  optionStates: {},
  speakingWordIds: [],
  attempts: {},
  revealedWordIds: [],
};

export const useWordCardStore = create<WordCardState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Card face management
      setCardFace: (wordId, face) => {
        console.log(`[wordCardStore.setCardFace] Setting word ${wordId} to face: ${face}`);
        
        set((state) => ({
          cardFaces: {
            ...state.cardFaces,
            [wordId]: face
          }
        }));
      },
      
      getCardFace: (wordId) => {
        const storedFace = get().cardFaces[wordId];
        const face = storedFace || 'question';
        
        console.log(`[wordCardStore.getCardFace] Getting face for word ${wordId}: ${face}`);
        return face;
      },
      
      // Option selection
      selectOption: (wordId, option, isCorrect) => {
        console.log(`[wordCardStore.selectOption] Word: ${wordId}, Option: ${option}, Correct: ${isCorrect}`);
        
        set((state) => {
          // Track the attempts
          const currentAttempts = state.attempts[wordId] || 0;
          const newAttemptsCount = currentAttempts + 1;
          
          // Get current option states for this word
          const currentWordOptionStates = state.optionStates[wordId] || {};
          
          // Create new option states with correct typing
          const newOptionStates: Record<string, OptionState> = { ...currentWordOptionStates };
          // Set the option state based on correctness
          newOptionStates[option] = isCorrect ? 'correct' : 'incorrect';
          
          // Create state updates
          const updates: Partial<WordCardState> = {
            selectedOptions: {
              ...state.selectedOptions,
              [wordId]: option
            },
            optionStates: {
              ...state.optionStates,
              [wordId]: newOptionStates
            },
            attempts: {
              ...state.attempts,
              [wordId]: newAttemptsCount,
            }
          };
          
          // If correct answer, update the card face and mark revealed
          if (isCorrect) {
            updates.cardFaces = {
              ...state.cardFaces,
              [wordId]: 'answer'
            };
            
            // Only add to revealed if not already there
            if (!state.revealedWordIds.includes(wordId)) {
              updates.revealedWordIds = [...state.revealedWordIds, wordId];
            }
          }
          
          return updates;
        });
      },
      
      getSelectedOption: (wordId) => {
        return get().selectedOptions[wordId];
      },
      
      getOptionState: (wordId, option) => {
        return get().optionStates[wordId]?.[option] || 'default';
      },
      
      clearSelection: (wordId) => {
        console.log(`[wordCardStore.clearSelection] Clearing selection for word: ${wordId}`);
        set((state) => {
          const newSelectedOptions = { ...state.selectedOptions };
          delete newSelectedOptions[wordId];
          return { selectedOptions: newSelectedOptions };
        });
      },
      
      // Speech related
      speakWord: async (wordId, word) => {
        set((state) => ({
          speakingWordIds: [...state.speakingWordIds, wordId]
        }));
        
        try {
          const duration = await speak(word);
          
          // Use recursive setTimeout to check speaking state
          const checkSpeaking = () => {
            if (!isSpeaking()) {
              set((state) => ({
                speakingWordIds: state.speakingWordIds.filter(id => id !== wordId)
              }));
            } else {
              setTimeout(checkSpeaking, 250);
            }
          };
          
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
      
      isWordSpeaking: (wordId) => {
        return get().speakingWordIds.includes(wordId);
      },
      
      // Revealed word tracking
      markWordRevealed: (wordId, attempts) => {
        console.log(`[wordCardStore.markWordRevealed] Marking word ${wordId} as revealed with ${attempts} attempts`);
        set((state) => {
          // Only add to revealed if not already there
          if (!state.revealedWordIds.includes(wordId)) {
            return {
              revealedWordIds: [...state.revealedWordIds, wordId],
              // Also update attempts if provided
              ...(attempts !== undefined && {
                attempts: {
                  ...state.attempts,
                  [wordId]: attempts
                }
              }),
              // Set card face to answer if not already in reflection
              cardFaces: {
                ...state.cardFaces,
                [wordId]: state.cardFaces[wordId] === 'reflection' ? 'reflection' : 'answer'
              }
            };
          }
          return state; // No changes if already revealed
        });
      },
      
      isWordRevealed: (wordId) => {
        const revealed = get().revealedWordIds.includes(wordId);
        console.log(`[wordCardStore.isWordRevealed] Checking if word ${wordId} is revealed: ${revealed}`);
        return revealed;
      },
      
      getRevealedWords: () => {
        return get().revealedWordIds;
      },
      
      // Attempt tracking
      getAttempts: (wordId) => {
        return get().attempts[wordId] || 0;
      },
      
      // Reset functionality
      resetCardState: (wordId) => {
        console.log(`[wordCardStore.resetCardState] Resetting state for word: ${wordId}`);
        set((state) => {
          // Create copies of state objects
          const newCardFaces = { ...state.cardFaces };
          const newSelectedOptions = { ...state.selectedOptions };
          const newOptionStates = { ...state.optionStates };
          const newAttempts = { ...state.attempts };
          const newRevealedWordIds = state.revealedWordIds.filter(id => id !== wordId);
          
          // Remove states for this word
          delete newCardFaces[wordId];
          delete newSelectedOptions[wordId];
          delete newOptionStates[wordId];
          delete newAttempts[wordId];
          
          return {
            cardFaces: newCardFaces,
            selectedOptions: newSelectedOptions,
            optionStates: newOptionStates,
            attempts: newAttempts,
            revealedWordIds: newRevealedWordIds,
          };
        });
      },
      
      _dangerouslyResetAllState: () => {
        console.warn('[wordCardStore._dangerouslyResetAllState] Resetting all card state');
        set(initialState);
      },
    }),
    {
      name: 'word-card-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist these fields to AsyncStorage
      partialize: (state) => ({
        revealedWordIds: state.revealedWordIds,
        cardFaces: state.cardFaces,
        attempts: state.attempts,
      }),
      
      // Add debugging for rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[wordCardStore] Successfully rehydrated state:', {
            revealed: state.revealedWordIds.length,
            cardFaces: Object.keys(state.cardFaces).length,
            revealedDetails: state.revealedWordIds.join(', '),
            faceDetails: Object.entries(state.cardFaces)
              .map(([id, face]) => `${id}:${face}`)
              .join(', ')
          });
        } else {
          console.warn('[wordCardStore] Failed to rehydrate state from storage');
        }
      },
    }
  )
); 