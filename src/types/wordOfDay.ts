/**
 * Word of Day type definitions
 */

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