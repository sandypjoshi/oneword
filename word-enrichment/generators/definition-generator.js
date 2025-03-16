const GeminiClient = require('../gemini-client');
const logger = require('../utils/logger');

class DefinitionGenerator {
  constructor() {
    this.geminiClient = new GeminiClient();
  }

  /**
   * Generate short definitions for a batch of words
   * @param {Array} words - Array of word objects with 'word' and 'pos' properties
   * @returns {Promise<Array>} - Array of word objects with added 'shortDefinition' property
   */
  async generateDefinitions(words) {
    logger.info(`Generating definitions for ${words.length} words...`);
    
    // Construct the prompt
    const prompt = this._buildDefinitionPrompt(words);
    
    try {
      // Generate content
      const generatedText = await this.geminiClient.generateContent(
        prompt,
        0.3, // Lower temperature for more precise, consistent definitions
        2048  // Max tokens for output
      );
      
      // Parse the generated JSON
      const definitionData = this.geminiClient.parseJsonFromText(generatedText);
      
      // Validate and merge with original words
      return this._processDefinitions(words, definitionData);
    } catch (error) {
      logger.error(`Failed to generate definitions: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Build the prompt for generating definitions
   * @param {Array} words - Array of word objects
   * @returns {string} - The complete prompt
   * @private
   */
  _buildDefinitionPrompt(words) {
    // Create a list of words in the format needed for the prompt
    const wordList = words.map(w => {
      let wordInfo = `${w.word} (${w.pos})`;
      // Add sense information if available
      if (w.sense_count) {
        wordInfo += ` [sense count: ${w.sense_count}]`;
      }
      return wordInfo;
    }).join('\n- ');
    
    return `
You are a master lexicographer tasked with creating precise, distinctive vocabulary definitions specifically for language assessment. Each definition must identify the EXACT meaning of a word while clearly distinguishing it from all related terms.

### 📌 EXTREME PRECISION REQUIREMENTS

1️⃣ **ABSOLUTE CLARITY AND SPECIFICITY**
   - Each definition MUST be under 10 words but maximally informative
   - Use ONLY the most precise terminology to identify the concept
   - Include CRITICAL distinguishing features that differentiate from similar words
   - Target the most common, core meaning for the part of speech

2️⃣ **COMPLETE OBJECTIVITY**
   - Use EXCLUSIVELY neutral, factual language
   - NEVER include subjective judgments, personal opinions, or cultural biases
   - ELIMINATE all vague words: "often," "sometimes," "can be," "may," etc.
   - AVOID relative terms without clear referents

3️⃣ **MAXIMUM DIFFERENTIATION**
   - The definition MUST clearly separate this word from all near-synonyms
   - Identify the EXACT conceptual space this word occupies
   - Include boundary-setting features that prevent confusion with related terms
   - Ensure the definition applies ONLY to this word and not to similar words

4️⃣ **STRUCTURAL PERFECTION BY PART OF SPEECH**
   - NOUNS: "A/The" + precise category term + essential distinctive properties
     Example: "A financial institution that accepts deposits and makes loans"
   - VERBS: "To" + specific action/process + distinctive characteristics
     Example: "To determine mathematical values through computation"
   - ADJECTIVES: Core property/quality + essential modifiers
     Example: "Extremely careful and precise about details"
   - ADVERBS: Manner/quality/circumstance with precision
     Example: "In a deliberately slow and controlled manner"

### ⚠️ CRITICAL DEFINITION TESTS

For EACH definition you create, verify it meets these tests:
1. Could this definition apply to ANY other word? (REVISE if yes)
2. Does it contain ANY subjective or vague terminology? (REVISE if yes)
3. Is it LONGER than 10 words? (REVISE if yes)
4. Does it capture the EXACT ESSENCE of the word? (REVISE if no)
5. Would a language expert immediately recognize this word from the definition? (REVISE if no)

### 📊 EXAMPLES OF PERFECT DEFINITIONS

| WORD | POS | PERFECT DEFINITION |
|------|-----|-------------------|
| telescope | noun | "An optical instrument that magnifies distant objects" |
| investigate | verb | "To conduct systematic inquiry to discover facts" |
| transparent | adj | "Allowing light to pass through completely" |
| precisely | adv | "In an exact and accurate manner" |
| anomaly | noun | "A deviation from the expected norm or pattern" |
| desolate | adj | "Completely devoid of inhabitants and vegetation" |
| calculate | verb | "To determine values using mathematical operations" |
| deliberately | adv | "In a careful, intentional, and unhurried manner" |

### WORDS TO DEFINE:
- ${wordList}

### RESPONSE FORMAT (JSON):
[
  {
    "word": "example",
    "pos": "noun",
    "shortDefinition": "A representative item showing the nature of others"
  }
]

Only include valid JSON in your response. No explanations or other text before or after the JSON.
`;
  }
  
  /**
   * Process and validate the generated definitions
   * @param {Array} originalWords - Original word objects
   * @param {Array} definitionData - Generated definition data
   * @returns {Array} - Merged word objects with definitions
   * @private
   */
  _processDefinitions(originalWords, definitionData) {
    // Create a map of words to definitions
    const definitionMap = new Map();
    definitionData.forEach(data => {
      definitionMap.set(data.word.toLowerCase(), data.shortDefinition);
    });
    
    // Merge definitions with original words
    return originalWords.map(word => {
      const shortDefinition = definitionMap.get(word.word.toLowerCase());
      
      return {
        ...word,
        short_definition: shortDefinition || null,
        definition_source: 'gemini',
        definition_updated_at: new Date().toISOString()
      };
    });
  }
}

module.exports = new DefinitionGenerator(); 