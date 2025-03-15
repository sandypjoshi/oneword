/**
 * WordNet Parser for OneWord App
 * 
 * This script parses WordNet 3.1 data files and prepares them for import into Supabase.
 * It extracts words, definitions, and relationships to populate the following tables:
 * - words: Contains word forms and metadata
 * - synsets: Contains synset definitions and part of speech
 * - word_synsets: Maps words to their synsets
 * - relationships: Contains semantic relationships between synsets
 * - domains: Contains lexical domain information
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');
const natural = require('natural');
const sylvester = new natural.SyllableCounter();

// Configuration
const WORDNET_DIR = path.join(__dirname, '../wordnet-data/dict');
const BATCH_SIZE = 1000; // Number of records to insert in a batch

// Data files
const FILES = {
  NOUN: {
    index: path.join(WORDNET_DIR, 'index.noun'),
    data: path.join(WORDNET_DIR, 'data.noun'),
    pos: 'n'
  },
  VERB: {
    index: path.join(WORDNET_DIR, 'index.verb'),
    data: path.join(WORDNET_DIR, 'data.verb'),
    pos: 'v'
  },
  ADJ: {
    index: path.join(WORDNET_DIR, 'index.adj'),
    data: path.join(WORDNET_DIR, 'data.adj'),
    pos: 'a'
  },
  ADV: {
    index: path.join(WORDNET_DIR, 'index.adv'),
    data: path.join(WORDNET_DIR, 'data.adv'),
    pos: 'r'
  }
};

// Lexical domain files
const DOMAIN_DIR = path.join(WORDNET_DIR, 'dbfiles');

// Supabase config - Initialize from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Data structures
const synsets = new Map(); // Map of synset_id -> synset data
const words = new Map();   // Map of word -> word data
const wordSynsets = [];    // Array of word-synset mappings
const relationships = [];  // Array of relationships
const domains = new Map(); // Map of domain_name -> domain data

/**
 * Calculate word difficulty score based on multiple factors
 * @param {string} word - The word to calculate difficulty for
 * @param {object} metadata - Additional metadata about the word
 * @returns {number} - Difficulty score between 0 and 1
 */
function calculateDifficulty(word, metadata = {}) {
  const LENGTH_WEIGHT = 0.3;
  const SYLLABLE_WEIGHT = 0.25;
  const POLYSEMY_WEIGHT = 0.2;
  const DEPTH_WEIGHT = 0.15;
  const DOMAIN_WEIGHT = 0.1;
  
  // Normalize length (1-20+ characters)
  const lengthScore = Math.min(word.length / 15, 1);
  
  // Count syllables
  const syllables = sylvester.countSyllables(word);
  const syllableScore = Math.min(syllables / 7, 1);
  
  // Get polysemy count (number of different meanings)
  const polysemyCount = metadata.polysemy || 1;
  const polysemyScore = Math.min((polysemyCount - 1) / 15, 1);
  
  // Hierarchy depth (if available)
  const depthScore = metadata.depth ? Math.min(metadata.depth / 10, 1) : 0.5;
  
  // Domain specificity (general domains are easier than specific ones)
  const domainScore = metadata.domainSpecificity || 0.5;
  
  // Calculate weighted score
  const score = (
    LENGTH_WEIGHT * lengthScore +
    SYLLABLE_WEIGHT * syllableScore +
    POLYSEMY_WEIGHT * polysemyScore +
    DEPTH_WEIGHT * depthScore +
    DOMAIN_WEIGHT * domainScore
  );
  
  return Math.min(Math.max(score, 0), 1); // Ensure between 0 and 1
}

/**
 * Assign difficulty level based on score
 * @param {number} score - Difficulty score between 0 and 1
 * @returns {string} - Difficulty level: 'beginner', 'intermediate', or 'advanced'
 */
function assignDifficultyLevel(score) {
  if (score < 0.33) return 'beginner';
  if (score < 0.66) return 'intermediate';
  return 'advanced';
}

/**
 * Parse a synset data line from WordNet data files
 * @param {string} line - Line from data file
 * @param {string} pos - Part of speech
 * @returns {object|null} - Parsed synset or null if license text
 */
function parseSynsetLine(line, pos) {
  // Skip license text and empty lines
  if (!line || line.startsWith(' ') || line.startsWith('\t') || !line.includes('|')) {
    return null;
  }
  
  try {
    // Format: synset_offset lex_filenum part_of_speech w_cnt word lex_id [word lex_id...] p_cnt [ptr...] | gloss
    const mainParts = line.split('|');
    if (mainParts.length < 2) return null;
    
    const synsetData = mainParts[0].trim();
    const gloss = mainParts[1].trim();
    
    const parts = synsetData.split(/\s+/);
    const synsetId = parts[0];
    const lexFilenum = parts[1];
    const partOfSpeech = parts[2];
    
    // Get words in this synset
    const wordCount = parseInt(parts[3], 16); // hex
    const synsetWords = [];
    
    let currentIndex = 4;
    for (let i = 0; i < wordCount; i++) {
      const wordText = parts[currentIndex];
      currentIndex += 2; // Skip lex_id
      synsetWords.push(wordText.replace('_', ' '));
    }
    
    // Domain information
    let domain = 'general';
    if (lexFilenum >= 0 && lexFilenum <= 45) {
      // Map lexical file numbers to domains
      const domains = [
        'noun.Tops', 'noun.act', 'noun.animal', 'noun.artifact', 
        'noun.attribute', 'noun.body', 'noun.cognition', 'noun.communication',
        'noun.event', 'noun.feeling', 'noun.food', 'noun.group',
        'noun.location', 'noun.motive', 'noun.object', 'noun.person',
        'noun.phenomenon', 'noun.plant', 'noun.possession', 'noun.process',
        'noun.quantity', 'noun.relation', 'noun.shape', 'noun.state',
        'noun.substance', 'noun.time', 'verb.body', 'verb.change',
        'verb.cognition', 'verb.communication', 'verb.competition', 'verb.consumption',
        'verb.contact', 'verb.creation', 'verb.emotion', 'verb.motion',
        'verb.perception', 'verb.possession', 'verb.social', 'verb.stative',
        'verb.weather', 'adj.all', 'adj.pert', 'adj.ppl',
        'adv.all'
      ];
      domain = domains[lexFilenum];
    }
    
    // Return parsed data
    return {
      id: synsetId,
      pos: partOfSpeech,
      definition: gloss,
      words: synsetWords,
      domain
    };
  } catch (error) {
    console.error(`Error parsing synset line: ${line}`);
    console.error(error);
    return null;
  }
}

/**
 * Parse a line from the index file
 * @param {string} line - Line from index file
 * @param {string} pos - Part of speech
 * @returns {object|null} - Parsed word data or null if license text
 */
function parseIndexLine(line, pos) {
  // Skip license text
  if (!line || line.startsWith(' ') || line.startsWith('\t') || !line.includes(' ')) {
    return null;
  }
  
  try {
    // Format: lemma pos synset_cnt p_cnt [ptr_symbol...] sense_cnt tagsense_cnt synset_offset [synset_offset...]
    const parts = line.split(/\s+/);
    if (parts.length < 6) return null;
    
    const lemma = parts[0];
    const partOfSpeech = parts[1];
    const synsetCount = parseInt(parts[2]);
    
    // Skip some positional parts to get to sense count and synset offsets
    let currentIndex = 3;
    const ptrCount = parseInt(parts[currentIndex]);
    currentIndex += ptrCount + 1;
    
    const senseCount = parseInt(parts[currentIndex]);
    currentIndex += 1;
    const tagSenseCount = parseInt(parts[currentIndex]);
    currentIndex += 1;
    
    // Get synset offsets
    const synsetOffsets = [];
    for (let i = currentIndex; i < parts.length; i++) {
      synsetOffsets.push(parts[i]);
    }
    
    return {
      lemma: lemma.replace('_', ' '),
      pos: partOfSpeech,
      synset_count: synsetCount,
      sense_count: senseCount,
      tagsense_count: tagSenseCount,
      synset_offsets: synsetOffsets,
      polysemy: synsetCount // Number of different meanings
    };
  } catch (error) {
    console.error(`Error parsing index line: ${line}`);
    console.error(error);
    return null;
  }
}

/**
 * Parse relationship pointers from synset data
 * @param {string} line - Synset data line
 * @returns {Array} - Array of relationship objects
 */
function parseRelationships(line, fromSynsetId) {
  const relationships = [];
  
  // Skip license text and empty lines
  if (!line || line.startsWith(' ') || line.startsWith('\t') || !line.includes('|')) {
    return relationships;
  }
  
  try {
    const mainParts = line.split('|');
    const synsetData = mainParts[0].trim();
    const parts = synsetData.split(/\s+/);
    
    // Parse basic synset data to get to the pointers
    const synsetId = parts[0];
    const wordCount = parseInt(parts[3], 16); // hex
    
    let currentIndex = 4 + (wordCount * 2); // Skip words and lex_ids
    const ptrCount = parseInt(parts[currentIndex]); // Number of pointers
    currentIndex += 1;
    
    // Parse each pointer
    for (let i = 0; i < ptrCount; i++) {
      const ptrSymbol = parts[currentIndex]; // Relationship type
      const toSynsetId = parts[currentIndex + 1]; // Target synset
      
      // Map pointer symbols to relationship types
      const relationshipTypes = {
        '@': 'hypernym',        // Hypernym (is-a)
        '~': 'hyponym',         // Hyponym (specific type)
        '#m': 'member_holonym', // Member holonym
        '#s': 'substance_holonym', // Substance holonym
        '#p': 'part_holonym',   // Part holonym
        '%m': 'member_meronym', // Member meronym
        '%s': 'substance_meronym', // Substance meronym
        '%p': 'part_meronym',   // Part meronym
        '=': 'attribute',       // Attribute
        '+': 'derivation',      // Derivationally related form
        ';': 'domain',          // Domain
        '-': 'member',          // Member
        '*': 'entailment',      // Entailment
        '>': 'cause',           // Cause
        '^': 'also_see',        // Also see
        '$': 'verb_group',      // Verb Group
        '&': 'similar_to',      // Similar to
        '<': 'participle',      // Participle of verb
        '!': 'antonym',         // Antonym
      };
      
      const relType = relationshipTypes[ptrSymbol] || 'related';
      
      relationships.push({
        from_synset_id: fromSynsetId,
        to_synset_id: toSynsetId,
        relationship_type: relType
      });
      
      currentIndex += 4; // Move to the next pointer
    }
  } catch (error) {
    console.error(`Error parsing relationships for synset ${fromSynsetId}`);
    console.error(error);
  }
  
  return relationships;
}

/**
 * Process a synset data file
 * @param {string} filePath - Path to data file
 * @param {string} pos - Part of speech
 */
async function processSynsetFile(filePath, pos) {
  console.log(`Processing synset file: ${filePath}`);
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  for await (const line of rl) {
    const synset = parseSynsetLine(line, pos);
    if (synset) {
      synsets.set(synset.id, {
        id: synset.id,
        definition: synset.definition,
        pos: synset.pos,
        domain: synset.domain
      });
      
      // Add words from this synset to the word_synsets mapping
      synset.words.forEach(word => {
        wordSynsets.push({
          word: word,
          synset_id: synset.id
        });
        
        // Add word to words map if not already there
        if (!words.has(word)) {
          words.set(word, {
            word: word,
            pos: synset.pos
          });
        }
      });
      
      // Parse relationships
      const rels = parseRelationships(line, synset.id);
      relationships.push(...rels);
    }
  }
}

/**
 * Process an index file
 * @param {string} filePath - Path to index file
 * @param {string} pos - Part of speech
 */
async function processIndexFile(filePath, pos) {
  console.log(`Processing index file: ${filePath}`);
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  for await (const line of rl) {
    const wordData = parseIndexLine(line, pos);
    if (wordData) {
      const existing = words.get(wordData.lemma);
      if (existing) {
        // Update with additional information
        words.set(wordData.lemma, {
          ...existing,
          polysemy: (existing.polysemy || 0) + wordData.polysemy
        });
      } else {
        words.set(wordData.lemma, {
          word: wordData.lemma,
          pos: wordData.pos,
          polysemy: wordData.polysemy
        });
      }
    }
  }
}

/**
 * Process domain files
 */
async function processDomainFiles() {
  console.log('Processing domain files');
  
  const domainFiles = fs.readdirSync(DOMAIN_DIR).filter(file => 
    file.startsWith('noun.') || 
    file.startsWith('verb.') || 
    file.startsWith('adj.') || 
    file.startsWith('adv.')
  );
  
  for (const file of domainFiles) {
    const domain = file.replace('.', '_');
    const filePath = path.join(DOMAIN_DIR, file);
    
    domains.set(domain, {
      name: domain,
      description: `Words in the ${domain} category`
    });
    
    // Further processing of domain files could be done here
    // to extract words belonging to each domain
  }
}

/**
 * Calculate and enrich word data with difficulty scores
 */
function calculateDifficultyScores() {
  console.log('Calculating difficulty scores');
  
  for (const [wordText, wordData] of words.entries()) {
    const syllables = sylvester.countSyllables(wordText);
    
    // Additional metadata for difficulty calculation
    const metadata = {
      polysemy: wordData.polysemy || 1,
      syllables: syllables,
      // Add more if available
    };
    
    const difficultyScore = calculateDifficulty(wordText, metadata);
    const difficultyLevel = assignDifficultyLevel(difficultyScore);
    
    // Update word data with difficulty information
    words.set(wordText, {
      ...wordData,
      syllables,
      difficulty_score: difficultyScore,
      difficulty_level: difficultyLevel
    });
  }
}

/**
 * Insert data into Supabase in batches
 * @param {string} table - Table name
 * @param {Array} data - Array of records to insert
 */
async function batchInsert(table, data) {
  console.log(`Inserting ${data.length} records into ${table} table`);
  
  // Process in batches
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    
    // Insert batch
    const { error } = await supabase
      .from(table)
      .insert(batch);
    
    if (error) {
      console.error(`Error inserting batch into ${table}:`, error);
      return false;
    }
    
    console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(data.length / BATCH_SIZE)} into ${table}`);
  }
  
  return true;
}

/**
 * Main function to process WordNet data and insert into Supabase
 */
async function main() {
  try {
    console.log('Starting WordNet data processing');
    
    // Process data files
    for (const [posKey, fileInfo] of Object.entries(FILES)) {
      await processSynsetFile(fileInfo.data, fileInfo.pos);
      await processIndexFile(fileInfo.index, fileInfo.pos);
    }
    
    // Process domain files
    await processDomainFiles();
    
    // Calculate difficulty scores
    calculateDifficultyScores();
    
    console.log(`Processed ${synsets.size} synsets`);
    console.log(`Processed ${words.size} words`);
    console.log(`Processed ${wordSynsets.length} word-synset mappings`);
    console.log(`Processed ${relationships.length} relationships`);
    console.log(`Processed ${domains.size} domains`);
    
    // Export data to JSON files for debugging and backup
    const outputDir = path.join(__dirname, '../wordnet-processed');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'synsets.json'), 
      JSON.stringify(Array.from(synsets.values()), null, 2)
    );
    
    fs.writeFileSync(
      path.join(outputDir, 'words.json'), 
      JSON.stringify(Array.from(words.values()), null, 2)
    );
    
    fs.writeFileSync(
      path.join(outputDir, 'word-synsets.json'), 
      JSON.stringify(wordSynsets, null, 2)
    );
    
    fs.writeFileSync(
      path.join(outputDir, 'relationships.json'), 
      JSON.stringify(relationships, null, 2)
    );
    
    fs.writeFileSync(
      path.join(outputDir, 'domains.json'), 
      JSON.stringify(Array.from(domains.values()), null, 2)
    );
    
    console.log('Exported processed data to JSON files');
    
    // If Supabase credentials are available, insert data
    if (supabaseUrl && supabaseAnonKey) {
      console.log('Inserting data into Supabase');
      
      // Insert domains first (fewer records)
      await batchInsert('domains', Array.from(domains.values()));
      
      // Insert synsets
      await batchInsert('synsets', Array.from(synsets.values()));
      
      // Insert words
      await batchInsert('words', Array.from(words.values()));
      
      // Insert word_synsets mappings
      await batchInsert('word_synsets', wordSynsets);
      
      // Insert relationships
      await batchInsert('relationships', relationships);
      
      console.log('Successfully inserted all data into Supabase');
    } else {
      console.log('Supabase credentials not found. Data was exported to JSON files only.');
      console.log('To import data into Supabase, set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
    }
    
    console.log('WordNet processing complete');
  } catch (error) {
    console.error('Error processing WordNet data:', error);
  }
}

// Run the main function
main().catch(console.error); 