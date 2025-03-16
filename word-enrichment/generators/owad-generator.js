const GeminiClient = require('../gemini-client');
const logger = require('../utils/logger');

class OwadGenerator {
  constructor() {
    this.geminiClient = new GeminiClient();
  }

  /**
   * Generate OWAD-style phrases for a batch of words
   * @param {Array} words - Array of word objects with 'word' and 'pos' properties
   * @returns {Promise<Array>} - Array of word objects with added 'owadPhrases' property
   */
  async generateOwadPhrases(words) {
    logger.info(`Generating OWAD phrases for ${words.length} words...`);
    
    // Construct the prompt
    const prompt = this._buildOwadPrompt(words);
    
    try {
      // Generate content
      const generatedText = await this.geminiClient.generateContent(
        prompt,
        0.65, // Slightly higher temperature for more engaging and distinctive phrases
        2048  // Max tokens for output
      );
      
      // Parse the generated JSON
      const owadData = this.geminiClient.parseJsonFromText(generatedText);
      
      // Validate and merge with original words
      return this._processOwadPhrases(words, owadData);
    } catch (error) {
      logger.error(`Failed to generate OWAD phrases: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Build the prompt for generating OWAD phrases
   * @param {Array} words - Array of word objects
   * @returns {string} - The complete prompt
   * @private
   */
  _buildOwadPrompt(words) {
    // Create a list of words in the format needed for the prompt
    const wordList = words.map(w => {
      let wordInfo = `${w.word} (${w.pos})`;
      // Add definition if available to improve phrase quality
      if (w.short_definition) {
        wordInfo += ` - ${w.short_definition}`;
      }
      // Add sense information if available
      else if (w.sense_count) {
        wordInfo += ` [sense count: ${w.sense_count}]`;
      }
      return wordInfo;
    }).join('\n- ');
    
    return `
You are creating simple, specific phrases for vocabulary learning. IMPORTANT: NEVER include the target word in the phrases - instead create phrases that SUGGEST or EVOKE the target word. For each word, create phrases that would make someone think of that specific word.

### 🚨 ABSOLUTELY CRITICAL RULES 🚨

1️⃣ **NEVER INCLUDE THE TARGET WORD**
   - Your phrases must NEVER contain the target word itself
   - Phrases must NEVER contain any form of the target word (plurals, tenses, derivatives)
   - The goal is to SUGGEST the word without using it
   - Example: for "meticulous" → "very carefully arranged" (NOT "meticulous work")
   - Example: for "telescope" → "star viewing device" (NOT "a powerful telescope")

2️⃣ **SIMPLICITY AND CLARITY**
   - Use COMMON, EVERYDAY words that most beginner-intermediate learners know
   - Avoid complex vocabulary, jargon, or academic language
   - Keep grammar structures straightforward and direct
   - Aim for phrases a middle school student could easily understand

3️⃣ **SPECIFICITY AND UNIQUENESS** 
   - Each phrase must strongly hint at this specific word and not others
   - Create a context that brings this exact word to mind
   - Ensure the phrase clearly suggests the word's core meaning
   - The phrase should make someone think "That's [target word]!"

4️⃣ **PRACTICAL EXAMPLES BY PART OF SPEECH**
   - NOUNS: Describe its purpose, appearance, or key characteristics
     Example: "star viewing device" (for "telescope") NOT "a powerful telescope"
   - VERBS: Describe the action in simpler terms
     Example: "to find the answer with math" (for "calculate") NOT "to calculate quickly"
   - ADJECTIVES: Describe characteristics using simpler words
     Example: "very carefully arranged" (for "meticulous") NOT "a meticulous worker"
   - ADVERBS: Describe how an action is done using simpler words
     Example: "done with perfect timing" (for "precisely") NOT "cut precisely here" 

### ⚠️ VALIDATION CHECKS

For EACH phrase you create, first verify:
1. Does it contain the target word or ANY form of it? (MUST BE NO)
2. Would this phrase strongly suggest the target word to someone who knows it? (MUST BE YES)

Then verify:
3. Are all words commonly understood by a 12-year-old? (REVISE if no)
4. Does it suggest this word and not close synonyms? (REVISE if no)
5. Is it clear, concrete, and helpful for learning? (REVISE if no)

### 📝 EXAMPLES OF EXCELLENT OWAD PHRASES

| WORD | POS | EXCELLENT PHRASES (without using the word) |
|------|-----|-------------------------------------------|
| meticulous | adj | "very carefully arranged" / "paying attention to every detail" |
| telescope | noun | "star viewing device" / "tool for seeing distant planets" |
| calculate | verb | "to work out the math" / "to find the numerical answer" |
| transparent | adj | "you can see right through it" / "clear as clean glass" |
| precisely | adv | "with perfect accuracy" / "exactly on the mark" |
| strategy | noun | "smart battle plan" / "clever way to win" |

### WORDS TO CREATE PHRASES FOR:
- ${wordList}

### RESPONSE FORMAT (JSON):
[
  {
    "word": "example",
    "pos": "noun",
    "owadPhrases": ["a sample to learn from", "something that shows how it's done"]
  }
]

Only include valid JSON in your response. No explanations or other text before or after the JSON.
`;
  }
  
  /**
   * Process and validate the generated OWAD phrases
   * @param {Array} originalWords - Original word objects
   * @param {Array} owadData - Generated OWAD phrases
   * @returns {Array} - Merged word objects with OWAD phrases
   * @private
   */
  _processOwadPhrases(originalWords, owadData) {
    // Create a map of words to OWAD phrases
    const owadMap = new Map();
    owadData.forEach(data => {
      owadMap.set(data.word.toLowerCase(), data.owadPhrases);
    });
    
    // Merge OWAD phrases with original words
    return originalWords.map(word => {
      const owadPhrases = owadMap.get(word.word.toLowerCase());
      
      return {
        ...word,
        owad_phrase: owadPhrases || null
      };
    });
  }
}

module.exports = new OwadGenerator(); 