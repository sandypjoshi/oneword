/**
 * Distractor Utilities
 * 
 * This file provides utility functions for working with distractors,
 * including text similarity checks and Supabase operations.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { WordDifficulty, Tables } from '../supabase/schema';
import { WordDetails } from '../types/words';
import { shuffleArray } from './distractorTemplates';

/**
 * Check if two text strings are too similar to be used as distractors
 * @param text1 First text string
 * @param text2 Second text string
 * @returns True if the texts are too similar
 */
export function isTooSimilar(text1: string, text2: string): boolean {
  if (!text1 || !text2) return false;
  
  // Simple word overlap check
  const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  
  // Count common significant words
  const commonWords = words1.filter(word => words2.includes(word));
  
  // Too similar if more than 30% overlap for significant words
  const overlapPercentage = commonWords.length / Math.min(words1.length, words2.length);
  return overlapPercentage > 0.3;
}

/**
 * Save a quality distractor to the database for future use
 * @param supabase Supabase client
 * @param word The word the distractor is for
 * @param correctDefinition The correct definition
 * @param distractor The distractor (incorrect definition)
 * @param partOfSpeech Part of speech of the word
 * @param difficulty Difficulty level
 * @param source Where the distractor came from
 * @param qualityScore Quality score (0-1)
 */
export async function saveDistractorToDatabase(
  supabase: SupabaseClient,
  word: string,
  correctDefinition: string,
  distractor: string,
  partOfSpeech: string | null,
  difficulty: WordDifficulty,
  source: string,
  qualityScore: number = 0.8
): Promise<void> {
  try {
    // First, check if this distractor already exists for this word
    const { data: existingDistractor } = await supabase
      .from(Tables.WORD_DISTRACTORS)
      .select('id, usage_count, quality_score')
      .eq('word', word)
      .eq('distractor', distractor)
      .single();
    
    if (existingDistractor) {
      // Update the usage count and potentially the quality score
      await supabase
        .from(Tables.WORD_DISTRACTORS)
        .update({
          usage_count: existingDistractor.usage_count + 1,
          quality_score: Math.max(existingDistractor.quality_score, qualityScore)
        })
        .eq('id', existingDistractor.id);
    } else {
      // Insert a new distractor
      await supabase
        .from(Tables.WORD_DISTRACTORS)
        .insert({
          word,
          correct_definition: correctDefinition,
          distractor,
          part_of_speech: partOfSpeech,
          difficulty,
          source,
          quality_score: qualityScore,
          usage_count: 1
        });
    }
  } catch (error) {
    console.error('Error saving distractor to database:', error);
  }
}

/**
 * Get stored distractors for a word
 * @param supabase Supabase client
 * @param word The word to get distractors for
 * @param partOfSpeech Part of speech (optional)
 * @param difficulty Difficulty level
 * @param limit Maximum number of distractors to return
 * @returns Array of distractors
 */
export async function getStoredDistractors(
  supabase: SupabaseClient,
  word: string,
  partOfSpeech: string | null,
  difficulty: WordDifficulty,
  limit: number = 5
): Promise<string[]> {
  try {
    const query = supabase
      .from(Tables.WORD_DISTRACTORS)
      .select('distractor, quality_score')
      .eq('word', word)
      .eq('difficulty', difficulty)
      .order('quality_score', { ascending: false })
      .order('usage_count', { ascending: true })
      .limit(limit);
    
    // Add part of speech filter if provided
    if (partOfSpeech) {
      query.eq('part_of_speech', partOfSpeech);
    }
    
    const { data } = await query;
    
    if (data && data.length > 0) {
      return data.map(item => item.distractor);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting stored distractors:', error);
    return [];
  }
}

/**
 * Get general distractors by part of speech
 * @param supabase Supabase client
 * @param partOfSpeech Part of speech
 * @param difficulty Difficulty level
 * @param limit Maximum number of distractors to return
 * @returns Array of distractors
 */
export async function getGeneralDistractorsByPos(
  supabase: SupabaseClient,
  partOfSpeech: string,
  difficulty: WordDifficulty,
  limit: number = 5
): Promise<string[]> {
  try {
    const { data } = await supabase
      .from(Tables.WORD_DISTRACTORS)
      .select('distractor, quality_score')
      .eq('part_of_speech', partOfSpeech)
      .eq('difficulty', difficulty)
      .order('quality_score', { ascending: false })
      .limit(limit);
    
    if (data && data.length > 0) {
      return shuffleArray(data.map(item => item.distractor));
    }
    
    return [];
  } catch (error) {
    console.error('Error getting general distractors by part of speech:', error);
    return [];
  }
}

/**
 * Get distractors from alternative definitions of the same word
 * @param wordDetails Word details from WordsAPI
 * @param correctDefinition The correct definition to avoid
 * @param limit Maximum number of distractors to return
 * @returns Array of distractors
 */
export function getAlternativeDefinitionDistractors(
  wordDetails: WordDetails,
  correctDefinition: string,
  limit: number = 3
): string[] {
  if (!wordDetails.definitions || wordDetails.definitions.length <= 1) {
    return [];
  }
  
  // Filter out definitions that are too similar to the correct one
  const alternativeDefinitions = wordDetails.definitions
    .filter(def => def !== correctDefinition && !isTooSimilar(def, correctDefinition))
    .slice(0, limit);
  
  return alternativeDefinitions;
}

/**
 * Utility to ensure we have exactly the requested number of distractors
 * @param distractors Array of distractor strings
 * @param requiredCount Number of distractors required
 * @param backupDistractors Backup distractors to use if needed
 * @returns Array with exactly requiredCount distractors
 */
export function ensureExactDistractorCount(
  distractors: string[],
  requiredCount: number,
  backupDistractors: string[]
): string[] {
  // If we have exactly the right number, return as is
  if (distractors.length === requiredCount) {
    return distractors;
  }
  
  // If we have too many, slice to the required count
  if (distractors.length > requiredCount) {
    return distractors.slice(0, requiredCount);
  }
  
  // If we have too few, add from backup distractors
  const needed = requiredCount - distractors.length;
  const filteredBackups = backupDistractors
    .filter(bd => !distractors.includes(bd))
    .slice(0, needed);
  
  return [...distractors, ...filteredBackups];
}

export default {
  isTooSimilar,
  saveDistractorToDatabase,
  getStoredDistractors,
  getGeneralDistractorsByPos,
  getAlternativeDefinitionDistractors,
  ensureExactDistractorCount
}; 