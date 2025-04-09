/**
 * Word of Day type definitions
 */

/**
 * Distractor option with a value and whether it's correct
 */
export interface WordOption {
  value: string;
  isCorrect: boolean;
}

/**
 * Word of Day data model
 */
export interface WordOfDay {
  id: string;
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  definition: string;
  example?: string;
  date: string; // ISO format YYYY-MM-DD

  // New fields for quiz functionality
  options?: WordOption[];
  isRevealed?: boolean;
  userAttempts?: number;
  selectedOption?: string;
}

/**
 * Date selector item representation
 */
export interface DateItem {
  date: Date;
  formatted: {
    day: string;
    weekday: string;
  };
  isToday: boolean;
  isSelected: boolean;
}
