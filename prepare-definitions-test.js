// Test script to transform Claude's output into the format needed for the update script

const fs = require('fs');

// Configuration for test
const ORIGINAL_WORDS_FILE = 'test-words-for-definitions.json';
const CLAUDE_DEFINITIONS_FILE = 'claude-definitions-test.txt';
const OUTPUT_FILE = 'test-words-with-definitions.json';

function parseClaudeOutput(text) {
  // This regex pattern matches definitions in the format "word: definition"
  // Modified to handle multi-word terms with spaces
  const definitionPattern = /^([a-zA-Z\s\-']+):\s*(.+)$/gm;
  const definitions = {};
  let match;
  
  while ((match = definitionPattern.exec(text)) !== null) {
    const word = match[1].trim().toLowerCase();
    const definition = match[2].trim();
    definitions[word] = definition;
    console.log(`Parsed: "${word}" => "${definition}"`);
  }
  
  return definitions;
}

function prepareTestDefinitions() {
  try {
    // Load the original words data
    if (!fs.existsSync(ORIGINAL_WORDS_FILE)) {
      throw new Error(`Original words file not found: ${ORIGINAL_WORDS_FILE}`);
    }
    
    const originalWords = JSON.parse(fs.readFileSync(ORIGINAL_WORDS_FILE, 'utf8'));
    
    // Load and parse Claude's definitions
    if (!fs.existsSync(CLAUDE_DEFINITIONS_FILE)) {
      throw new Error(`Claude definitions file not found: ${CLAUDE_DEFINITIONS_FILE}`);
    }
    
    const claudeText = fs.readFileSync(CLAUDE_DEFINITIONS_FILE, 'utf8');
    const definitionsMap = parseClaudeOutput(claudeText);
    
    console.log(`\nParsed ${Object.keys(definitionsMap).length} definitions from Claude's output`);
    
    // Merge the data
    const wordsWithDefinitions = originalWords.map(wordData => {
      const word = wordData.word.toLowerCase();
      
      if (definitionsMap[word]) {
        return {
          ...wordData,
          short_definition: definitionsMap[word]
        };
      } else {
        console.warn(`No definition found for word: ${word}`);
        return wordData;
      }
    });
    
    // Filter out words without definitions
    const validWords = wordsWithDefinitions.filter(w => w.short_definition);
    
    // Save the merged data
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(validWords, null, 2));
    
    console.log(`
Processing complete!
- Original words: ${originalWords.length}
- Definitions from Claude: ${Object.keys(definitionsMap).length}
- Words with definitions: ${validWords.length}
- Output saved to: ${OUTPUT_FILE}

Here's a preview of the first few words with their short definitions:
${validWords.slice(0, 5).map(w => `- ${w.word}: "${w.short_definition}"`).join('\n')}
    `);
    
  } catch (error) {
    console.error('Error preparing definitions:', error);
  }
}

// Start the preparation process
prepareTestDefinitions(); 