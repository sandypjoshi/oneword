/**
 * Supabase Edge Function: addWordForNextDay
 * 
 * This edge function is designed to run daily via a cron job to add new words
 * for the next day. It performs the following tasks:
 * 
 * 1. Find the latest date in the daily_words table
 * 2. Fetch random words for the next day (for each difficulty level)
 * 3. Get detailed word information from WordsAPI
 * 4. Generate wrong options for the quiz
 * 5. Insert the new words into the database
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Define enums first to avoid reference errors
enum WordDifficulty {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced"
}

// API Configuration
const WORDSAPI_KEY = Deno.env.get("WORDSAPI_KEY") || "";
const WORDSAPI_HOST = "wordsapiv1.p.rapidapi.com";
const WORDSAPI_BASE_URL = `https://${WORDSAPI_HOST}/words`;

// Twinword API Configuration
const TWINWORD_API_KEY = Deno.env.get("TWINWORD_API_KEY") || "";
const TWINWORD_HOST = "twinword-word-graph-dictionary.p.rapidapi.com";
const TWINWORD_BASE_URL = `https://${TWINWORD_HOST}/associate`;

// Difficulty mapping from numeric score to WordDifficulty enum
const DIFFICULTY_RANGES = {
  [WordDifficulty.BEGINNER]: { min: 1, max: 3.5 },
  [WordDifficulty.INTERMEDIATE]: { min: 3.5, max: 6 },
  [WordDifficulty.ADVANCED]: { min: 6, max: 10 }
};

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

/**
 * Main handler for the Edge Function
 */
// Serve function would be defined differently in the actual Edge Function environment
// export const serve = async (req) => {
const addWordForNextDay = async (targetDate?: string) => {
  console.log('Adding word for the next day...');
  
  try {
    // Determine the target date - either use provided date or calculate tomorrow
    let dateStr;
    if (targetDate) {
      // Validate the provided date
      if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        throw new Error('Invalid date format. Please use YYYY-MM-DD format.');
      }
      dateStr = targetDate;
      console.log(`Using provided target date: ${dateStr}`);
    } else {
    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
      dateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
      console.log(`Using tomorrow's date: ${dateStr}`);
    }
    
    // Check if words already exist for the target date
    const wordsExist = await checkIfWordsExistForDate(dateStr);
    
    if (wordsExist) {
      console.log(`Words already exist for ${dateStr}`);
      return {
        success: true,
        message: `Words already exist for ${dateStr}`,
        date: dateStr,
      };
    }
    
    // Get list of words already used
    const usedWords = await getUsedWords();
    console.log(`Found ${usedWords.length} words already used`);
    
    // Add a word for each difficulty level
    await assignWordToDate(dateStr, WordDifficulty.BEGINNER, usedWords);
    await assignWordToDate(dateStr, WordDifficulty.INTERMEDIATE, usedWords);
    await assignWordToDate(dateStr, WordDifficulty.ADVANCED, usedWords);
    
    return { 
      success: true, 
      message: `Successfully added words for ${dateStr}`,
      date: dateStr,
    };
  } catch (error) {
    console.error('Error adding word for the next day:', error);
    return {
      success: false,
      message: `Error adding word for the next day: ${error.message}`,
    };
  }
};

/**
 * Check if words already exist for a specific date
 */
const checkIfWordsExistForDate = async (date: string): Promise<boolean> => {
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase
    .from('daily_words')
    .select('id')
      .eq('date', date);
  
  if (error) {
    throw error;
  }
  
    return data && data.length > 0;
  } catch (error) {
    console.error(`Error checking if words exist for date ${date}:`, error);
    throw error;
  }
};

/**
 * Get words that have already been used
 */
const getUsedWords = async (): Promise<string[]> => {
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('daily_words')
      .select('words(word)');
  
  if (error) {
    throw error;
  }
  
    const usedWords = data
      .filter(entry => entry.words)
      .map(entry => entry.words.word);
    
    return usedWords;
  } catch (error) {
    console.error('Error fetching used words:', error);
    return [];
  }
};

/**
 * Calculates the difficulty level of a word based on multiple metrics
 * Returns both the difficulty level and a numeric score
 */
const calculateWordDifficulty = (wordData: any): { difficulty: WordDifficulty; score: number } => {
  const word = wordData.word.toLowerCase();
  let score = 0;
  
  // 1. Word length (0-3 points) - adjusted thresholds
  const length = word.length;
  if (length <= 5) score += 0;         // Easy: up to 5 letters (was 4)
  else if (length <= 8) score += 1;    // Medium: 6-8 letters (was 7)
  else if (length <= 11) score += 2;   // Hard: 9-11 letters (was 10)
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
  // Words with Latin/Greek roots often more challenging for standardized tests
  const etymology = wordData.results?.[0]?.derivation?.[0] || "";
  if (etymology.includes("Latin") || etymology.includes("Greek")) {
    score += 2;
  }
  
  // 5. Multiple meanings bonus (0-2 points)
  // Words with multiple distinct meanings are often more challenging
  const definitionCount = wordData.results?.length || 0;
  if (definitionCount >= 4) score += 2;
  else if (definitionCount >= 2) score += 1;
  
  // 6. Common word check (penalty)
  // These words might score high on other metrics but aren't truly advanced
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
    "arcane", "arduous", "ascetic", "assuage", "attenuate", "audacious",
    "austere", "avarice", "aver", "axiomatic", "bellicose", "bereft",
    "blandishment", "bombastic", "boorish", "burgeon", "cacophony", 
    "calumny", "capricious", "castigate", "caustic", "chicanery", 
    "coalesce", "coda", "cogent", "commensurate", "compendium", 
    "complacent", "complicit", "conciliatory", "condone", "conflagration",
    "connoisseur", "consternation", "contentious", "contrite", "convoluted",
    "corroborate", "credulity", "culpable", "cynical", "dearth", "decorum",
    "deference", "delineate", "demur", "denigrate", "deride", "desultory",
    "deterrent", "diatribe", "diffident", "dilatory", "disabuse", "discern",
    "discrepancy", "disinterested", "disparage", "disparate", "dissemble", 
    "disseminate", "dissonance", "divulge", "dogmatic", "ebullience",
    "eclectic", "effrontery", "elegy", "elicit", "elucidate", "emollient",
    "empathy", "empirical", "encomium", "endemic", "enervate", "engender",
    "enigmatic", "ennui", "ephemeral", "equanimity", "equivocal", "erudite",
    "esoteric", "eulogy", "euphemism", "exacerbate", "exculpate", "exigent",
    "erudite", "esoteric", "euphemism", "exacerbate", "exigent", "exonerate",
    "expiate", "expound", "extraneous", "facetious", "fallacious", "fastidious",
    "fatuous", "fawning", "fervent", "filibuster", "firebrand", "florid",
    "garrulous", "grandiloquent", "gratuitous", "gregarious", "hackneyed",
    "halcyon", "harangue", "hedonist", "hegemony", "heterodox", "histrionic",
    "husbandry", "hyperbole", "iconoclast", "idolatrous", "immutable", "impecunious",
    "imperturbable", "impetuous", "implacable", "importune", "impugn", "inchoate",
    "incontrovertible", "indifferent", "ineluctable", "inexorable", "ingenuous",
    "inimical", "insipid", "insouciant", "intransigent", "inundate", "inveterate"
  ];
  
  const intermediateTestWords = [
    "abase", "abate", "abeyance", "abjure", "abnegation", "abrogate",
    "abstemious", "abysmal", "accolade", "accretion", "acquiesce", 
    "acrimonious", "adamant", "admonish", "adulation", "adversity",
    "advocate", "aesthetic", "affable", "affluent", "aggrandize",
    "alleviate", "altruistic", "ambiguous", "amenable", "amiable",
    "amorphous", "anomaly", "anticipate", "antithesis", "apathetic",
    "appease", "apprehensive", "apprise", "ardent", "articulate",
    "artifice", "ascendancy", "aspersion", "assiduous", "asylum",
    "atrophy", "audacity", "augment", "auspicious", "autocratic",
    "autonomy", "avarice", "avid", "banal", "belie", "belligerent",
    "benevolent", "benign", "bias", "bolster", "braggart", "brazen",
    "brevity", "bridle", "bucolic", "bureaucracy", "burnish", "buttress",
    "cajole", "candor", "canonical", "caricature", "carping", "catalyst",
    "catholic", "causality", "censure", "chary", "chastise", "cherish",
    "chide", "churlish", "circumlocution", "circumscribe", "circumspect"
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
  // If a word is marked as advanced but doesn't feel difficult enough,
  // downgrade it to intermediate
  if (difficulty === WordDifficulty.ADVANCED) {
    const commonAdvancedWords = [
      "unpatriotic", "descriptive", "complicated", "international", 
      "significant", "traditional", "independent", "extraordinary",
      "relationship", "understanding", "consideration", "development",
      "appreciation", "conversation", "recommendation", "psychological"
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

/**
 * Get a random word from WordsAPI
 */
const getRandomWord = async (
  difficulty: WordDifficulty,
  usedWords: string[]
): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    try {
      attempts++;
      
      // 1. Get a random word from WordsAPI
      const randomLetterStart = String.fromCharCode(97 + Math.floor(Math.random() * 26));
      const url = `${WORDSAPI_BASE_URL}/?random=true&hasDetails=definitions&letterPattern=^${randomLetterStart}.*&frequencyMin=3`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': WORDSAPI_KEY,
          'x-rapidapi-host': WORDSAPI_HOST
        }
      });
      
      if (!response.ok) {
        throw new Error(`WordsAPI error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const word = data.word;
      
      // Skip words less than 3 characters or more than 10
      if (!word || word.length < 3 || word.length > 10 || word.includes(' ')) {
        console.log(`Skipping inappropriate word: ${word}`);
        continue;
      }
      
      // Skip words that have already been used
      if (usedWords.includes(word)) {
        console.log(`Word '${word}' has already been used, trying another...`);
        continue;
      }
      
      // 2. Verify word difficulty with Twinword API
      const twinwordData = await fetchFromTwinword(word);
      
      // Parse difficulty (default to 5 if not available)
      const difficultyScore = parseFloat(twinwordData.difficulty) || 5;
      
      // Check if the word matches our target difficulty
      if (!isCorrectDifficulty(difficultyScore, difficulty)) {
        console.log(`Word '${word}' has difficulty ${difficultyScore}, but we need ${difficulty}. Trying another...`);
        continue;
      }
      
      console.log(`Selected word '${word}' with difficulty score ${difficultyScore} for ${difficulty} level`);
      return word;
      
    } catch (error) {
      console.error(`Error in attempt ${attempts}/${maxAttempts} to get a random word:`, error);
      // Continue to the next attempt
    }
  }
  
  // Fallback words if all attempts fail, categorized by difficulty
  const fallbackWords = {
    [WordDifficulty.BEGINNER]: ['book', 'tree', 'fish', 'house', 'ball', 'car'],
    [WordDifficulty.INTERMEDIATE]: ['balance', 'feature', 'impact', 'journey', 'resource'],
    [WordDifficulty.ADVANCED]: ['ambiguous', 'consensus', 'infrastructure', 'phenomenon', 'theoretical']
  };
  
  // Pick a random fallback word that matches the difficulty
  // and hasn't been used before (if possible)
  const fallbackOptions = fallbackWords[difficulty].filter(word => !usedWords.includes(word));
  
  // If all fallbacks have been used, just pick any one
  const options = fallbackOptions.length > 0 ? fallbackOptions : fallbackWords[difficulty];
  const randomIndex = Math.floor(Math.random() * options.length);
  const fallbackWord = options[randomIndex];
  
  console.warn(`Failed to get a random word after ${maxAttempts} attempts. Using fallback word: ${fallbackWord}`);
  return fallbackWord;
};

/**
 * Get detailed information about a word
 */
const getWordDetails = async (word: string): Promise<WordDetails> => {
  // Create a base word details object with defaults
  const wordDetails: WordDetails = {
    word,
    definitions: [],
  };
  
  try {
    // 1. Fetch data from WordsAPI
    const wordsApiUrl = `${WORDSAPI_BASE_URL}/${encodeURIComponent(word)}`;
    const wordsApiResponse = await fetch(wordsApiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': WORDSAPI_KEY,
        'x-rapidapi-host': WORDSAPI_HOST
      }
    });
    
    if (!wordsApiResponse.ok) {
      console.warn(`WordsAPI error for word "${word}": ${wordsApiResponse.status}`);
      // Continue to try Twinword as fallback
    } else {
      const wordsApiData = await wordsApiResponse.json();
      
      // Process WordsAPI data
      wordDetails.pronunciation = wordsApiData.pronunciation?.all || '';
      
      // Get primary part of speech
      const partOfSpeechCounts: Record<string, number> = {};
      (wordsApiData.results || []).forEach((result: any) => {
        const pos = result.partOfSpeech;
        if (pos) {
          partOfSpeechCounts[pos] = (partOfSpeechCounts[pos] || 0) + 1;
        }
      });
      
      // Find most common part of speech
      let maxCount = 0;
      for (const [pos, count] of Object.entries(partOfSpeechCounts)) {
        if (count > maxCount) {
          maxCount = count;
          wordDetails.partOfSpeech = pos;
        }
      }
      
      // Extract definitions
      if (wordsApiData.results) {
        wordDetails.definitions = wordsApiData.results.map((result: any) => ({
          definition: result.definition,
          partOfSpeech: result.partOfSpeech
        }));
      }
      
      // Extract examples
      if (wordsApiData.results) {
        wordDetails.examples = wordsApiData.results
          .filter((result: any) => result.examples && result.examples.length > 0)
          .flatMap((result: any) => result.examples)
          .slice(0, 3); // Take up to 3 examples
      }
      
      // Extract synonyms and antonyms
      wordDetails.synonyms = wordsApiData.results
        ?.flatMap((result: any) => result.synonyms || [])
        .filter((syn: string, i: number, arr: string[]) => arr.indexOf(syn) === i)
        .slice(0, 10);
      
      wordDetails.antonyms = wordsApiData.results
        ?.flatMap((result: any) => result.antonyms || [])
        .filter((ant: string, i: number, arr: string[]) => arr.indexOf(ant) === i)
        .slice(0, 5);
      
      // Store additional metadata
      wordDetails.metadata = {
        frequency: wordsApiData.frequency,
        syllables: wordsApiData.syllables,
      };
    }
    
    // 2. Enrich with Twinword API data
    try {
      const twinwordData = await fetchFromTwinword(word);
      
      if (twinwordData) {
        // Set difficulty score
        wordDetails.difficultyScore = parseFloat(twinwordData.difficulty) || 5;
        
        // Add Twinword associations to synonyms if available
        if (twinwordData.assoc_word) {
          const associations = sortByRelevance(twinwordData.assoc_word);
          
          // If we don't have synonyms from WordsAPI, use associations
          if (!wordDetails.synonyms || wordDetails.synonyms.length === 0) {
            wordDetails.synonyms = associations.slice(0, 10);
          } 
          // Otherwise, combine them without duplicates
          else {
            const existingSynonyms = new Set(wordDetails.synonyms);
            for (const assoc of associations) {
              if (!existingSynonyms.has(assoc)) {
                wordDetails.synonyms.push(assoc);
                existingSynonyms.add(assoc);
                // Limit to 15 total synonyms
                if (wordDetails.synonyms.length >= 15) break;
              }
            }
          }
        }
        
        // Add data to metadata
        wordDetails.metadata = {
          ...wordDetails.metadata,
          twinword: {
            difficulty: twinwordData.difficulty,
            associations: twinwordData.assoc_word,
          }
        };
      }
    } catch (twinwordError) {
      console.error(`Error enriching with Twinword data for "${word}":`, twinwordError);
      // Continue with whatever data we have from WordsAPI
    }

    return wordDetails;
  } catch (error) {
    console.error(`Error getting word details for "${word}":`, error);
    // Return basic structure with minimal data
    return {
      word,
      definitions: [`A ${wordDetails.partOfSpeech || 'word'} with no available definition`],
    };
  }
};

/**
 * Enhanced function to fetch and cache Twinword API associations
 */
const fetchFromTwinword = async (word: string, supabase: any): Promise<any> => {
  try {
    // First check if we have cached results
    const { data: cachedData, error: cacheError } = await supabase
      .from('twinword_associations')
      .select('associated_words')
      .eq('word', word)
      .maybeSingle();
    
    if (!cacheError && cachedData) {
      console.log(`Using cached Twinword data for "${word}"`);
      return cachedData.associated_words;
    }
    
    // No cached data found, make API call
    const url = `${TWINWORD_BASE_URL}?entry=${encodeURIComponent(word)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': TWINWORD_API_KEY,
        'X-RapidAPI-Host': TWINWORD_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`Twinword API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Cache the response for future use
    if (result && result.result_code === "200") {
      try {
        await supabase
          .from('twinword_associations')
          .upsert({
            word,
            associated_words: result
          }, { onConflict: 'word' });
        
        console.log(`Cached Twinword data for "${word}"`);
      } catch (cacheError) {
        console.error(`Error caching Twinword data: ${cacheError}`);
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error fetching from Twinword: ${error}`);
    return null;
  }
};

/**
 * Enhanced generateWrongOptions function to leverage Twinword API and word_distractors
 */
const generateWrongOptions = async (
  supabase: any,
  word: string,
  correctDefinition: string,
  partOfSpeech: string,
  difficulty: WordDifficulty
): Promise<string[]> => {
  const wrongOptions: string[] = [];
  const targetCount = 3; // We want 3 wrong options
  
  try {
    // Strategy 1: Use stored distractors from word_distractors table
    const { data: storedDistractors, error: distError } = await supabase
      .from('word_distractors')
      .select('distractor, quality_score, semantic_distance')
      .eq('word', word)
      .eq('part_of_speech', partOfSpeech)
      .eq('correct_definition', correctDefinition)
      .order('quality_score', { ascending: false })
      .limit(targetCount);
    
    if (!distError && storedDistractors && storedDistractors.length > 0) {
      // Use stored high-quality distractors
      for (const distractor of storedDistractors) {
        if (!wrongOptions.includes(distractor.distractor) && 
            !checkSimilarity(distractor.distractor, correctDefinition)) {
          wrongOptions.push(distractor.distractor);
          
          // Increment usage count
          try {
            await supabase.rpc('increment', { 
              table_name: 'word_distractors',
              column_name: 'usage_count',
              row_id: distractor.id
            });
          } catch (e) {
            console.warn('Failed to increment usage count:', e);
          }
        }
      }
      
      console.log(`Found ${wrongOptions.length} stored distractors for "${word}"`);
    }
    
    // If we don't have enough stored distractors, try alternative definitions
    if (wrongOptions.length < targetCount) {
      // Get word details to find alternative definitions
      const wordDetails = await getWordDetails(word);
      
      if (wordDetails.definitions.length > 1) {
        // Filter definitions for the correct part of speech
        const otherDefinitions = wordDetails.definitions
          .filter((def, index) => {
            // Assuming definitions array contains simple strings
            return def !== correctDefinition;
          });
        
        // Use other definitions as wrong options
        for (const def of otherDefinitions) {
          if (wrongOptions.length >= targetCount) break;
          
          // Ensure this distractor isn't too similar to correct definition
          if (!checkSimilarity(def, correctDefinition) && 
              !wrongOptions.includes(def)) {
            wrongOptions.push(def);
            
            // Store this distractor for future use
            try {
              await supabase
                .from('word_distractors')
                .insert({
                  word,
                  correct_definition: correctDefinition,
                  distractor: def,
                  part_of_speech: partOfSpeech,
                  difficulty,
                  source: 'alternative_definition',
                  quality_score: 0.8,
                  semantic_distance: 0.3 // Medium distance since it's the same word
                });
            } catch (e) {
              console.warn('Failed to store alternative definition distractor:', e);
            }
          }
        }
        
        console.log(`Added ${wrongOptions.length} alternative definition distractors`);
      }
    }
    
    // Strategy 3: Use Twinword API for semantic associations
    if (wrongOptions.length < targetCount) {
      const twinwordData = await fetchFromTwinword(word, supabase);
      
      if (twinwordData && twinwordData.result_code === "200" && twinwordData.associations) {
        const associations = sortByRelevance(twinwordData.associations);
        
        // Get definitions for associated words to use as distractors
        for (const assocWord of associations) {
          if (wrongOptions.length >= targetCount) break;
          
          try {
            const assocDetails = await getWordDetails(assocWord);
            
            if (assocDetails.definitions && assocDetails.definitions.length > 0) {
              // Get the most relevant definition
              let assocDefinition = assocDetails.definitions[0];
              
              if (!checkSimilarity(assocDefinition, correctDefinition) && 
                  !wrongOptions.includes(assocDefinition)) {
                wrongOptions.push(assocDefinition);
                
                // Store this distractor
                try {
                  await supabase
                    .from('word_distractors')
                    .insert({
                      word,
                      correct_definition: correctDefinition,
                      distractor: assocDefinition,
                      part_of_speech: partOfSpeech,
                      difficulty,
                      source: 'twinword_association',
                      quality_score: 0.9, // High quality as it's semantically related
                      semantic_distance: 0.5 // Moderate distance
                    });
                } catch (e) {
                  console.warn('Failed to store Twinword distractor:', e);
                }
              }
            }
          } catch (e) {
            console.warn(`Failed to get details for associated word "${assocWord}":`, e);
          }
        }
        
        console.log(`Added ${wrongOptions.length} Twinword association distractors`);
      }
    }
    
    // Strategy 4: Fallback to generic distractors if we still don't have enough
    if (wrongOptions.length < targetCount) {
      // Get some generic distractors for the given part of speech
      const genericDistractors = [
        `Not a definition of ${word}`,
        `The opposite meaning of ${word}`,
        `A common misunderstanding of ${word}`
      ];
      
      for (const distractor of genericDistractors) {
        if (wrongOptions.length >= targetCount) break;
        wrongOptions.push(distractor);
      }
      
      console.log(`Added generic fallback distractors to reach ${wrongOptions.length} total distractors`);
    }
    
    // Make sure we don't have more than the target count
    while (wrongOptions.length > targetCount) {
      wrongOptions.pop();
    }
    
    // If somehow we still don't have enough (unlikely), add placeholders
    while (wrongOptions.length < targetCount) {
      wrongOptions.push(`Option ${wrongOptions.length + 1}`);
    }
    
    return wrongOptions;
  } catch (error) {
    console.error(`Error generating wrong options: ${error}`);
    
    // Return fallback options in case of error
    return [
      `Not related to ${word}`,
      `Incorrect meaning of ${word}`,
      `Not a definition of ${word}`
    ];
  }
};

/**
 * Check if two text strings are too similar
 */
function checkSimilarity(text1: string, text2: string): boolean {
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
 * Utility function to shuffle an array
 */
function shuffleArray<T>(arr: T[]): T[] {
  const newArray = [...arr];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Updated assignWordToDate function to use updated schema
 */
const assignWordToDate = async (
  date: string,
  difficulty: WordDifficulty,
  usedWords: string[]
) => {
  try {
    // Get a random word for the specified difficulty
    const word = await getRandomWord(difficulty, usedWords);
    console.log(`Selected word: ${word}`);
    
    // Get details for the selected word
    const wordDetails = await getWordDetails(word);
    
    // Set the difficultyScore if we calculated it
    let difficultyScore = 0;
    if (wordDetails.metadata && wordDetails.metadata.frequency) {
      difficultyScore = wordDetails.metadata.frequency;
    }

    // Select a primary definition for the word
    const primaryDefinition = wordDetails.definitions[0];
    const partOfSpeech = wordDetails.partOfSpeech || 'noun';

    // Generate wrong options for quiz
    const supabase = createSupabaseClient();
    const wrongOptions = await generateWrongOptions(
      supabase,
      word,
      primaryDefinition,
      partOfSpeech,
      difficulty
    );

    // Format options array - first element is the correct answer
    const allOptions = [primaryDefinition, ...wrongOptions];
    
    // Shuffle options and keep track of where the correct answer is
    const shuffledOptions = shuffleArray([...allOptions]);
    const correctOptionIndex = shuffledOptions.indexOf(primaryDefinition);

    // Insert the word into the database if it doesn't exist
    const { data: existingWord, error: checkError } = await supabase
      .from('words')
      .select('id')
      .eq('word', word)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Error checking for existing word: ${checkError.message}`);
    }
    
    let wordId;
    
    if (!existingWord) {
      // Insert the new word
      const { data: insertedWord, error: insertError } = await supabase
        .from('words')
        .insert({
          word,
          pronunciation: wordDetails.pronunciation || null,
          part_of_speech: partOfSpeech,
          definitions: wordDetails.definitions,
          examples: wordDetails.examples || [],
          synonyms: wordDetails.synonyms || [],
          antonyms: wordDetails.antonyms || [],
          metadata: wordDetails.metadata || {},
          difficulty_score: difficultyScore,
          normalized_frequency: wordDetails.metadata?.frequency || 0
        })
        .select('id')
        .single();
      
      if (insertError) {
        throw new Error(`Error inserting new word: ${insertError.message}`);
      }

      wordId = insertedWord.id;
    } else {
      wordId = existingWord.id;
    }

    // Map the word to the specified date
    const { error: mapError } = await supabase
      .from('daily_words')
      .insert({
        date,
        word_id: wordId,
        difficulty,
        options: shuffledOptions,
        correct_option_index: correctOptionIndex
      });

    if (mapError) {
      throw new Error(`Error mapping word to date: ${mapError.message}`);
    }

    return {
      date,
      word,
      definition: primaryDefinition,
      difficulty,
      options: shuffledOptions,
      correctOptionIndex
    };
  } catch (error) {
    console.error(`Error assigning word to date: ${error}`);
    throw error;
  }
};

/**
 * Checks if a difficulty score is within the correct range for the specified difficulty level
 */
const isCorrectDifficulty = (score: number, targetDifficulty: WordDifficulty): boolean => {
  const range = DIFFICULTY_RANGES[targetDifficulty];
  return score >= range.min && score < range.max;
};

/**
 * Sort associations by relevance score in descending order
 */
const sortByRelevance = (associations: string): string[] => {
  if (!associations) return [];
  
  return associations
    .split(',')
    .filter(word => word.trim().length > 0)
    .sort((a, b) => {
      // Extract numeric prefix if available (relevance score)
      const scoreA = parseFloat(a.split(':')[1] || '0');
      const scoreB = parseFloat(b.split(':')[1] || '0');
      return scoreB - scoreA;
    })
    .map(item => item.split(':')[0].trim());
};

// HTTP request handler for the Edge Function
serve(async (req) => {
  try {
    // Parse request if needed
    let requestData = {};
    if (req.method === 'POST') {
      try {
        requestData = await req.json();
      } catch (error) {
        console.error("Failed to parse JSON request:", error);
        // Continue with empty request data
      }
    }
    
    const targetDate = requestData.targetDate || null;
    console.log(`Adding word for ${targetDate || 'next day'}`);
    
    // Execute main function with optional target date
    const result = await addWordForNextDay(targetDate);
    
    // Return result as JSON
    return new Response(JSON.stringify({
      status: result.success ? 'success' : 'error',
      message: result.message,
      data: result.success ? { date: result.date } : undefined,
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Return error as JSON
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message || 'An unexpected error occurred',
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 