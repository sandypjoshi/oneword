/**
 * Simple Word Difficulty Calculator
 * 
 * Calculates word difficulty using:
 * 1. Word frequency (most important)
 * 2. Word length and syllables (moderate importance)
 * 3. Part of speech (minor factor)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Simple difficulty calculation with basic metrics
 */
async function calculateWordDifficulty(word: string): Promise<{
  score: number;
  level: string;
}> {
  // Get word data from database
  const { data, error } = await supabase
    .from('words')
    .select(`
      id, 
      word,
      frequency,
      pos,
      word_synsets(id)
    `)
    .eq('word', word.toLowerCase())
    .eq('enrichment_eligible', 'eligible-word')
    .not('frequency', 'is', null)
    .single();
  
  if (error) {
    console.error(`Word "${word}" not found or not eligible:`, error);
    return {
      score: 0.5,
      level: 'intermediate'
    };
  }

  // Weightings for different factors - adjusted to reduce overall difficulty
  const weights = {
    frequency: 0.65,   // Further increased weight for frequency
    syllables: 0.20,   // Further reduced weight for syllables
    pos: 0.15         // Same weight for POS
  };
  
  // Calculate frequency score using logarithmic scale based on eligible word frequencies
  const LOG_FREQ_THRESHOLDS = {
    VERY_COMMON: Math.log(5000),   // Very common words
    COMMON: Math.log(1000),        // Common words
    MODERATE: Math.log(200),       // Moderate frequency
    LESS_COMMON: Math.log(50),     // Less common
    RARE: Math.log(10)            // Rare words
  };

  const calculateFrequencyScore = (frequency: number | null): number => {
    if (frequency === null) {
      return 0.5;
    }

    const logFreq = Math.log(Math.max(frequency, 1));
    
    // Further reduced scores
    if (logFreq >= LOG_FREQ_THRESHOLDS.VERY_COMMON) return 0.1;   // Very common
    if (logFreq >= LOG_FREQ_THRESHOLDS.COMMON) return 0.2;        // Common
    if (logFreq >= LOG_FREQ_THRESHOLDS.MODERATE) return 0.35;     // Moderate
    if (logFreq >= LOG_FREQ_THRESHOLDS.LESS_COMMON) return 0.45;  // Less common
    if (logFreq >= LOG_FREQ_THRESHOLDS.RARE) return 0.55;         // Rare
    return 0.65;                                                   // Very rare
  };
  
  const frequencyScore = calculateFrequencyScore(data.frequency);
  
  // Calculate syllable score - even more lenient
  const syllableCount = countSyllables(data.word);
  const syllableScore = Math.min((syllableCount - 1) / 6, 1); // 1 syllable = 0, 7+ syllables = 1
  
  // Calculate part of speech score - adjusted to be less strict
  const posScores: { [key: string]: number } = {
    'noun': 0.2,       // Nouns are usually easier
    'verb': 0.3,       // Verbs are slightly harder
    'adjective': 0.3,  // Adjectives are similar to verbs
    'adverb': 0.4,     // Adverbs can be more complex
    'pronoun': 0.2,    // Pronouns are generally easy
    'preposition': 0.4, // Prepositions can be tricky
    'conjunction': 0.3, // Conjunctions are medium
    'interjection': 0.2, // Interjections are generally easy
    'determiner': 0.2,  // Determiners are generally easy
    'unknown': 0.3      // Default for unknown POS
  };

  const posScore = posScores[data.pos.toLowerCase()] || 0.5;
  
  // Calculate final weighted score
  const finalScore = (
    weights.frequency * frequencyScore +
    weights.syllables * syllableScore +
    weights.pos * posScore
  );
  
  // Ensure score is within 0-1 range
  const normalizedScore = Math.min(Math.max(finalScore, 0), 1);
  
  // Round to 2 decimal places
  const roundedScore = Math.round(normalizedScore * 100) / 100;
  
  // Determine difficulty level - even more lenient thresholds
  let level: string;
  if (roundedScore < 0.3) level = 'beginner';
  else if (roundedScore > 0.6) level = 'advanced';
  else level = 'intermediate';
  
  return {
    score: roundedScore,
    level
  };
}

/**
 * Calculate part of speech score
 */
function calculatePosScore(pos: string): number {
  const posScores: { [key: string]: number } = {
    'noun': 0.3,       // Nouns are usually easier
    'verb': 0.5,       // Verbs are medium difficulty
    'adjective': 0.5,  // Adjectives are medium difficulty
    'adverb': 0.6,     // Adverbs can be more complex
    'pronoun': 0.3,    // Pronouns are generally easy
    'preposition': 0.7, // Prepositions can be tricky
    'conjunction': 0.5, // Conjunctions are medium
    'interjection': 0.4, // Interjections are generally easy
    'determiner': 0.4,  // Determiners are generally easy
    'unknown': 0.5      // Default for unknown POS
  };
  
  return posScores[pos.toLowerCase()] || 0.5;
}

/**
 * Simple syllable counter
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;
  
  // Remove final silent e
  word = word.replace(/e$/i, '');
  
  // Count vowel groups
  const matches = word.match(/[aeiouy]+/gi);
  return matches ? matches.length : 1;
}

/**
 * Process a batch of words
 */
async function processBatch(startId: number, endId: number, batchSize = 100): Promise<void> {
  console.log(`Processing words from ID ${startId} to ${endId}`);
  
  let currentId = startId;
  let updateCount = 0;
  
  try {
    while (currentId <= endId) {
      // Get batch of words
      const { data: words, error } = await supabase
        .from('words')
        .select('id, word')
        .gte('id', currentId)
        .lt('id', currentId + batchSize)
        .order('id');
      
      if (error) {
        console.error('Error fetching words:', error);
        break;
      }
      
      if (!words || words.length === 0) {
        console.log('No more words to process');
        break;
      }
      
      console.log(`Processing batch of ${words.length} words...`);
      
      // Process each word
      for (const { id, word } of words) {
        try {
          const { score, level } = await calculateWordDifficulty(word);
          
          // Update database
          const { error: updateError } = await supabase
            .from('words')
            .update({
              difficulty_score: score,
              difficulty_level: level,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
          
          if (updateError) {
            console.error(`Error updating word ${id}:`, updateError);
          } else {
            updateCount++;
            if (updateCount % 10 === 0) {
              console.log(`Updated ${updateCount} words so far...`);
            }
          }
        } catch (err) {
          console.error(`Error processing word ${word}:`, err);
        }
      }
      
      // Move to next batch
      currentId += batchSize;
      
      // Small delay to prevent overloading the database
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`Batch processing complete. Updated ${updateCount} words.`);
  } catch (error) {
    console.error('Error in batch processing:', error);
  }
}

// Command-line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'calculate') {
    const word = args[1];
    if (!word) {
      console.error('Please provide a word to calculate difficulty for');
      process.exit(1);
    }
    calculateWordDifficulty(word).then(result => {
      console.log(`Word: ${word}`);
      console.log(`Difficulty score: ${result.score}`);
      console.log(`Level: ${result.level}`);
    });
  } else if (command === 'batch') {
    const startId = parseInt(args[1]) || 1;
    const endId = parseInt(args[2]) || 1000;
    const batchSize = parseInt(args[3]) || 100;
    processBatch(startId, endId, batchSize);
  } else {
    console.log(`
Usage:
  Calculate a word: ts-node word-difficulty.ts calculate <word>
  Process batch: ts-node word-difficulty.ts batch <startId> <endId> [batchSize]
    `);
  }
} 