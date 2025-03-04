/**
 * Enhanced generateWrongOptions Implementation
 * 
 * This file implements the enhanced approach for generating wrong options (distractors)
 * for word quizzes, using WordsAPI data and Supabase for storage and retrieval.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { WordDetails } from '../types/words';
import { WordDifficulty } from '../supabase/schema';
import { DistractorSource } from '../types/words';
import { shuffleArray, getDifficultySpecificTemplates } from './distractorTemplates';
import { 
  isTooSimilar, 
  saveDistractorToDatabase, 
  getStoredDistractors,
  getGeneralDistractorsByPos,
  getAlternativeDefinitionDistractors,
  ensureExactDistractorCount
} from './distractorUtils';

/**
 * Enhanced generateWrongOptions function that uses multiple strategies to create
 * high-quality distractors for word quizzes
 * 
 * @param supabase Supabase client instance
 * @param word The word to generate distractors for
 * @param correctDefinition The correct definition to avoid duplicating
 * @param wordDetails Detailed information about the word from WordsAPI
 * @param difficulty The difficulty level of the word
 * @returns Promise with an array of 3 wrong options
 */
export async function generateWrongOptions(
  supabase: SupabaseClient,
  word: string,
  correctDefinition: string,
  wordDetails: WordDetails,
  difficulty: WordDifficulty
): Promise<string[]> {
  const wrongOptions: string[] = [];
  const usedApproaches: string[] = [];
  const partOfSpeech = wordDetails.partOfSpeech || null;
  
  // Track the source of each distractor for analytics
  const distractorSources: Record<string, DistractorSource> = {};
  
  // APPROACH 1: Check if we have stored distractors for this word
  if (wrongOptions.length < 3) {
    usedApproaches.push("stored distractors");
    
    const storedDistractors = await getStoredDistractors(
      supabase, 
      word, 
      partOfSpeech, 
      difficulty
    );
    
    // Add stored distractors that aren't too similar to the correct definition
    for (const distractor of storedDistractors) {
      if (wrongOptions.length >= 3) break;
      
      if (!isTooSimilar(distractor, correctDefinition) && !wrongOptions.includes(distractor)) {
        wrongOptions.push(distractor);
        distractorSources[distractor] = DistractorSource.STORED;
      }
    }
  }
  
  // APPROACH 2: Use alternative definitions of the same word
  if (wrongOptions.length < 3 && wordDetails.definitions && wordDetails.definitions.length > 1) {
    usedApproaches.push("alternative definitions");
    
    const altDefinitions = getAlternativeDefinitionDistractors(
      wordDetails,
      correctDefinition
    );
    
    for (const def of altDefinitions) {
      if (wrongOptions.length >= 3) break;
      if (!wrongOptions.includes(def)) {
        wrongOptions.push(def);
        distractorSources[def] = DistractorSource.ALTERNATIVE_DEFINITION;
        
        // Save this quality distractor for future use
        await saveDistractorToDatabase(
          supabase, 
          word, 
          correctDefinition, 
          def, 
          partOfSpeech, 
          difficulty, 
          DistractorSource.ALTERNATIVE_DEFINITION,
          0.9 // High quality score since it's from the same word
        );
      }
    }
  }
  
  // APPROACH 3: Use definitions from synonyms/antonyms
  if (wrongOptions.length < 3 && 
      ((wordDetails.synonyms && wordDetails.synonyms.length > 0) || 
       (wordDetails.antonyms && wordDetails.antonyms.length > 0))) {
    usedApproaches.push("related words");
    
    // Combine synonyms and antonyms, prioritizing synonyms
    const relatedWords = [
      ...(wordDetails.synonyms || []).slice(0, 5),
      ...(wordDetails.antonyms || []).slice(0, 3)
    ];
    
    // Get definitions for related words
    for (const relatedWord of relatedWords) {
      if (wrongOptions.length >= 3) break;
      
      try {
        // Get related word details using WordsAPI (reusing the function)
        const relatedWordDetails = await getWordDetailsFromAPI(relatedWord);
        
        if (relatedWordDetails.definitions?.length > 0) {
          // Get best definition that isn't too similar to correct definition
          const relatedDefinition = relatedWordDetails.definitions
            .find(def => !isTooSimilar(def, correctDefinition));
          
          if (relatedDefinition && !wrongOptions.includes(relatedDefinition)) {
            wrongOptions.push(relatedDefinition);
            
            // Determine if it's from a synonym or antonym
            const source = wordDetails.synonyms?.includes(relatedWord) 
              ? DistractorSource.SYNONYM_DEFINITION 
              : DistractorSource.ANTONYM_DEFINITION;
            
            distractorSources[relatedDefinition] = source;
            
            // Save this quality distractor for future use
            await saveDistractorToDatabase(
              supabase, 
              word, 
              correctDefinition, 
              relatedDefinition, 
              partOfSpeech, 
              difficulty, 
              source,
              0.85 // High quality score since it's from a related word
            );
          }
        }
      } catch (error) {
        console.error(`Error fetching related word "${relatedWord}":`, error);
        // Continue to next related word if there's an error
      }
    }
  }
  
  // APPROACH 4: Use general distractors by part of speech from the database
  if (wrongOptions.length < 3 && partOfSpeech) {
    usedApproaches.push("general distractors by part of speech");
    
    const posDistractors = await getGeneralDistractorsByPos(
      supabase, 
      partOfSpeech, 
      difficulty
    );
    
    for (const distractor of posDistractors) {
      if (wrongOptions.length >= 3) break;
      
      if (!isTooSimilar(distractor, correctDefinition) && !wrongOptions.includes(distractor)) {
        wrongOptions.push(distractor);
        distractorSources[distractor] = DistractorSource.RELATED_WORD;
      }
    }
  }
  
  // APPROACH 5: Use smart templates based on part of speech and difficulty
  if (wrongOptions.length < 3) {
    usedApproaches.push("smart templates");
    
    const templates = getDifficultySpecificTemplates(difficulty, partOfSpeech || 'noun');
    const shuffledTemplates = shuffleArray(templates);
    
    for (const template of shuffledTemplates) {
      if (wrongOptions.length >= 3) break;
      
      if (!isTooSimilar(template, correctDefinition) && !wrongOptions.includes(template)) {
        wrongOptions.push(template);
        distractorSources[template] = DistractorSource.TEMPLATE;
        
        // Save this template-based distractor for future use
        await saveDistractorToDatabase(
          supabase, 
          word, 
          correctDefinition, 
          template, 
          partOfSpeech, 
          difficulty, 
          DistractorSource.TEMPLATE,
          0.7 // Lower quality score since it's a template
        );
      }
    }
  }
  
  // Ensure we have exactly 3 wrong options, adding backup generic templates if needed
  const finalWrongOptions = ensureExactDistractorCount(
    wrongOptions, 
    3, 
    [
      `A type of ${difficulty} word related to ${partOfSpeech || 'language'}`,
      `A term often confused with ${word}`,
      `Something unrelated to ${word}`
    ]
  );
  
  // Log the approaches used for analytics
  console.log(`Generated distractors for "${word}" using: ${usedApproaches.join(", ")}`);
  console.log(`Distractor sources: ${JSON.stringify(distractorSources)}`);
  
  return finalWrongOptions;
}

/**
 * Helper function to get word details from WordsAPI
 * Reused from the existing getWordDetails implementation
 */
async function getWordDetailsFromAPI(word: string): Promise<WordDetails> {
  const WORDSAPI_KEY = '8cc3ff3281msh7ea7e190a1f4805p13cbdejsnb32d65962e66';
  const WORDSAPI_HOST = 'wordsapiv1.p.rapidapi.com';
  const WORDSAPI_BASE_URL = 'https://wordsapiv1.p.rapidapi.com/words';
  
  try {
    const response = await fetch(`${WORDSAPI_BASE_URL}/${encodeURIComponent(word)}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': WORDSAPI_KEY,
        'X-RapidAPI-Host': WORDSAPI_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform API response to our schema
    const wordDetails: WordDetails = {
      word: data.word,
      pronunciation: data.pronunciation?.all,
      partOfSpeech: data.results?.[0]?.partOfSpeech,
      definitions: data.results?.map(result => result.definition) || [],
      examples: data.results?.flatMap(result => result.examples || []) || [],
      synonyms: data.results?.flatMap(result => result.synonyms || []) || [],
      antonyms: data.results?.flatMap(result => result.antonyms || []) || [],
      metadata: {
        syllables: data.syllables,
        frequency: data.frequency,
      },
    };

    return wordDetails;
  } catch (error) {
    console.error('Error fetching word details:', error);
    throw error;
  }
}

export default generateWrongOptions; 