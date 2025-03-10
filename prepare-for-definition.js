/**
 * Prepare Words for Short Definition Generation
 * 
 * This script extracts words needing short definitions and formats them
 * for processing by Claude.
 * 
 * Usage:
 * - node prepare-for-definition.js --limit 100
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const path = require('path');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('limit', {
    alias: 'l',
    type: 'number',
    description: 'Maximum number of words to process',
    default: 100
  })
  .option('input', {
    alias: 'i',
    type: 'string',
    description: 'Input JSON file with test words',
    default: null
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    description: 'Output file path',
    default: 'words-for-definition.txt'
  })
  .option('batch-size', {
    alias: 'b',
    type: 'number',
    description: 'Size of batches for fetching definitions',
    default: 20
  })
  .option('verify-ids', {
    type: 'boolean',
    description: 'Verify word IDs against database entries',
    default: true
  })
  .help()
  .alias('help', 'h')
  .argv;

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be defined in .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Add after the argv definition:
const PROGRESS_FILE = 'definition-progress.json';

// Load or initialize progress
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading progress file:', err);
  }
  return {
    lastProcessedId: 0,
    totalWords: 0,
    processedCount: 0,
    batchSize: argv.limit || 500,
    lastUpdated: new Date().toISOString()
  };
}

// Save progress
function saveProgress(progress) {
  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

/**
 * Get words that need short definitions
 * @param {number} limit - Maximum number of words to fetch
 * @returns {Array} - Array of words needing definitions
 */
async function getWordsNeedingDefinitions(limit) {
  if (argv.input) {
    try {
      const testWords = JSON.parse(fs.readFileSync(argv.input, 'utf8'));
      console.log(`Found ${testWords.length} test words in ${argv.input}`);
      return testWords;
    } catch (err) {
      console.error('Error reading test words file:', err);
      return [];
    }
  }

  const progress = loadProgress();

  try {
    // First, get total count if not already stored
    if (!progress.totalWords) {
      const { count, error: countError } = await supabase
        .from('app_words')
        .select('id', { count: 'exact', head: true })
        .is('short_definition', null);

      if (countError) {
        console.error('Error getting total count:', countError);
      } else {
        progress.totalWords = count;
        saveProgress(progress);
      }
    }

    // Get next batch of words
    const { data, error } = await supabase
      .from('app_words')
      .select(`
        id, 
        word, 
        pos, 
        difficulty_score,
        source_word_id
      `)
      .is('short_definition', null)
      .gt('id', progress.lastProcessedId)
      .order('id', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching words:', error);
      return [];
    }

    // Enhanced progress display
    const progressBar = '='.repeat(Math.floor(20 * progress.processedCount / progress.totalWords)) + 
                       '-'.repeat(20 - Math.floor(20 * progress.processedCount / progress.totalWords));
    
    console.log('\n=== Progress ===');
    console.log(`[${progressBar}] ${Math.floor(100 * progress.processedCount / progress.totalWords)}%`);
    console.log(`Words processed: ${progress.processedCount}/${progress.totalWords}`);
    console.log(`Current batch: ${data.length} words`);
    console.log(`ID range: ${data[0]?.id || 'N/A'} to ${data[data.length-1]?.id || 'N/A'}`);
    console.log(`Last processed ID: ${progress.lastProcessedId}`);
    console.log('===============\n');
    
    return data;
  } catch (err) {
    console.error('Exception fetching words:', err);
    return [];
  }
}

/**
 * Verify word IDs against database entries
 * @param {Array} words - Words to verify
 * @returns {Array} - Words with verified IDs
 */
async function verifyWordIds(words) {
  if (!argv['verify-ids']) return words;
  
  console.log('Verifying word IDs against database entries...');
  
  // If using test words file, skip database verification
  if (argv.input) {
    console.log('Using test words file - skipping database verification');
    return words;
  }
  
  const verifiedWords = [];
  
  for (const word of words) {
    // Verify that the word with this ID exists and has the correct word value
    const { data, error } = await supabase
      .from('app_words')
      .select('id, word, pos')
      .eq('id', word.id)
      .single();
    
    if (error) {
      console.error(`Error verifying word ID ${word.id}:`, error);
      continue;
    }
    
    if (data.word !== word.word) {
      console.warn(`ID mismatch: ID ${word.id} is '${data.word}' in DB but '${word.word}' in result set.`);
      // Use the word from the database
      word.word = data.word;
      word.pos = data.pos;
    }
    
    verifiedWords.push(word);
  }
  
  console.log(`Verified ${verifiedWords.length}/${words.length} word IDs`);
  return verifiedWords;
}

/**
 * Get original definitions for a batch of words
 * @param {Array} wordBatch - Batch of words
 * @returns {Array} - Words with their original definitions
 */
async function getDefinitionsForBatch(wordBatch) {
  const wordMap = new Map(wordBatch.map(word => [word.id, { ...word, originalDefinitions: [] }]));
  
  // First try to get definitions through word_synsets
  try {
    const wordIds = wordBatch.map(w => w.source_word_id);
    
    const { data: synsetData, error: synsetError } = await supabase
      .from('word_synsets')
      .select(`
        word_id,
        synset_id,
        synsets (
          definition
        )
      `)
      .in('word_id', wordIds);

    if (synsetError) {
      console.error('Error fetching synsets for batch:', synsetError);
    } else if (synsetData && synsetData.length > 0) {
      // Group definitions by word_id
      for (const item of synsetData) {
        if (item.synsets && item.synsets.definition) {
          // Find the corresponding app_word
          const appWord = wordBatch.find(w => w.source_word_id === item.word_id);
          if (appWord && wordMap.has(appWord.id)) {
            const wordWithDefs = wordMap.get(appWord.id);
            wordWithDefs.originalDefinitions.push(item.synsets.definition);
          }
        }
      }
    }
  } catch (err) {
    console.error('Exception fetching synsets:', err);
  }

  // Fallback to word_definitions table for words with no definitions yet
  const wordsNeedingDefsFallback = Array.from(wordMap.values())
    .filter(w => w.originalDefinitions.length === 0);
  
  if (wordsNeedingDefsFallback.length > 0) {
    try {
      for (const word of wordsNeedingDefsFallback) {
        const { data: defData, error: defError } = await supabase
          .from('word_definitions')
          .select('definition')
          .eq('word', word.word)
          .eq('pos', word.pos);

        if (defError) {
          console.error(`Error fetching definitions for ${word.word}:`, defError);
        } else if (defData && defData.length > 0) {
          const defs = defData.map(d => d.definition);
          if (wordMap.has(word.id)) {
            wordMap.get(word.id).originalDefinitions = defs;
          }
        }
      }
    } catch (err) {
      console.error('Exception fetching fallback definitions:', err);
    }
  }

  return Array.from(wordMap.values());
}

/**
 * Format words with definitions for Claude
 * @param {Array} words - Words with original definitions
 * @returns {string} - Formatted text
 */
function formatWordsForClaude(words) {
  let output = `# Generate Concise and Engaging Word Definitions

Your task is to create TWO types of definitions for ${words.length} words:

1. MAIN DEFINITION:
   - Keep it short and engaging (max 12 words)
   - Use simple, everyday language that learners can understand
   - Focus on the most common meaning in daily life
   - Avoid technical terms or complex wording
   - Keep the tone slightly playful and easy to remember
   - Format: "[Simple definition]"
   - Example: "To push with force against something"
   - Example: "A machine that prints newspapers"

2. OWAD-STYLE PHRASES:
   - Create TWO memorable phrases that capture the word's core meaning
   - MUST maintain the word's part of speech exactly:
     * NOUNS: Start with "a" or "an" (e.g., "a hidden code")
     * VERBS: Start with "to" (e.g., "to move quickly")
     * ADJECTIVES: Use describing form (e.g., "deeply wise")
     * ADVERBS: Use describing form (e.g., "quickly")
   - Keep phrases clear and directly related to the main meaning
   - Avoid metaphors - stay literal and precise
   - Length is typically 2-4 words
   - Can use hyphens for compound terms
   - Keep the tone light and memorable

Here are PERFECT examples:
1. "semordnilap" (noun):
   - Definition: "A word that spells a different word backwards"
   - OWAD phrases: 
     1. "a wordplay"
     2. "a reverse word"

2. "ratiocinate" (verb):
   - Definition: "To reason in an exact and logical way"
   - OWAD phrases:
     1. "to think logically"
     2. "to reason carefully"

3. "staunch" (adjective):
   - Definition: "Firm and dependable in loyalty or support"
   - OWAD phrases:
     1. "strong, reliable, loyal"
     2. "firmly devoted"

4. "zing" (verb):
   - Definition: "To attack or criticize someone with sharp words"
   - OWAD phrases:
     1. "to sharply criticize"
     2. "to mock harshly"

5. "putative" (adjective):
   - Definition: "Generally considered or believed to be such"
   - OWAD phrases:
     1. "assumed to exist"
     2. "commonly believed"

6. "acrostic" (noun):
   - Definition: "A text where certain letters spell out a word"
   - OWAD phrases:
     1. "a coded message"
     2. "a hidden word"

7. "kayfabe" (noun):
   - Definition: "The portrayal of staged events as genuine"
   - OWAD phrases:
     1. "a fake performance"
     2. "a staged reality"

BAD examples to avoid:
❌ "ratiocinate" (verb): "to dance with logic"
   ✅ Better: "to think logically"
   (Stay literal, avoid poetic language)

❌ "staunch" (adjective): "heart of steel"
   ✅ Better: "strong, reliable, loyal"
   (Use clear, direct descriptions)

❌ "acrostic" (noun): "letter's secret journey"
   ✅ Better: "a coded message"
   (Keep it concrete and clear)

IMPORTANT RULES:
1. Always start phrases correctly for the part of speech:
   - Nouns → "a/an ..."
   - Verbs → "to ..."
   - Adjectives → describing form
2. Choose the most common meaning people use daily
3. Keep definitions concrete and literal
4. Make it immediately clear what the word means
5. Avoid technical or complex terminology
6. Keep the tone slightly playful and memorable

IMPORTANT: Respond in valid JSON format as follows:
\`\`\`json
[
  {
    "id": 123,
    "word": "example",
    "pos": "noun",
    "shortDefinition": "A thing that shows what something is like",
    "owadPhrases": [
      "a clear model",
      "a teaching tool"
    ]
  }
]
\`\`\`

## Words to Define

`;

  // Filter out words with no definitions and warn about them
  const wordsWithoutDefs = words.filter(w => !w.originalDefinitions || w.originalDefinitions.length === 0);
  if (wordsWithoutDefs.length > 0) {
    const wordList = wordsWithoutDefs.map(w => w.word).join(", ");
    console.warn(`Warning: ${wordsWithoutDefs.length} words have no original definitions: ${wordList}`);
  }

  words.forEach((word, index) => {
    output += `### ${index + 1}. ${word.word} (${word.pos}) [ID: ${word.id}]\n`;
    
    if (word.originalDefinitions && word.originalDefinitions.length > 0) {
      output += `WordNet meanings (ordered by frequency):\n`;
      word.originalDefinitions.forEach((def, i) => {
        // Clean up the definition for better readability
        const cleanDef = def.replace(/\(.*?\)/g, '').trim();
        output += `${i + 1}. ${cleanDef}\n`;
      });
    } else {
      output += `(No WordNet meanings available. Create a clear, simple definition based on common usage.)\n`;
    }
    
    output += `\nRequirements for "${word.word}":\n`;
    output += `1. Main definition:\n`;
    output += `   - Clear and engaging (max 12 words)\n`;
    output += `   - Focus on most common meaning from WordNet\n`;
    output += `   - Use everyday language\n`;
    output += `2. OWAD phrases:\n`;
    output += `   - Create TWO phrases that maintain the word's part of speech\n`;
    output += `   - For NOUNS: Start with "a/an"\n`;
    output += `   - For VERBS: Start with "to"\n`;
    output += `   - For ADJECTIVES: Use describing form\n`;
    output += `   - Keep meaning clear and direct\n\n`;
  });

  output += `\nFINAL CHECKLIST:\n`;
  output += `✓ Language is simple and engaging\n`;
  output += `✓ OWAD phrases are catchy and memorable\n`;
  output += `✓ Everything connects to everyday experiences\n`;
  output += `✓ All IDs and words match exactly\n`;

  return output;
}

/**
 * Main function
 */
async function main() {
  console.log('\n=== Word Definition Preparation ===');
  console.log('Starting with batch size:', argv.limit);

  const progress = loadProgress();
  const words = await getWordsNeedingDefinitions(argv.limit);
  
  if (words.length === 0) {
    console.log('No more words to process!');
    return;
  }

  console.log('\nVerifying word IDs...');
  const verifiedWords = await verifyWordIds(words);
  
  console.log('\nFetching original definitions in batches...');
  const wordsWithDefs = [];
  for (let i = 0; i < verifiedWords.length; i += argv['batch-size']) {
    const batch = verifiedWords.slice(i, i + argv['batch-size']);
    console.log(`Processing batch ${Math.floor(i/argv['batch-size'] + 1)}/${Math.ceil(verifiedWords.length/argv['batch-size'])}...`);
    const batchWithDefs = await getDefinitionsForBatch(batch);
    wordsWithDefs.push(...batchWithDefs);
  }

  const formattedText = formatWordsForClaude(wordsWithDefs);
  fs.writeFileSync(argv.output, formattedText);
  
  // Save word-to-id mapping
  const wordIdMap = wordsWithDefs.map(({ id, word, pos }) => ({ id, word, pos }));
  fs.writeFileSync('word-id-map.json', JSON.stringify(wordIdMap, null, 2));

  // Update progress
  progress.lastProcessedId = words[words.length - 1].id;
  progress.processedCount += words.length;
  saveProgress(progress);

  console.log('\n=== Batch Complete! ===');
  console.log(`- Processed ${words.length} words`);
  console.log(`- ID range: ${words[0].id} to ${words[words.length-1].id}`);
  console.log(`- Total progress: ${progress.processedCount}/${progress.totalWords} words (${Math.floor(100 * progress.processedCount / progress.totalWords)}%)`);
  console.log(`- Words formatted for Claude saved to: ${argv.output}`);
  console.log(`- Word-to-ID mapping saved to: word-id-map.json`);
  console.log(`- Progress saved to: ${PROGRESS_FILE}`);
  console.log('\nNext steps:');
  console.log('1. Upload words-for-definition.txt to Claude');
  console.log('2. Save Claude\'s output to definitions.json');
  console.log('3. Run: node update-definitions.js --input definitions.json');
}

// Run the script with proper error handling
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});