/**
 * Supabase Edge Function: updateExistingWordsDifficulty
 * 
 * This edge function is a one-time operation to update existing words in the database
 * with our improved difficulty classification algorithm.
 * 
 * It:
 * 1. Retrieves words that need difficulty classification updated
 * 2. Fetches detailed word information from WordsAPI if needed
 * 3. Calculates new difficulty scores using the enhanced algorithm
 * 4. Updates words in the database with new difficulty metrics
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// WordsAPI configuration
const WORDSAPI_KEY = '8cc3ff3281msh7ea7e190a1f4805p13cbdejsnb32d65962e66';
const WORDSAPI_HOST = 'wordsapiv1.p.rapidapi.com';
const WORDSAPI_BASE_URL = 'https://wordsapiv1.p.rapidapi.com/words';

// Difficulty levels
enum WordDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

// Word data structure
interface WordDetails {
  word: string;
  pronunciation?: string;
  partOfSpeech?: string;
  definitions: string[];
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
  metadata?: any;
  difficultyScore?: number;
}

/**
 * Main handler for the Edge Function
 */
const updateExistingWordsDifficulty = async (batchSize: number = 50, startId: number = 0) => {
  console.log(`Updating existing words difficulty classifications (batch size: ${batchSize}, starting from ID: ${startId})...`);
  
  try {
    const supabase = createSupabaseClient();
    
    // Get words that need updating
    const { data: words, error: wordsError } = await supabase
      .from('words')
      .select('id, word, metadata')
      .gt('id', startId)
      .order('id')
      .limit(batchSize);
    
    if (wordsError) {
      throw new Error(`Error fetching words: ${wordsError.message}`);
    }
    
    if (!words || words.length === 0) {
      return {
        success: true,
        message: `No more words to update starting from ID ${startId}.`,
        updated: 0,
        lastId: startId
      };
    }
    
    console.log(`Processing ${words.length} words...`);
    
    let updatedCount = 0;
    let lastProcessedId = startId;
    
    // Process each word
    for (const wordRecord of words) {
      try {
        lastProcessedId = wordRecord.id;
        
        // Skip words that already have proper difficulty metrics
        if (wordRecord.metadata?.difficulty_metrics?.calculated_score) {
          console.log(`Word ${wordRecord.word} (ID: ${wordRecord.id}) already has difficulty metrics. Skipping.`);
          continue;
        }
        
        console.log(`Processing word: ${wordRecord.word} (ID: ${wordRecord.id})`);
        
        // Fetch detailed word data from WordsAPI
        let wordData;
        try {
          const response = await fetch(`${WORDSAPI_BASE_URL}/${encodeURIComponent(wordRecord.word)}`, {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': WORDSAPI_KEY,
              'X-RapidAPI-Host': WORDSAPI_HOST,
            },
          });
          
          if (!response.ok) {
            console.error(`API request failed for word ${wordRecord.word} with status: ${response.status}`);
            continue;
          }
          
          wordData = await response.json();
        } catch (error) {
          console.error(`Error fetching word data for ${wordRecord.word}:`, error);
          continue;
        }
        
        // Calculate new difficulty using enhanced algorithm
        const { difficulty, score } = calculateWordDifficulty(wordData);
        
        // Prepare updated metadata
        const updatedMetadata = {
          ...wordRecord.metadata,
          syllables: wordData.syllables || wordRecord.metadata?.syllables,
          frequency: wordData.frequency || wordRecord.metadata?.frequency,
          difficulty_metrics: {
            length: wordData.word.length,
            syllables: wordData.syllables?.count || estimateSyllables(wordData.word),
            frequency: wordData.frequency?.zipf || null,
            calculated_score: score,
            difficulty_level: difficulty
          }
        };
        
        // Update the word record in the database
        const { error: updateError } = await supabase
          .from('words')
          .update({
            metadata: updatedMetadata,
            difficultyScore: score
          })
          .eq('id', wordRecord.id);
        
        if (updateError) {
          console.error(`Error updating word ${wordRecord.word}:`, updateError);
          continue;
        }
        
        console.log(`Successfully updated word ${wordRecord.word} to difficulty: ${difficulty} (score: ${score})`);
        updatedCount++;
        
      } catch (error) {
        console.error(`Error processing word (ID: ${wordRecord.id}):`, error);
      }
    }
    
    return {
      success: true,
      message: `Successfully updated ${updatedCount} out of ${words.length} words.`,
      updated: updatedCount,
      lastId: lastProcessedId,
      hasMore: words.length === batchSize
    };
  } catch (error) {
    console.error('Error updating word difficulties:', error);
    return {
      success: false,
      message: `Error updating word difficulties: ${error.message}`
    };
  }
};

/**
 * Calculate word difficulty using the enhanced algorithm
 */
const calculateWordDifficulty = (wordData: any): { difficulty: WordDifficulty; score: number } => {
  const word = wordData.word.toLowerCase();
  let score = 0;
  
  // 1. Word length (0-3 points) - adjusted thresholds
  const length = word.length;
  if (length <= 5) score += 0;         // Easy: up to 5 letters
  else if (length <= 8) score += 1;    // Medium: 6-8 letters
  else if (length <= 11) score += 2;   // Hard: 9-11 letters
  else score += 3;                     // Very hard: 12+ letters
  
  // 2. Syllable count (0-3 points) - adjusted thresholds
  const syllableCount = wordData.syllables?.count || estimateSyllables(word);
  if (syllableCount <= 1) score += 0;
  else if (syllableCount <= 2) score += 1;
  else if (syllableCount <= 3) score += 2;
  else score += 3;
  
  // 3. Frequency (0-4 points) - more weight and adjusted thresholds
  const frequency = wordData.frequency?.zipf || null;
  if (frequency !== null) {
    if (frequency >= 5.5) score += 0;      // Very common words (top 1000)
    else if (frequency >= 4.5) score += 1; // Common words (top 10,000)
    else if (frequency >= 3.5) score += 2; // Less common words (top 100,000)
    else if (frequency >= 2.5) score += 3; // Rare words (outside top 100,000)
    else score += 4;                      // Very rare words
  } else {
    // If frequency is not available, estimate from definitions and part of speech
    const partOfSpeech = wordData.results?.[0]?.partOfSpeech || "";
    if (["preposition", "article", "conjunction"].includes(partOfSpeech)) {
      score += 0;
    } else if (["noun", "verb"].includes(partOfSpeech)) {
      score += 1;
    } else if (["adjective", "adverb"].includes(partOfSpeech)) {
      score += 2;
    } else {
      score += 1; // Default for unknown parts of speech
    }
  }
  
  // 4. Etymology bonus (0-2 points)
  const etymology = wordData.results?.[0]?.derivation?.[0] || "";
  if (etymology.includes("Latin") || etymology.includes("Greek")) {
    score += 2;
  }
  
  // 5. Multiple meanings bonus (0-2 points)
  const definitionCount = wordData.results?.length || 0;
  if (definitionCount >= 4) score += 2;
  else if (definitionCount >= 2) score += 1;
  
  // 6. Common word check (penalty)
  const commonWords = [
    "international", "traditional", "understanding", "significance", 
    "independent", "development", "extraordinary", "relationship",
    "communication", "opportunity", "organization", "performance",
    "descriptive", "unpatriotic", "responsibility", "complicated"
  ];
  
  if (commonWords.includes(word)) {
    score = Math.max(0, score - 3); // Apply penalty
  }
  
  // 7. Check against educational wordlists (bonus)
  const advancedTestWords = [
    "abstruse", "acerbic", "acumen", "adumbrate", "alacrity", "amalgamate", 
    "ambivalent", "ameliorate", "anachronistic", "anathema", "anodyne", 
    "antipathy", "apathy", "apocryphal", "approbation", "arbitrary", 
    "arcane", "arduous", "ascetic", "assuage", "attenuate", "audacious"
    // Shortened for readability - add more words as needed
  ];
  
  const intermediateTestWords = [
    "abase", "abate", "abeyance", "abjure", "abnegation", "abrogate",
    "abstemious", "abysmal", "accolade", "accretion", "acquiesce", 
    "acrimonious", "adamant", "admonish", "adulation", "adversity"
    // Shortened for readability - add more words as needed
  ];
  
  if (advancedTestWords.includes(word)) {
    score += 4; // Strong bonus for known advanced test words
  } else if (intermediateTestWords.includes(word)) {
    score += 2; // Moderate bonus for known intermediate test words
  }
  
  // Determine difficulty level based on total score (adjusted thresholds)
  let difficulty: WordDifficulty;
  if (score <= 3) difficulty = WordDifficulty.BEGINNER;
  else if (score <= 7) difficulty = WordDifficulty.INTERMEDIATE;
  else difficulty = WordDifficulty.ADVANCED;
  
  // Additional verification for questionable advanced words
  if (difficulty === WordDifficulty.ADVANCED) {
    const commonAdvancedWords = [
      "unpatriotic", "descriptive", "complicated", "international", 
      "significant", "traditional", "independent", "extraordinary"
      // Shortened for readability - add more words as needed
    ];
    
    if (commonAdvancedWords.includes(word)) {
      difficulty = WordDifficulty.INTERMEDIATE;
      score = 7; // Cap the score
    }
  }
  
  return { difficulty, score };
};

/**
 * Estimate syllable count for a word if not provided by the API
 */
const estimateSyllables = (word: string): number => {
  word = word.toLowerCase();
  
  // Count vowel groups as syllables
  const vowels = "aeiouy";
  let count = 0;
  let prevIsVowel = false;
  
  // Count vowel groups
  for (let i = 0; i < word.length; i++) {
    const isCurrentVowel = vowels.includes(word[i]);
    if (isCurrentVowel && !prevIsVowel) {
      count++;
    }
    prevIsVowel = isCurrentVowel;
  }
  
  // Adjust for common patterns
  if (word.endsWith("e") && !word.endsWith("le")) {
    count--;
  }
  
  // Every word has at least one syllable
  return Math.max(1, count);
};

// Create a Supabase client
const createSupabaseClient = () => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://ipljgsggnbdwaomjfuok.supabase.co';
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbGpnc2dnbmJkd2FvbWpmdW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwODAxMDYsImV4cCI6MjA1NjY1NjEwNn0.Tpqr0Btu0AolHltIv2qa4dLNxd7_wr3eC8NF2oLbGRI';
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  return createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
  );
};

// HTTP handler for the Edge Function
serve(async (req) => {
  try {
    const url = new URL(req.url);
    const batchSize = parseInt(url.searchParams.get('batchSize') || '50', 10);
    const startId = parseInt(url.searchParams.get('startId') || '0', 10);
    
    const result = await updateExistingWordsDifficulty(batchSize, startId);
    
    return new Response(
      JSON.stringify(result),
      { status: result.success ? 200 : 500, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in updateExistingWordsDifficulty handler:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error: ${error.message}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 