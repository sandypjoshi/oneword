import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { speak } from '../utils/tts';
import { immer } from 'zustand/middleware/immer';

// Define card states using a state machine approach
export type CardFace = 'question' | 'answer' | 'reflection';

// Define the option states for better type checking
export type OptionState = 'default' | 'correct' | 'incorrect';

// --- Interface for state specific to one word ---
interface WordSpecificState {
  face: CardFace;
  selectedOption?: string; // Optional: Might not be selected
  optionStates: Record<string, OptionState>; // optionValue -> state
  attempts: number;
  isRevealed: boolean;
}

// --- Main state interface using nested structure ---
interface WordCardState {
  words: Record<string, WordSpecificState>; // wordId -> WordSpecificState
  speakingWordIds: string[]; // IDs of words currently being spoken (remains separate, UI state)
  
  // Actions & Selectors (Signatures remain largely the same, implementation changes)
  setCardFace: (wordId: string, face: CardFace) => void;
  getCardFace: (wordId: string) => CardFace;
  selectOption: (wordId: string, option: string, isCorrect: boolean) => void;
  getSelectedOption: (wordId: string) => string | undefined;
  getOptionState: (wordId: string, option: string) => OptionState;
  clearSelection: (wordId: string) => void;
  speakWord: (wordId: string, word: string) => Promise<void>;
  isWordSpeaking: (wordId: string) => boolean;
  markWordRevealed: (wordId: string, attempts?: number) => void;
  isWordRevealed: (wordId: string) => boolean;
  getRevealedWords: () => string[];
  getAttempts: (wordId: string) => number;
  resetCardState: (wordId: string) => void;
  _dangerouslyResetAllState: () => void;
}

// --- Define initial state ---
const initialState: Omit<WordCardState, 'setCardFace' | 'getCardFace' | 'selectOption' | 'getSelectedOption' | 'getOptionState' | 'clearSelection' | 'speakWord' | 'isWordSpeaking' | 'markWordRevealed' | 'isWordRevealed' | 'getRevealedWords' | 'getAttempts' | 'resetCardState' | '_dangerouslyResetAllState'> = {
  words: {},
  speakingWordIds: [],
};

// Default state creator for a new word (pure function)
const createDefaultWordState = (): WordSpecificState => ({
  face: 'question',
  optionStates: {},
  attempts: 0,
  isRevealed: false,
});

export const useWordCardStore = create<WordCardState>()(
  // Apply Immer middleware FIRST
  immer(
    persist(
      (set, get) => ({
        ...initialState,
        
        // --- ACTIONS REFACTORED WITH IMMER --- //

        setCardFace: (wordId, face) => set((state) => {
          console.log(`[wordCardStore.setCardFace] Setting word ${wordId} to face: ${face}`);
          // Ensure word state exists or create it
          if (!state.words[wordId]) {
            state.words[wordId] = createDefaultWordState();
          }
          // Directly mutate the draft state
          state.words[wordId].face = face;
        }),

        selectOption: (wordId, option, isCorrect) => set((state) => {
          console.log(`[wordCardStore.selectOption] Word: ${wordId}, Option: ${option}, Correct: ${isCorrect}`);
          // Ensure word state exists or create it
          if (!state.words[wordId]) {
            state.words[wordId] = createDefaultWordState();
          }
          const wordState = state.words[wordId];

          // Mutate properties on the draft state
          wordState.attempts += 1;
          wordState.selectedOption = option;
          // Ensure optionStates exists before assigning
          if (!wordState.optionStates) wordState.optionStates = {}; 
          wordState.optionStates[option] = isCorrect ? 'correct' : 'incorrect';

          if (isCorrect) {
            wordState.face = 'answer';
            wordState.isRevealed = true;
          }
        }),
        
        clearSelection: (wordId) => set((state) => {
          console.log(`[wordCardStore.clearSelection] Clearing selection for word: ${wordId}`);
          // Check if word and selection exist before attempting delete
          if (state.words[wordId]?.selectedOption !== undefined) {
             // Use delete on the draft state property
             delete state.words[wordId].selectedOption;
          } else {
            console.warn(`[wordCardStore.clearSelection] Word ${wordId} or its selection not found.`);
          }
        }),
        
        markWordRevealed: (wordId, attempts) => set((state) => {
          console.log(`[wordCardStore.markWordRevealed] Marking word ${wordId} as revealed`);
          // Ensure word state exists or create it
          if (!state.words[wordId]) {
            state.words[wordId] = createDefaultWordState();
          }
          const wordState = state.words[wordId];

          // Avoid redundant updates if already revealed
          if (wordState.isRevealed) {
            // Still update attempts if provided and different
            if (attempts !== undefined && wordState.attempts !== attempts) {
               console.log(`[wordCardStore.markWordRevealed] Word ${wordId} already revealed, updating attempts to ${attempts}`);
               wordState.attempts = attempts;
            }
            return; // Exit early if already revealed (unless only attempts changed)
          }

          // Mark as revealed and update attempts/face
          wordState.isRevealed = true;
          if (attempts !== undefined) {
            wordState.attempts = attempts;
          }
          // Set card face to answer, unless it's already reflection
          if (wordState.face !== 'reflection') {
            wordState.face = 'answer';
          }
        }),

        resetCardState: (wordId) => set((state) => {
          console.log(`[wordCardStore.resetCardState] Resetting state for word: ${wordId}`);
          // Check if word exists before deleting
          if (state.words[wordId]) {
             // Use delete on the draft state property
             delete state.words[wordId];
          } else {
            console.warn(`[wordCardStore.resetCardState] Word ${wordId} not found. No changes needed.`);
          }
        }),

        _dangerouslyResetAllState: () => set((state) => {
          console.warn('[wordCardStore._dangerouslyResetAllState] Resetting all card state');
          // Replace state object keys - Immer handles the new object
          state.words = initialState.words;
          state.speakingWordIds = initialState.speakingWordIds;
        }),

        // --- SELECTORS (Unchanged by Immer/Refactor) ---
        getCardFace: (wordId) => get().words[wordId]?.face || 'question',
        getSelectedOption: (wordId) => get().words[wordId]?.selectedOption,
        getOptionState: (wordId, option) => get().words[wordId]?.optionStates[option] || 'default',
        isWordSpeaking: (wordId) => get().speakingWordIds.includes(wordId),
        isWordRevealed: (wordId) => get().words[wordId]?.isRevealed || false,
        getRevealedWords: () => Object.entries(get().words)
                                  .filter(([, wordState]) => wordState.isRevealed)
                                  .map(([wordId]) => wordId),
        getAttempts: (wordId) => get().words[wordId]?.attempts || 0,

        // --- ASYNC ACTION (speakWord - unchanged structure, still needs robust error handling/cancellation later) ---
        speakWord: async (wordId, word) => {
          // Add to speaking list immediately (sync state update)
          set((state) => {
            // Avoid duplicates if called rapidly
            if (!state.speakingWordIds.includes(wordId)) {
                state.speakingWordIds.push(wordId);
            }
          });
          
          try {
            await speak(word);
            console.log(`[wordCardStore.speakWord] Finished speaking wordId: ${wordId}`);
            // TODO: Consider adding state update for successful completion if needed by UI
          } catch (error) {
            console.error(`[wordCardStore.speakWord] Error speaking wordId ${wordId}:`, error);
            // TODO: Update state to reflect error, maybe clear speakingWordId here or keep it until user interaction?
          } finally {
            // Always remove from speaking list when done/failed (sync state update)
            set((state) => {
              state.speakingWordIds = state.speakingWordIds.filter((id: string) => id !== wordId);
            });
          }
        },

      }),
      {
        name: 'word-card-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          words: state.words,
        }),
        onRehydrateStorage: () => (state) => {
           if (state) {
             const wordCount = Object.keys(state.words || {}).length;
             console.log(`[wordCardStore] Successfully rehydrated state: ${wordCount} words found.`);
             // Ensure transient state (speakingWordIds) is initialized on rehydrate
             state.speakingWordIds = []; 
           } else {
             console.warn('[wordCardStore] Failed to rehydrate state or storage is empty');
           }
        },
      }
    )
  )
); // End Immer middleware wrapper 