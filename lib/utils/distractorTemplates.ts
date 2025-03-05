/**
 * Distractor Templates Utility
 * 
 * This file provides utility functions for generating smart distractor templates
 * based on part of speech and difficulty level.
 */

import { WordDifficulty } from '../supabase/schema';

/**
 * Gets domain-specific noun categories based on difficulty
 */
export function getDomainForNoun(difficulty: WordDifficulty): string {
  const domains = {
    [WordDifficulty.BEGINNER]: [
      'tool', 'food', 'clothing', 'game', 'plant', 'animal', 'sport',
      'vehicle', 'furniture', 'body part', 'weather', 'toy', 'emotion'
    ],
    [WordDifficulty.INTERMEDIATE]: [
      'equipment', 'technology', 'instrument', 'medicine', 'science', 'art',
      'architecture', 'literature', 'transportation', 'education', 'cuisine',
      'psychology', 'business', 'politics', 'geography'
    ],
    [WordDifficulty.ADVANCED]: [
      'apparatus', 'methodology', 'discipline', 'taxonomy', 'theoretical construct',
      'philosophical doctrine', 'rhetorical device', 'socioeconomic phenomenon',
      'neurological process', 'epistemological framework', 'linguistic construct',
      'quantum mechanics', 'metaphysical concept'
    ]
  };
  
  return getRandomElement(domains[difficulty]);
}

/**
 * Gets verbs appropriate for each difficulty level
 */
export function getVerbForDifficulty(difficulty: WordDifficulty): string {
  const verbs = {
    [WordDifficulty.BEGINNER]: [
      'running', 'eating', 'playing', 'talking', 'reading', 'sleeping',
      'writing', 'swimming', 'dancing', 'singing', 'jumping', 'watching'
    ],
    [WordDifficulty.INTERMEDIATE]: [
      'analyzing', 'calculating', 'debating', 'investigating', 'organizing',
      'participating', 'researching', 'supervising', 'collaborating',
      'demonstrating', 'implementing', 'negotiating'
    ],
    [WordDifficulty.ADVANCED]: [
      'synthesizing', 'extrapolating', 'reconciling', 'postulating',
      'hypothesizing', 'disambiguating', 'deconstructing', 'articulating',
      'conceptualizing', 'facilitating', 'revolutionizing', 'transcending'
    ]
  };
  
  return getRandomElement(verbs[difficulty]);
}

/**
 * Gets adjectives appropriate for each difficulty level
 */
export function getAdjectiveForDifficulty(difficulty: WordDifficulty): string {
  const adjectives = {
    [WordDifficulty.BEGINNER]: [
      'small', 'large', 'colorful', 'useful', 'important', 'simple',
      'happy', 'sad', 'fast', 'slow', 'hot', 'cold', 'bright', 'dark'
    ],
    [WordDifficulty.INTERMEDIATE]: [
      'significant', 'innovative', 'traditional', 'essential', 'cultural',
      'effective', 'efficient', 'beneficial', 'remarkable', 'desirable',
      'surprising', 'disappointing', 'extraordinary', 'controversial'
    ],
    [WordDifficulty.ADVANCED]: [
      'paradigmatic', 'quintessential', 'fundamental', 'intrinsic', 'esoteric',
      'dialectical', 'ambiguous', 'paradoxical', 'transcendent', 'ephemeral',
      'existential', 'ubiquitous', 'idiosyncratic', 'nuanced', 'ethereal'
    ]
  };
  
  return getRandomElement(adjectives[difficulty]);
}

/**
 * Gets locations appropriate for each difficulty level
 */
export function getLocationForDifficulty(difficulty: WordDifficulty): string {
  const locations = {
    [WordDifficulty.BEGINNER]: [
      'homes', 'schools', 'parks', 'stores', 'restaurants', 'libraries',
      'beaches', 'gardens', 'zoos', 'farms', 'cities', 'streets'
    ],
    [WordDifficulty.INTERMEDIATE]: [
      'universities', 'laboratories', 'museums', 'corporations', 'institutions',
      'archaeological sites', 'historical landmarks', 'botanical gardens',
      'cultural centers', 'urban environments', 'natural reserves'
    ],
    [WordDifficulty.ADVANCED]: [
      'academic institutions', 'geopolitical regions', 'socioeconomic strata',
      'psychiatric facilities', 'metaphysical realms', 'theoretical frameworks',
      'post-industrial landscapes', 'neoclassical structures', 'dystopian futures',
      'anthropological contexts', 'astronomical phenomena'
    ]
  };
  
  return getRandomElement(locations[difficulty]);
}

/**
 * Gets fields/areas of study appropriate for each difficulty level
 */
export function getFieldForDifficulty(difficulty: WordDifficulty): string {
  const fields = {
    [WordDifficulty.BEGINNER]: [
      'cooking', 'gardening', 'drawing', 'sports', 'music', 'crafts',
      'photography', 'travel', 'building', 'teaching', 'storytelling'
    ],
    [WordDifficulty.INTERMEDIATE]: [
      'engineering', 'medicine', 'law', 'business', 'education',
      'psychology', 'journalism', 'architecture', 'design', 'research',
      'environmental studies', 'political science', 'economics'
    ],
    [WordDifficulty.ADVANCED]: [
      'quantum physics', 'neuropsychology', 'epistemology', 'semiotics',
      'computational linguistics', 'bioinformatics', 'geopolitical analysis',
      'phenomenology', 'macroeconomics', 'cultural anthropology',
      'comparative literature', 'theoretical mathematics'
    ]
  };
  
  return getRandomElement(fields[difficulty]);
}

/**
 * Gets nouns appropriate for each difficulty level
 */
export function getNounForDifficulty(difficulty: WordDifficulty): string {
  const nouns = {
    [WordDifficulty.BEGINNER]: [
      'attention', 'energy', 'effort', 'skill', 'strength', 'speed',
      'kindness', 'creativity', 'courage', 'patience', 'talent', 'joy'
    ],
    [WordDifficulty.INTERMEDIATE]: [
      'dedication', 'discipline', 'integrity', 'innovation', 'competence',
      'perseverance', 'determination', 'inspiration', 'perception',
      'harmony', 'collaboration', 'authenticity', 'enthusiasm'
    ],
    [WordDifficulty.ADVANCED]: [
      'meticulousness', 'perspicacity', 'erudition', 'altruism',
      'sagacity', 'equanimity', 'pragmatism', 'magnanimity',
      'discernment', 'verisimilitude', 'perspicuity', 'aplomb'
    ]
  };
  
  return getRandomElement(nouns[difficulty]);
}

/**
 * Gets adverbs appropriate for each difficulty level
 */
export function getAdverbForDifficulty(difficulty: WordDifficulty): string {
  const adverbs = {
    [WordDifficulty.BEGINNER]: [
      'quickly', 'slowly', 'loudly', 'quietly', 'carefully', 'happily',
      'sadly', 'easily', 'well', 'badly', 'early', 'late', 'often'
    ],
    [WordDifficulty.INTERMEDIATE]: [
      'efficiently', 'effectively', 'consequently', 'specifically',
      'frequently', 'occasionally', 'gradually', 'substantially',
      'relatively', 'potentially', 'traditionally', 'ironically'
    ],
    [WordDifficulty.ADVANCED]: [
      'surreptitiously', 'paradoxically', 'quintessentially',
      'ubiquitously', 'inexorably', 'inextricably', 'ostensibly',
      'judiciously', 'precipitously', 'fastidiously', 'categorically'
    ]
  };
  
  return getRandomElement(adverbs[difficulty]);
}

/**
 * Gets difficulty-specific templates for different parts of speech
 */
export function getDifficultySpecificTemplates(
  difficulty: WordDifficulty,
  partOfSpeech: string
): string[] {
  // Templates specific to difficulty levels regardless of part of speech
  const genericTemplates = {
    [WordDifficulty.BEGINNER]: [
      `Another name for ${getRandomElement(['something', 'someone', 'a place', 'an action'])} that is ${getAdjectiveForDifficulty(WordDifficulty.BEGINNER)}`,
      `Something you see in ${getLocationForDifficulty(WordDifficulty.BEGINNER)}`,
      `A common ${getRandomElement(['item', 'activity', 'feeling'])} experienced daily`
    ],
    [WordDifficulty.INTERMEDIATE]: [
      `A concept related to ${getFieldForDifficulty(WordDifficulty.INTERMEDIATE)} studies`,
      `Something associated with ${getNounForDifficulty(WordDifficulty.INTERMEDIATE)} in professional settings`,
      `A term used to describe ${getAdjectiveForDifficulty(WordDifficulty.INTERMEDIATE)} ${getRandomElement(['phenomena', 'behaviors', 'developments'])}`
    ],
    [WordDifficulty.ADVANCED]: [
      `A specialized term in ${getFieldForDifficulty(WordDifficulty.ADVANCED)}`,
      `A controversial concept in ${getRandomElement(['contemporary', 'modern', 'classical', 'academic'])} ${getFieldForDifficulty(WordDifficulty.ADVANCED)}`,
      `An abstract notion pertaining to ${getNounForDifficulty(WordDifficulty.ADVANCED)} and ${getNounForDifficulty(WordDifficulty.ADVANCED)}`
    ]
  };
  
  // Part-of-speech specific templates
  let posSpecificTemplates: string[] = [];
  
  switch(partOfSpeech.toLowerCase()) {
    case 'noun':
      posSpecificTemplates = [
        `A type of ${getDomainForNoun(difficulty)} used for ${getVerbForDifficulty(difficulty)}`,
        `A ${getAdjectiveForDifficulty(difficulty)} object found in ${getLocationForDifficulty(difficulty)}`,
        `A person who specializes in ${getFieldForDifficulty(difficulty)}`
      ];
      break;
    case 'verb':
      posSpecificTemplates = [
        `To ${getVerbForDifficulty(difficulty)} with great ${getNounForDifficulty(difficulty)}`,
        `To cause something to become ${getAdjectiveForDifficulty(difficulty)}`,
        `To perform an action typical in ${getFieldForDifficulty(difficulty)}`
      ];
      break;
    case 'adjective':
      posSpecificTemplates = [
        `${getAdverbForDifficulty(difficulty)} ${getAdjectiveForDifficulty(difficulty)}`,
        `Having the quality of being ${getNounForDifficulty(difficulty)}`,
        `Relating to or characterized by ${getNounForDifficulty(difficulty)}`
      ];
      break;
    case 'adverb':
      posSpecificTemplates = [
        `In a manner that is ${getAdjectiveForDifficulty(difficulty)}`,
        `With a focus on ${getNounForDifficulty(difficulty)}`,
        `While ${getVerbForDifficulty(difficulty)} ${getAdverbForDifficulty(difficulty)}`
      ];
      break;
    default:
      posSpecificTemplates = [
        `Related to ${getNounForDifficulty(difficulty)} in some way`,
        `A concept from ${getFieldForDifficulty(difficulty)}`,
        `Something characterized by ${getAdjectiveForDifficulty(difficulty)} qualities`
      ];
  }
  
  // Combine generic and specific templates
  return [...genericTemplates[difficulty], ...posSpecificTemplates];
}

/**
 * Gets a random element from an array
 */
export function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Shuffles an array
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export default {
  getDomainForNoun,
  getVerbForDifficulty,
  getAdjectiveForDifficulty,
  getLocationForDifficulty,
  getFieldForDifficulty,
  getNounForDifficulty,
  getAdverbForDifficulty,
  getDifficultySpecificTemplates,
  getRandomElement,
  shuffleArray
}; 