/**
 * Word-related TypeScript interfaces
 * Defines types used for handling word data throughout the app
 */

import { WordDifficulty } from '../supabase/schema';

/**
 * Interface for word details from WordsAPI
 */
export interface WordDetails {
  word: string;
  pronunciation?: string | null;
  partOfSpeech?: string | null;
  definitions: string[];
  examples?: string[] | null;
  synonyms?: string[] | null;
  antonyms?: string[] | null;
  metadata?: {
    syllables?: {
      count?: number;
      list?: string[];
    };
    frequency?: number;
    etymology?: string;
  } | null;
}

/**
 * Interface for a daily word with its quiz options
 */
export interface DailyWordWithOptions {
  word: string;
  date: string;
  difficulty: WordDifficulty;
  options: string[];
  correctOptionIndex: number;
  wordDetails: WordDetails;
}

/**
 * Interface for a distractor source
 */
export enum DistractorSource {
  ALTERNATIVE_DEFINITION = 'alternative_definition',
  SYNONYM_DEFINITION = 'synonym_definition',
  ANTONYM_DEFINITION = 'antonym_definition',
  RELATED_WORD = 'related_word',
  TEMPLATE = 'template',
  STORED = 'stored'
}

/**
 * Interface for a distractor with metadata
 */
export interface Distractor {
  text: string;
  source: DistractorSource;
  qualityScore: number;
}

export default {
  DistractorSource
}; 