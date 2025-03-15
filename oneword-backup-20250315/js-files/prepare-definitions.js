// Script to transform Claude's output into the format needed for the update script

const fs = require('fs');

// Configuration
const ORIGINAL_WORDS_FILE = 'words-for-definitions.json';
const CLAUDE_DEFINITIONS_FILE = 'claude-definitions.txt';
const OUTPUT_FILE = 'words-with-definitions.json';

function parseClaudeOutput(text) {
  // This regex pattern matches definitions in the format "word: definition"
  const definitionPattern = /^([a-zA-Z\-']+):\s*(.+)$/gm;
  const definitions = {};
  let match;
  
  while ((match = definitionPattern.exec(text)) !== null) {
    const word = match[1].trim().toLowerCase();
    const definition = match[2].trim();
    definitions[word] = definition;
  }
  
  return definitions;
}

function prepareDefinitions() {
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
    
    console.log(`Parsed ${Object.keys(definitionsMap).length} definitions from Claude's output`);
    
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

Next steps:
1. Run the update-definitions.js script to update your database
    `);
    
  } catch (error) {
    console.error('Error preparing definitions:', error);
  }
}

// Start the preparation process
prepareDefinitions(); 