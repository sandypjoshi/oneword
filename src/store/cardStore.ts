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
  
  // Actions
  flipCard: (wordId: string, flipped: boolean) => void;
  selectOption: (wordId: string, option: string, isCorrect: boolean) => void;
  speakWord: (wordId: string, word: string) => Promise<number>;
  resetCardState: (wordId: string) => void;
  isCardFlipped: (wordId: string) => boolean;
  isWordSpeaking: (wordId: string) => boolean;
  getOptionState: (wordId: string, option: string) => OptionState;
  getSelectedOption: (wordId: string) => string | undefined;
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      flippedCardIds: [],
      selectedOptions: {},
      optionStates: {},
      speakingWordIds: [],
      
      flipCard: (wordId, flipped) => {
        set((state) => ({
          flippedCardIds: flipped 
            ? [...state.flippedCardIds, wordId]
            : state.flippedCardIds.filter(id => id !== wordId)
        }));
      },
      
      selectOption: (wordId, option, isCorrect) => {
        set((state) => {
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
            }
          };
          
          // Automatically flip card if correct
          if (isCorrect) {
            newState.flippedCardIds = [...state.flippedCardIds, wordId];
          }
          
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
        set((state) => {
          const newSelectedOptions = { ...state.selectedOptions };
          // Delete the property instead of setting it to undefined
          delete newSelectedOptions[wordId];
          
          const newOptionStates = { ...state.optionStates };
          // Initialize with empty option states object
          newOptionStates[wordId] = {};
          
          return {
            flippedCardIds: state.flippedCardIds.filter(id => id !== wordId),
            selectedOptions: newSelectedOptions,
            optionStates: newOptionStates
          };
        });
      },
      
      isCardFlipped: (wordId) => {
        return get().flippedCardIds.includes(wordId);
      },
      
      isWordSpeaking: (wordId) => {
        return get().speakingWordIds.includes(wordId);
      },
      
      getOptionState: (wordId, option) => {
        return get().optionStates[wordId]?.[option] || 'default';
      },
      
      getSelectedOption: (wordId) => {
        return get().selectedOptions[wordId];
      }
    }),
    {
      name: 'card-ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist selection state, not temporary UI states
        selectedOptions: state.selectedOptions,
        // Filter out empty option states to save storage space
        optionStates: Object.fromEntries(
          Object.entries(state.optionStates)
            .filter(([_, value]) => Object.keys(value).length > 0)
        ),
      }),
    }
  )
); 