/**
 * Simplified Difficulty Calculator
 * Used for calculating difficulty scores based on enriched word data
 */

// Default weights
const DEFAULT_WEIGHTS = {
  frequency: 0.55,
  syllable_count: 0.30,
  pos: 0.15,
};

/**
 * Calculate the difficulty score for a word
 * @param {number} frequency Word frequency value
 * @param {number} syllableCount Syllable count (defaults to 1)
 * @param {string} pos Part of speech (defaults to 'unknown')
 * @param {object} weights Optional custom weights
 * @returns {number} Difficulty score from 0-1
 */
function calculateDifficulty(frequency, syllableCount = 1, pos = 'unknown', weights = null) {
  // Use default weights if not provided
  const usedWeights = weights || DEFAULT_WEIGHTS;
  
  // Calculate component scores
  const frequencyScore = calculateFrequencyScore(frequency);
  const syllableScore = calculateSyllableScore(syllableCount);
  const posScore = calculatePosScore(pos);
  
  // Apply weights
  const weightedScore = 
    (usedWeights.frequency * frequencyScore) +
    (usedWeights.syllable_count * syllableScore) +
    (usedWeights.pos * posScore);
  
  // Ensure score is in 0-1 range
  return Math.max(0, Math.min(1, weightedScore));
}

/**
 * Calculate the frequency component score
 * @param {number} frequency Word frequency
 * @returns {number} Score from 0-1
 */
function calculateFrequencyScore(frequency) {
  if (!frequency || isNaN(frequency)) {
    return 0.5; // Default to medium difficulty
  }

  // Normalize frequency using logarithmic scale
  // Max reasonable frequency observed: ~500,000
  const MAX_LOG_FREQ = Math.log(500000);
  
  // Apply log scale to smooth out extremely high frequencies
  const logFreq = Math.log(Math.max(frequency, 1)); // Avoid log(0)
  
  // Invert so higher score = more difficult (rarer words)
  const score = 1 - (logFreq / MAX_LOG_FREQ);
  
  // Ensure score is in 0-1 range
  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate the syllable component score
 * @param {number} syllableCount Number of syllables
 * @returns {number} Score from 0-1
 */
function calculateSyllableScore(syllableCount) {
  if (!syllableCount || isNaN(syllableCount)) {
    return 0.5; // Default to medium difficulty
  }

  // Consider reasonable syllable range: 1-8 syllables
  // Beyond 6 syllables, difficulty maxes out
  const normalizedSyllables = Math.min(syllableCount, 6) / 6;
  
  // Apply scaling
  return normalizedSyllables;
}

/**
 * Calculate the part of speech component score
 * @param {string} pos Part of speech
 * @returns {number} Score from 0-1
 */
function calculatePosScore(pos) {
  // Difficulty by part of speech
  // Some parts of speech are inherently more difficult
  const posScores = {
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
  
  // Return the score for the given POS, or default to medium if not found
  return posScores[pos.toLowerCase()] || 0.5;
}

/**
 * Determine difficulty level based on score
 * @param {number} score Difficulty score (0-1)
 * @returns {string} Difficulty level
 */
function getDifficultyLevel(score) {
  if (score < 0.4) {
    return 'beginner';
  } else if (score < 0.7) {
    return 'intermediate';
  } else {
    return 'advanced';
  }
}

module.exports = {
  calculateDifficulty,
  calculateFrequencyScore,
  calculateSyllableScore,
  calculatePosScore,
  getDifficultyLevel
}; 