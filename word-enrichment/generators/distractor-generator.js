const GeminiClient = require('../gemini-client');
const logger = require('../utils/logger');

class DistractorGenerator {
  constructor() {
    this.geminiClient = new GeminiClient();
  }

  /**
   * Generate distractors for a batch of words
   * @param {Array} words - Array of word objects with 'word' and 'pos' properties
   * @returns {Promise<Array>} - Array of word objects with added 'distractors' property
   */
  async generateDistractors(words) {
    logger.info(`Generating distractors for ${words.length} words...`);
    
    // Construct the prompt
    const prompt = this._buildDistractorPrompt(words);
    
    try {
      // Generate content
      const generatedText = await this.geminiClient.generateContent(
        prompt,
        0.7, // Balanced temperature for diverse yet appropriate distractors
        3072  // Max tokens for output
      );
      
      // Parse the generated JSON
      const distractorData = this.geminiClient.parseJsonFromText(generatedText);
      
      // Validate and merge with original words
      return this._processDistractors(words, distractorData);
    } catch (error) {
      logger.error(`Failed to generate distractors: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Build the prompt for generating distractors
   * @param {Array} words - Array of word objects
   * @returns {string} - The complete prompt
   * @private
   */
  _buildDistractorPrompt(words) {
    // Create a list of words in the format needed for the prompt
    const wordList = words.map(w => {
      let difficultyLevel = this._getDifficultyLevel(w.difficulty_score);
      let wordInfo = `${w.word} (${w.pos})`;
      
      // Add difficulty info if available
      if (difficultyLevel) {
        wordInfo += ` [difficulty: ${difficultyLevel}]`;
      }
      
      // Add definition if available to improve distractor quality
      if (w.short_definition) {
        wordInfo += ` - ${w.short_definition}`;
      }
      return wordInfo;
    }).join('\n- ');
    
    return `
You are an expert lexicographer and assessment specialist creating high-quality vocabulary distractors for educational testing. Your task is to generate distractors that will NEVER be mistaken for the correct answer by someone who knows the word.

### 🚨 CRITICAL REQUIREMENTS 🚨

1️⃣ **EXACT SAME PART OF SPEECH - MOST IMPORTANT RULE**
   - EVERY distractor MUST be the EXACT SAME part of speech as the target word
   - NOUN target words → ALL distractors MUST be NOUNS
   - VERB target words → ALL distractors MUST be VERBS
   - ADJECTIVE target words → ALL distractors MUST be ADJECTIVES
   - ADVERB target words → ALL distractors MUST be ADVERBS
   - For challenging forms (gerunds, past participles), ensure identical grammatical form
   - VERIFY EACH DISTRACTOR can be used in the exact same grammatical position

2️⃣ **NO SEMANTIC SIMILARITY WHATSOEVER**
   - Each distractor MUST be semantically DISTANT from the target word
   - NEVER use synonyms, near-synonyms, or semantically adjacent terms
   - NEVER use words that appear in dictionaries as synonyms for the target
   - NEVER use words that share the same hypernym (category) as the target
   - NEVER use words that could be used to define or explain the target

3️⃣ **STRATEGIC DISTRACTOR TYPES**
   Each set of 5 distractors MUST include EXACTLY:
   - 1 PHONOLOGICAL distractor: Sounds/spelled similar but COMPLETELY different meaning
   - 1 ANTONYM distractor: Clear opposite or contrasting meaning
   - 1 DOMAIN distractor: From an entirely different knowledge domain
   - 1 ORTHOGRAPHIC distractor: Visually similar spelling but DIFFERENT meaning
   - 1 UNRELATED distractor: No connection whatsoever to target, same POS

### ⚠️ VALIDATION CHECKS FOR EVERY DISTRACTOR

🔍 **PART OF SPEECH CHECK - DO THIS FIRST**
   - Can this distractor be used in EXACTLY the same grammatical position? (MUST BE YES)
   - Is it the same inflected form (tense for verbs, etc.) as the target? (MUST BE YES)
   - Would this word function the same way in a sentence? (MUST BE YES)

🔍 **SEMANTIC CHECKS**
   - Is this word listed as a synonym in ANY thesaurus? (REJECT if yes)
   - Does this word appear in definitions of the target? (REJECT if yes)
   - Could this word be substituted for the target in examples? (REJECT if yes)
   - Would a language expert consider these terms related? (REJECT if yes)
   - Is this from the same semantic category as the target? (REJECT if yes)

### ⚠️ EXAMPLES OF CORRECT PART OF SPEECH USAGE

TARGET: "task" (noun) - "A piece of work to be done"
GOOD: "flask", "leisure", "planet", "tusk", "yarn" (all are NOUNS)
BAD: "organize", "busy", "workable", "tasked", "do" (different parts of speech)

TARGET: "calculate" (verb) - "To determine values using mathematical operations"
GOOD: "quantify", "destroy", "swim", "hesitate", "whisper" (all are VERBS)
BAD: "calculation", "mathematic", "counting", "fast", "questionable" (different parts of speech)

TARGET: "transparent" (adjective) - "Allowing light to pass through completely"
GOOD: "opaque", "massive", "distant", "circular", "pungent" (all are ADJECTIVES)
BAD: "clarity", "see", "window", "transparently", "glass" (different parts of speech)

### ✅ EXAMPLES OF TRULY EFFECTIVE DISTRACTORS

TARGET: "task" (noun) - "A piece of work to be done"
EXCELLENT DISTRACTORS:
1. "flask" (PHONOLOGICAL - sounds similar, completely different meaning)
2. "leisure" (ANTONYM - opposite of work)
3. "planet" (DOMAIN - completely different domain: astronomy vs. work)
4. "tusk" (ORTHOGRAPHIC - visually similar spelling, animal part)
5. "yarn" (UNRELATED - completely different object, no semantic connection)

TARGET: "qualify" (verb) - "To be eligible or meet the requirements for something"
EXCELLENT DISTRACTORS:
1. "quantify" (PHONOLOGICAL - measurement vs. eligibility)
2. "disqualify" (ANTONYM - opposite meaning)
3. "solidify" (DOMAIN - physical state change vs. status change)
4. "amplify" (ORTHOGRAPHIC - similar word ending but different meaning)
5. "terrify" (UNRELATED - completely different meaning, no connection)

### WORDS TO GENERATE DISTRACTORS FOR:
- ${wordList}

### RESPONSE FORMAT (JSON)
[
  {
    "word": "task",
    "distractors": ["flask", "leisure", "planet", "tusk", "yarn"],
    "distractor_types": ["phonological", "antonym", "domain", "orthographic", "unrelated"]
  }
]

Only include valid JSON in your response. No explanations or other text before or after the JSON.
`;
  }
  
  /**
   * Determine the difficulty level category from numeric score
   * @param {number|string} score - Difficulty score from database
   * @returns {string|null} - Difficulty level category or null if score not available
   * @private
   */
  _getDifficultyLevel(score) {
    if (score === undefined || score === null) {
      return null;
    }
    
    // Convert to number if it's a string
    const numScore = typeof score === 'string' ? parseFloat(score) : score;
    
    if (isNaN(numScore)) {
      return null;
    }
    
    // Categorize difficulty
    if (numScore >= 0.6) return 'VERY HARD';
    if (numScore >= 0.4) return 'HARD';
    if (numScore >= 0.2) return 'MEDIUM';
    return 'EASY';
  }
  
  /**
   * Process and validate the generated distractors
   * @param {Array} originalWords - Original word objects
   * @param {Array} distractorData - Generated distractor data
   * @returns {Array} - Merged word objects with distractors
   * @private
   */
  _processDistractors(originalWords, distractorData) {
    // Create a map of words to distractors
    const distractorMap = new Map();
    distractorData.forEach(data => {
      // Format distractors with their types
      const formattedDistractors = data.distractors.map((distractor, index) => {
        return {
          type: data.distractor_types[index] || 'unknown',
          distractor: distractor
        };
      });
      
      distractorMap.set(data.word.toLowerCase(), formattedDistractors);
    });
    
    // Merge distractors with original words
    return originalWords.map(word => {
      const distractors = distractorMap.get(word.word.toLowerCase());
      
      return {
        ...word,
        distractors: distractors || null
      };
    });
  }
}

module.exports = new DistractorGenerator(); 