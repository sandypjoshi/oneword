import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

// Configure dotenv
dotenv.config();

// Types
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface DifficultyScore {
  score: number;
  level: DifficultyLevel;
  confidence: number;
  metrics: {
    frequency: number;
    semantic: number;
    structural: number;
  };
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Simple rate limiter for API calls
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

async function rateLimitedFetch(url: string) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  const response = await fetch(url);
  return response.json();
}

/**
 * Main function to calculate word difficulty
 * Returns a comprehensive difficulty assessment
 */
export async function calculateWordDifficulty(word: string): Promise<DifficultyScore> {
  try {
    // Fetch data from WordNet and Datamuse
    const wordnetData = await fetchWordNetData(word);
    const datamuseData = await fetchDatamuseData(word);
    
    // Calculate individual scores
    const frequencyScore = calculateFrequencyScore(wordnetData, datamuseData);
    const semanticScore = calculateSemanticScore(wordnetData);
    const structuralScore = calculateStructuralScore(word, datamuseData);
    
    // Calculate confidence in the results
    const confidence = calculateConfidence(wordnetData, datamuseData);
    
    // Calculate weighted final score - UPDATED WEIGHTS FOR BETTER BALANCE
    // Reduced frequency weight from 50% to 40%
    // Increased semantic weight from 20% to 30%
    // Kept structural weight at 30%
    const finalScore = (
      frequencyScore * 0.4 +  // Frequency (now 40%)
      semanticScore * 0.3 +   // Semantic complexity (now 30%)
      structuralScore * 0.3   // Structural complexity (30%)
    );
    
    // Determine difficulty level
    const level = getDifficultyLevel(finalScore);
    
    // Return comprehensive score
    return {
      score: finalScore,
      level,
      confidence,
      metrics: {
        frequency: frequencyScore,
        semantic: semanticScore,
        structural: structuralScore
      }
    };
  } catch (error) {
    console.error(`Error calculating difficulty for "${word}":`, error);
    
    // Provide a basic difficulty assessment as fallback
    return calculateBasicDifficulty(word);
  }
}

/**
 * Fetches word data from our database
 */
async function fetchWordNetData(word: string) {
  try {
    const { data, error } = await supabase
      .from('words')
      .select(`
        *,
        word_synsets (
          synset_id,
          sense_number,
          tag_count,
          synsets (
            pos,
            definition,
            domain
          )
        )
      `)
      .eq('word', word.toLowerCase());

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error(`Error fetching WordNet data for ${word}:`, error);
    return null;
  }
}

/**
 * Fetches word data from Datamuse API
 */
async function fetchDatamuseData(word: string) {
  try {
    return await rateLimitedFetch(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=fps`
    );
  } catch (error) {
    console.error(`Error fetching Datamuse data for ${word}:`, error);
    return null;
  }
}

/**
 * Calculate frequency score based on word rarity
 * Higher score = rarer word = more difficult
 */
function calculateFrequencyScore(wordnetData: any, datamuseData: any): number {
  // Default to medium frequency if no data
  let score = 0.5;
  
  try {
    // Datamuse frequency (preferred source for frequency)
    if (datamuseData && datamuseData.length > 0) {
      const frequencyTag = datamuseData[0].tags?.find((tag: string) => tag.startsWith('f:'));
      
      if (frequencyTag) {
        // Extract frequency value (higher = more common)
        const freq = parseFloat(frequencyTag.split(':')[1]);
        
        // Datamuse frequency values observed to range from ~0.01 (rare) to 70+ (very common)
        if (!isNaN(freq)) {
          // Use logarithmic scaling for better distribution of frequency scores
          // We want rare words (low f: values) to score high, common words to score low
          
          // First normalize based on observed max frequency
          const MAX_EXPECTED_FREQ = 75;
          // Apply a safe normalization with a cap at 1.0
          const normalizedFreq = Math.min(freq / MAX_EXPECTED_FREQ, 1.0);
          
          // Invert so higher score = more difficult
          score = 1 - normalizedFreq;
          
          // Apply a moderate exponent to balance the distribution
          score = Math.pow(score, 0.85);
          
          // Ensure a minimum score to avoid heavy penalization
          score = Math.max(score, 0.1);
          
          return score;
        }
      }
    }
    
    // Fallback to WordNet frequency if available
    if (wordnetData?.frequency) {
      return wordnetData.frequency;
    }
  } catch (error) {
    console.error('Error calculating frequency score:', error);
  }
  
  return score;
}

/**
 * Calculates semantic complexity based on:
 * - Polysemy (number of meanings)
 * - Domain specificity
 * - Part of speech variety
 */
function calculateSemanticScore(wordnetData: any): number {
  if (!wordnetData) return 0.5; // Default to medium difficulty
  
  const scores: number[] = [];
  
  // Polysemy score (fewer meanings = more complex)
  if (wordnetData.word_synsets) {
    const synsetCount = wordnetData.word_synsets.length;
    scores.push(1 - calculatePolysemyScore(synsetCount));
    
    // Domain specificity (technical domains = more complex)
    const domains = new Set<string>();
    
    // Extract domains from definitions
    if (wordnetData?.word_synsets) {
      wordnetData.word_synsets.forEach((ws: any) => {
        const def = ws.synset?.definition;
        if (def) {
          const domainMatch = def.match(/\((.*?)\)/);
          if (domainMatch && domainMatch[1]) {
            domains.add(domainMatch[1]);
          }
        }
      });
    }
    
    const technicalDomains = [
      'medical', 'technical', 'scientific', 'academic', 'legal',
      'biology', 'chemistry', 'physics', 'mathematics',
      'finance', 'economics', 'technology', 'engineering'
    ];
    
    let technicalCount = 0;
    Array.from(domains).forEach((domain: string) => {
      if (technicalDomains.some(td => domain.toLowerCase().includes(td))) {
        technicalCount++;
      }
    });
    
    const domainScore = domains.size > 0 ? 
      Math.min(0.3 + (technicalCount / domains.size) * 0.7, 1.0) : 
      0.5;
    
    scores.push(domainScore);
    
    // Part of speech variety (more variety = more complex)
    const posTypes = new Set(
      wordnetData.word_synsets
        .map((ws: any) => ws.synsets?.pos)
        .filter(Boolean)
    );
    
    scores.push(Math.min(posTypes.size / 4, 1)); // Max 4 POS types
  }
  
  // Return average of scores or default
  return scores.length > 0 ? 
    scores.reduce((a, b) => a + b, 0) / scores.length : 
    0.5;
}

/**
 * Calculates structural complexity based on:
 * - Word length
 * - Syllable count
 * - Morphological complexity
 */
function calculateStructuralScore(word: string, datamuseData: any): number {
  const scores: number[] = [];
  
  // Word length score (normalized to 0-1 for lengths 1-15)
  const lengthScore = calculateLengthScore(word);
  scores.push(lengthScore);
  
  // Syllable count score
  let syllableCount = datamuseData?.[0]?.numSyllables;
  if (syllableCount === undefined) {
    syllableCount = estimateSyllables(word);
  }
  
  const syllableScore = calculateSyllableScore(syllableCount);
  scores.push(syllableScore);
  
  // Morphological complexity
  const morphScore = calculateMorphologicalScore(word);
  scores.push(morphScore);
  
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Calculates word length score (0-1)
 * Longer words tend to be more difficult
 */
function calculateLengthScore(word: string): number {
  const length = word.length;
  
  // Very short words (1-3 chars) get lowest score
  if (length <= 3) return 0.0;
  
  // Most words are between 4-10 chars
  if (length <= 5) return 0.2;
  if (length <= 7) return 0.4;
  if (length <= 9) return 0.6;
  if (length <= 12) return 0.8;
  
  // Very long words (13+ chars) get highest score
  return 1.0;
}

/**
 * Calculates syllable-based difficulty score
 */
function calculateSyllableScore(syllableCount: number): number {
  // Map syllable count to difficulty score
  if (syllableCount === 1) return 0.0;
  if (syllableCount === 2) return 0.3;
  if (syllableCount === 3) return 0.6;
  return Math.min(0.9, 0.6 + (syllableCount - 3) * 0.1); // Max out at 0.9
}

/**
 * Calculates polysemy score based on number of meanings
 * Higher values indicate more common/basic words
 */
function calculatePolysemyScore(synsetsCount: number): number {
  // Words with more meanings tend to be more common/basic
  if (synsetsCount >= 8) return 1.0; // Very polysemous words
  if (synsetsCount >= 5) return 0.8;
  if (synsetsCount >= 3) return 0.6;
  if (synsetsCount === 2) return 0.4;
  return 0.2; // Words with only one meaning are often more specialized
}

/**
 * Calculates morphological complexity score
 * Considers prefixes, suffixes, and compound structure
 */
function calculateMorphologicalScore(word: string): number {
  const commonPrefixes = ['un', 're', 'in', 'dis', 'en', 'non', 'pre', 'anti'];
  const commonSuffixes = ['ing', 'ed', 'tion', 'able', 'ible', 'ful', 'ness', 'less'];
  
  let score = 0;
  
  // Check for prefixes
  if (commonPrefixes.some(prefix => word.startsWith(prefix))) {
    score += 0.3;
  }
  
  // Check for suffixes
  if (commonSuffixes.some(suffix => word.endsWith(suffix))) {
    score += 0.3;
  }
  
  // Check for compound words
  if (word.includes('-') || /[A-Z]/.test(word.slice(1))) {
    score += 0.4;
  }
  
  return Math.min(score, 1);
}

/**
 * Calculates confidence score based on available data sources
 */
function calculateConfidence(wordnetData: any, datamuseData: any): number {
  let confidence = 0;
  let sources = 0;

  if (wordnetData) {
    confidence += 0.6; // Higher weight for WordNet
    sources++;
  }
  
  if (datamuseData?.[0]) {
    confidence += 0.4; // Lower weight for Datamuse
    sources++;
  }

  return sources > 0 ? confidence / sources : 0.3;
}

/**
 * Determine difficulty level from score
 */
function getDifficultyLevel(score: number): DifficultyLevel {
  // Adjusted thresholds to improve classification accuracy
  // Based on our testing, we need more words in intermediate category
  if (score < 0.3) {
    return 'beginner';
  } else if (score < 0.65) {
    return 'intermediate';
  } else {
    return 'advanced';
  }
}

/**
 * Basic difficulty estimation when no data is available
 * Uses word length and estimated syllables
 */
function calculateBasicDifficulty(word: string): DifficultyScore {
  const lengthScore = calculateLengthScore(word);
  const syllableCount = estimateSyllables(word);
  const syllableScore = calculateSyllableScore(syllableCount);
  
  const score = (lengthScore + syllableScore) / 2;

  return {
    score,
    level: getDifficultyLevel(score),
    confidence: 0.3, // Low confidence
    metrics: {
      frequency: 0.5, // Default middle values
      semantic: 0.5,
      structural: score
    }
  };
}

/**
 * Estimates syllable count for English words
 */
function estimateSyllables(word: string): number {
  word = word.toLowerCase();
  if (!word) return 0;
  
  // Remove non-alphanumeric characters
  word = word.replace(/[^a-z]/g, '');
  
  // Special cases
  if (word.length <= 3) return 1;
  
  // Count vowel groups as syllables
  const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
  let count = 0;
  let prevIsVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !prevIsVowel) {
      count++;
    }
    prevIsVowel = isVowel;
  }
  
  // Handle silent e
  if (word.length > 2 && word.endsWith('e') && !vowels.includes(word[word.length - 2])) {
    count--;
  }
  
  // Minimum 1 syllable
  return Math.max(count, 1);
} 