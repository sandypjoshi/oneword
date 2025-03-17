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
You are an expert lexicographer and assessment specialist creating high-quality vocabulary distractors for educational testing. Your task is to generate plausible distractors that would make excellent wrong answers on a vocabulary assessment.

### 🚨 CRITICAL REQUIREMENTS 🚨

1️⃣ **EXACT SAME PART OF SPEECH - MOST IMPORTANT RULE**
   - EVERY distractor MUST be the EXACT SAME part of speech as the target word
   - NOUN target words → ALL distractors MUST be NOUNS
   - VERB target words → ALL distractors MUST be VERBS
   - ADJECTIVE target words → ALL distractors MUST be ADJECTIVES
   - ADVERB target words → ALL distractors MUST be ADVERBS
   - For challenging forms (gerunds, past participles), ensure identical grammatical form
   - VERIFY EACH DISTRACTOR can be used in the exact same grammatical position

2️⃣ **NO SEMANTIC SIMILARITY - ABSOLUTE PROHIBITION**
   - NEVER use direct or indirect synonyms (e.g., "arson" and "incendiarism" are synonyms)
   - NEVER use words that could be defined using the target word
   - NEVER use words that share the same core meaning or purpose
   - NEVER use words from the same subcategory (e.g., "painting" and "drawing" are both art forms)
   - EVERY distractor MUST have a fundamentally different meaning and purpose than the target

3️⃣ **MAINTAIN PLAUSIBILITY AS WRONG ANSWERS**
   - Distractors should appear reasonable to someone who doesn't know the exact meaning
   - Choose words that have surface-level similarities (spelling, sound, word structure)
   - Words that have similar usage contexts but DIFFERENT meanings
   - Words that might be confused by students with partial knowledge
   - AVOID completely random words that would never be plausible answers

4️⃣ **STRATEGIC DISTRACTOR TYPES**
   Each set of 5 distractors MUST include:
   - 1-2 DIFFERENT-DOMAIN words: From a completely different field but same POS
   - 1 PHONOLOGICAL distractor: Sounds/spelled similar but unrelated meaning
   - 1 STRUCTURAL distractor: Similar word structure/ending but different meaning
   - 1-2 FUNCTIONAL distractors: Used in similar contexts but with different function

### ⚠️ CRITICAL DISTRACTOR TESTS - PERFORM FOR EACH WORD

For EVERY distractor, answer these questions:
1. Is this word a synonym or near-synonym to the target? (MUST BE NO)
2. Would this word appear in a thesaurus entry for the target? (MUST BE NO)
3. Could this word replace the target in most sentences? (MUST BE NO)
4. Does this word serve the same function as the target? (MUST BE NO)
5. Does this word belong to the same specific category? (MUST BE NO)
6. Would an expert consider these words related? (MUST BE NO)
7. Is this a plausible wrong answer on a vocabulary test? (MUST BE YES)
8. Does this word maintain the exact same part of speech? (MUST BE YES)

### ✅ EXAMPLES OF CORRECT DISTRACTORS

TARGET: "meticulous" (adjective) - "Extremely careful and precise about details"
INCORRECT DISTRACTORS: ❌
- "fastidious" (synonym - means almost the same thing)
- "thorough" (near-synonym - too similar in meaning)
- "precise" (appears in the definition - too close semantically)
- "detailed" (same semantic field as the target)
- "particular" (shares core meaning of being careful about specifics)

CORRECT DISTRACTORS: ✓
- "melodious" (PHONOLOGICAL - sounds similar, completely different meaning about sound)
- "momentous" (STRUCTURAL - similar suffix but means significant/important)
- "mercurial" (DIFFERENT-DOMAIN - relates to changeable mood, not precision)
- "municipal" (DIFFERENT-DOMAIN - relates to city government, not precision)
- "muscular" (FUNCTIONAL - describes a physical quality, not a personality trait)

TARGET: "arson" (noun) - "The criminal act of deliberately setting fire to property"
INCORRECT DISTRACTORS: ❌
- "incendiarism" (direct synonym - means exactly the same thing)
- "burning" (core action of the target - too similar)
- "pyromania" (related psychological condition - same domain)
- "conflagration" (result of arson - semantically linked)
- "immolation" (similar act involving fire - too related)

CORRECT DISTRACTORS: ✓
- "arsenal" (PHONOLOGICAL - sounds similar but refers to weapons collection)
- "arthritis" (PHONOLOGICAL - starts similarly but is a medical condition)
- "auction" (STRUCTURAL - similar short noun but refers to a sale event)
- "axiom" (DIFFERENT-DOMAIN - mathematical concept, completely unrelated)
- "arbiter" (DIFFERENT-DOMAIN - person who makes judgments, unrelated to fire)

### WORDS TO GENERATE DISTRACTORS FOR:
- ${wordList}

### RESPONSE FORMAT (JSON)
[
  {
    "word": "arson",
    "distractors": ["arsenal", "arthritis", "auction", "axiom", "arbiter"],
    "distractor_types": ["phonological", "phonological", "structural", "different-domain", "different-domain"]
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