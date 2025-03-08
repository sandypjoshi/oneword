/**
 * Word filters for the OneWord App
 * 
 * Implements comprehensive filtering logic to ensure only high-quality
 * vocabulary words are selected for the app.
 */

// ============================================================================
// Word sets to filter out - organized by category
// ============================================================================

// Basic stop words and common function words
const STOP_WORDS = new Set([
  // Articles
  'the', 'a', 'an',
  // Prepositions
  'in', 'on', 'at', 'by', 'for', 'to', 'of', 'with', 'under', 'over', 'through',
  'above', 'below', 'from', 'into', 'onto', 'upon', 'within', 'without',
  // Auxiliary verbs
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'can', 'could', 'will', 'would', 'shall', 'should',
  'may', 'might', 'must',
  // Conjunctions
  'and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'because', 'although', 'since',
  'unless', 'whether', 'while',
  // Pronouns
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which', 'what',
  // Determiners
  'each', 'every', 'either', 'neither', 'some', 'any', 'no', 'many', 'much', 'few', 'little',
  // Common adverbs
  'not', 'very', 'too', 'only', 'just', 'also', 'then', 'still', 'rather',
  // Numbers as words
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'first', 'second', 'third', 'fourth', 'fifth', 'hundred', 'thousand',
  // Time words
  'day', 'week', 'month', 'year', 'time', 'today', 'tomorrow', 'yesterday',
  'now', 'then', 'always', 'never', 'often', 'sometimes'
]);

// Basic emotions and feelings
const BASIC_EMOTIONS = new Set([
  'happy', 'sad', 'angry', 'good', 'bad', 'nice', 'mean',
  'like', 'love', 'hate', 'want', 'need', 'hope', 'fear',
  'glad', 'sorry', 'upset', 'hurt', 'pleased', 'worried',
  'calm', 'excited', 'bored', 'tired', 'hungry', 'thirsty'
]);

// Basic descriptors and attributes
const BASIC_DESCRIPTORS = new Set([
  'big', 'small', 'large', 'little', 'tall', 'short', 'long',
  'hot', 'cold', 'warm', 'cool', 'new', 'old', 'young',
  'high', 'low', 'more', 'less', 'most', 'least',
  'many', 'few', 'all', 'none', 'some', 'any',
  'same', 'different', 'other', 'another',
  'good', 'bad', 'best', 'worst', 'better', 'worse',
  'easy', 'hard', 'simple', 'difficult',
  'full', 'empty', 'heavy', 'light', 'dark', 'bright',
  'fast', 'slow', 'quick', 'early', 'late',
  'right', 'wrong', 'true', 'false', 'real', 'fake'
]);

// Basic action verbs
const BASIC_ACTIONS = new Set([
  'go', 'come', 'get', 'take', 'make', 'do', 'give', 'put',
  'say', 'tell', 'ask', 'answer', 'speak', 'talk', 'call',
  'see', 'look', 'watch', 'hear', 'listen',
  'think', 'know', 'feel', 'believe', 'understand', 'remember', 'forget',
  'find', 'lose', 'search', 'seek', 'try', 'attempt',
  'use', 'work', 'play', 'read', 'write', 'draw', 'paint',
  'eat', 'drink', 'sleep', 'wake', 'rest', 'sit', 'stand', 'lie',
  'move', 'run', 'walk', 'jump', 'climb', 'fall', 'rise',
  'start', 'begin', 'stop', 'end', 'finish', 'continue',
  'buy', 'sell', 'pay', 'spend', 'cost', 'save',
  'open', 'close', 'turn', 'push', 'pull', 'carry',
  'break', 'fix', 'build', 'destroy', 'change', 'remain'
]);

// Time and place words
const TIME_PLACE_WORDS = new Set([
  // Time
  'now', 'then', 'today', 'tomorrow', 'yesterday',
  'morning', 'afternoon', 'evening', 'night', 'midnight', 'noon',
  'second', 'minute', 'hour', 'day', 'week', 'month', 'year',
  'always', 'never', 'sometimes', 'often', 'rarely', 'usually',
  'before', 'after', 'during', 'while', 'until', 'since',
  'past', 'present', 'future', 'soon', 'later', 'early',
  
  // Place
  'here', 'there', 'where', 'anywhere', 'nowhere', 'everywhere', 'somewhere',
  'in', 'out', 'inside', 'outside', 'inner', 'outer',
  'above', 'below', 'over', 'under', 'up', 'down',
  'near', 'far', 'close', 'distant', 'ahead', 'behind',
  'left', 'right', 'center', 'middle', 'side', 'front', 'back',
  'home', 'away', 'around', 'between', 'among'
]);

// Quantity, amount, and degree words
const QUANTITY_WORDS = new Set([
  'much', 'many', 'more', 'most', 'little', 'less', 'least', 'few', 'fewer', 'fewest',
  'some', 'any', 'no', 'none', 'all', 'every', 'each', 'either', 'neither',
  'both', 'several', 'numerous', 'countless', 'pair', 'couple',
  'first', 'second', 'third', 'last', 'next', 'previous',
  'half', 'quarter', 'part', 'whole', 'entire', 'complete',
  'enough', 'plenty', 'abundant', 'scarce', 'sufficient',
  'almost', 'nearly', 'approximately', 'exactly', 'precisely',
  'about', 'around', 'roughly'
]);

// Intensifiers and qualifiers
const INTENSIFIERS = new Set([
  'very', 'really', 'quite', 'extremely', 'incredibly', 'absolutely',
  'completely', 'totally', 'entirely', 'fully', 'perfectly',
  'just', 'simply', 'only', 'merely', 'almost', 'nearly',
  'hardly', 'barely', 'scarcely', 'somewhat', 'rather',
  'fairly', 'pretty', 'even', 'still', 'so', 'too', 'enough',
  'definitely', 'certainly', 'surely', 'clearly', 'obviously'
]);

// Question and interrogative words
const QUESTION_WORDS = new Set([
  'what', 'when', 'where', 'who', 'whom', 'whose', 'which', 'why', 'how',
  'whatever', 'whenever', 'wherever', 'whoever', 'whomever', 'whichever', 'however'
]);

// Possessives and demonstratives
const POSSESSIVES = new Set([
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'mine', 'yours', 'hers', 'ours', 'theirs',
  'this', 'that', 'these', 'those',
  'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves'
]);

// Filler words
const FILLER_WORDS = new Set([
  'well', 'um', 'uh', 'like', 'sort', 'kind', 'you know', 'actually',
  'basically', 'literally', 'honestly', 'frankly', 'anyway', 'anyhow',
  'I mean', 'you see', 'right', 'okay', 'so'
]);

// Common abbreviations and contractions
const COMMON_ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'rev', 'gen', 'hon', 'st', 'rd',
  'etc', 'ie', 'eg', 'vs', 'viz', 'inc', 'co', 'corp', 'ltd',
  "don't", "can't", "won't", "isn't", "aren't", "wasn't", "weren't",
  "hasn't", "haven't", "hadn't", "doesn't", "don't", "didn't",
  "wouldn't", "shouldn't", "couldn't", "mightn't", "mustn't",
  "i'm", "you're", "he's", "she's", "it's", "we're", "they're",
  "i've", "you've", "we've", "they've", "i'd", "you'd", "they'd",
  "i'll", "you'll", "he'll", "she'll", "we'll", "they'll"
]);

// Internet and messaging terms
const INTERNET_TERMS = new Set([
  'lol', 'omg', 'btw', 'fyi', 'asap', 'brb', 'afk', 'ttyl', 'tbh', 'imo',
  'aka', 'diy', 'faq', 'rip', 'tba', 'tbd', 'nvm', 'idk', 'jk', 'np',
  'url', 'www', 'http', 'html', 'css', 'app', 'blog', 'vlog', 'email',
  'login', 'logout', 'signup', 'download', 'upload', 'share', 'tweet', 'post'
]);

// Combine all filtered word sets
const ALL_FILTERED_WORDS = new Set([
  ...Array.from(STOP_WORDS),
  ...Array.from(BASIC_EMOTIONS),
  ...Array.from(BASIC_DESCRIPTORS),
  ...Array.from(BASIC_ACTIONS),
  ...Array.from(TIME_PLACE_WORDS),
  ...Array.from(QUANTITY_WORDS),
  ...Array.from(INTENSIFIERS),
  ...Array.from(QUESTION_WORDS),
  ...Array.from(POSSESSIVES),
  ...Array.from(FILLER_WORDS),
  ...Array.from(COMMON_ABBREVIATIONS),
  ...Array.from(INTERNET_TERMS)
]);

// ============================================================================
// Interfaces and Types
// ============================================================================

export interface WordQualityCheck {
  isValid: boolean;
  reason?: string;
}

// ============================================================================
// Primary Filter Function
// ============================================================================

/**
 * Determines if a word is eligible for inclusion in the OneWord app
 * Implements multiple quality checks for good vocabulary words
 */
export function isWordEligible(word: string): WordQualityCheck {
  // Normalize input
  word = word.trim();
  
  // 1. Basic length check
  if (word.length < 3) {
    return {
      isValid: false,
      reason: 'Too short (less than 3 characters)'
    };
  }
  
  // 2. Check for multi-word phrases (not allowed)
  if (word.includes(' ')) {
    return {
      isValid: false,
      reason: 'Contains spaces (multi-word phrase)'
    };
  }
  
  // 3. Check for numbers
  if (/\d/.test(word)) {
    return {
      isValid: false,
      reason: 'Contains numbers'
    };
  }
  
  // 4. Check for proper nouns (starts with capital)
  if (/^[A-Z]/.test(word)) {
    return {
      isValid: false,
      reason: 'Appears to be a proper noun (starts with capital)'
    };
  }
  
  // 5. Check for all-caps abbreviations
  if (word === word.toUpperCase() && word.length <= 5) {
    return {
      isValid: false,
      reason: 'Appears to be an abbreviation (all caps)'
    };
  }
  
  // 6. Check for contractions
  if (word.includes("'")) {
    return {
      isValid: false,
      reason: 'Contains a contraction or apostrophe'
    };
  }
  
  // 7. Check for special characters (except hyphens)
  if (/[^a-zA-Z\-]/.test(word)) {
    return {
      isValid: false,
      reason: 'Contains special characters'
    };
  }
  
  // 8. Check if word is in filtered lists
  const lowerWord = word.toLowerCase();
  if (ALL_FILTERED_WORDS.has(lowerWord)) {
    return {
      isValid: false,
      reason: `Basic/common word "${word}"`
    };
  }
  
  // 9. Additional hyphenation check
  if (word.includes('-')) {
    // Count hyphens - too many suggests it's not a good vocabulary word
    const hyphenCount = (word.match(/-/g) || []).length;
    if (hyphenCount > 1) {
      return {
        isValid: false,
        reason: 'Contains multiple hyphens'
      };
    }
    
    // Check if parts around hyphen are too short
    const parts = word.split('-');
    if (parts.some(part => part.length < 2)) {
      return {
        isValid: false,
        reason: 'Hyphenated with very short components'
      };
    }
  }
  
  // 10. Check for repetitive patterns which suggest it's not a good vocabulary word
  const repetitionPattern = /(.{2,})\1{2,}/; // Same 2+ chars repeated 2+ times
  if (repetitionPattern.test(lowerWord)) {
    return {
      isValid: false,
      reason: 'Contains excessive character repetition'
    };
  }
  
  // All checks passed
  return { isValid: true };
}

/**
 * Advanced filtering with external data sources
 * Checks frequency data from Datamuse to exclude overly common words
 */
export async function isWordEligibleAdvanced(
  word: string, 
  frequencyThreshold: number = 0.85 // Threshold for normalized frequency
): Promise<WordQualityCheck> {
  // First run the basic checks
  const basicCheck = isWordEligible(word);
  if (!basicCheck.isValid) {
    return basicCheck;
  }
  
  try {
    // Check frequency using Datamuse API
    const response = await fetch(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=f`
    );
    
    if (!response.ok) {
      console.warn(`Datamuse API error for word "${word}": ${response.status}`);
      return { isValid: true }; // Default to valid on API errors
    }
    
    const data = await response.json();
    
    // Check if we got a valid match for our exact word
    const matchedWord = data?.find((w: any) => w.word.toLowerCase() === word.toLowerCase());
    
    if (matchedWord?.tags) {
      // Look for frequency tag (f:XX.XX)
      const frequencyTag = matchedWord.tags.find((tag: string) => tag.startsWith('f:'));
      
      if (frequencyTag) {
        const frequencyValue = parseFloat(frequencyTag.split(':')[1]);
        // Datamuse frequency - observed values can exceed 8 by a lot
        // More common words have higher values (up to 70+ for very common words)
        
        // Apply a log-based normalization to handle the wide range of values
        // ln(1+x) gives a smoother curve for the range of observed values
        const MAX_EXPECTED_FREQ = 75; // Based on observed max values
        const normalizedFrequency = Math.min(
          frequencyValue / MAX_EXPECTED_FREQ, 
          1.0
        );
        
        if (normalizedFrequency > frequencyThreshold) {
          // Round to percentage for cleaner reporting
          const frequencyPercentage = Math.round(normalizedFrequency * 100);
          return {
            isValid: false,
            reason: `Too common (frequency score: ${frequencyPercentage}%)`
          };
        }
      }
    }
    
    // Word passed frequency check or no frequency data found
    return { isValid: true };
  } catch (error) {
    // In case of API failure, allow the word (just use basic checks)
    console.error('Error checking word frequency:', error);
    return { isValid: true };
  }
} 