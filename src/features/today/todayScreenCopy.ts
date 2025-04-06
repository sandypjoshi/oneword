/**
 * Playful and engaging copy strings specific to the word guessing feedback 
 * on the Today screen's ReflectionCard.
 */

export const firstGuessMessages: ReadonlyArray<string> = [
  "Aha! Found it first time. 🎉",
  "Spot on! First guess. ✨",
  "Nice one! Got it right away. 😎",
] as const;

export const fewGuessesMessages: ReadonlyArray<string> = [
  "Nice detective work! Found in {attempts} guesses. 🕵️",
  "You zeroed in! Got it in {attempts}. 🔍",
  "Took {attempts} guesses, but you got there! 👍",
] as const;

export const manyGuessesMessages: ReadonlyArray<string> = [
  "Persistence unlocked it! Found in {attempts}. 🔓",
  "Puzzled it out in {attempts} guesses! 🤔💡",
  "That was a thinker! You found it in {attempts}. 🤓",
] as const; 