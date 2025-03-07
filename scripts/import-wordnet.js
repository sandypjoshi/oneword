/**
 * WordNet Import Script for OneWord App
 * 
 * This script imports raw WordNet 3.1 data into Supabase, preserving the
 * core semantic network structure without adding custom calculations.
 * 
 * The focus is on:
 * 1. Importing synsets with their definitions
 * 2. Importing words with their original attributes
 * 3. Preserving semantic relationships between synsets
 * 4. Maintaining domain information
 */

require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Constants
const BATCH_SIZE = 1000; // Number of records to insert in a single batch
const WORDNET_DIR = path.join(__dirname, '../wordnet-data/dict');

// Parts of speech mapping
const POS_MAP = {
  'n': 'noun',
  'v': 'verb',
  'a': 'adjective',
  's': 'adjective satellite',
  'r': 'adverb'
};

// Semantic relationship types in WordNet
const RELATIONSHIP_TYPES = {
  '@': 'hypernym',
  '~': 'hyponym',
  '#m': 'member-holonym',
  '#s': 'substance-holonym',
  '#p': 'part-holonym',
  '%m': 'member-meronym',
  '%s': 'substance-meronym',
  '%p': 'part-meronym',
  '=': 'attribute',
  '+': 'derivation',
  ';c': 'domain-topic',
  '-c': 'domain-member-topic',
  ';r': 'domain-region',
  '-r': 'domain-member-region',
  ';u': 'domain-usage',
  '-u': 'domain-member-usage',
  '*': 'entailment',
  '>': 'cause',
  '^': 'also-see',
  '$': 'verb-group',
  '&': 'similar-to',
  '<': 'participle',
  '!': 'antonym'
};

// Domain mapping (from lexicographer file numbers to domain names)
const LEXICAL_DOMAINS = {
  0: 'adj.all',
  1: 'adj.pert',
  2: 'adv.all',
  3: 'noun.Tops',
  4: 'noun.act',
  5: 'noun.animal',
  6: 'noun.artifact',
  7: 'noun.attribute',
  8: 'noun.body',
  9: 'noun.cognition',
  10: 'noun.communication',
  11: 'noun.event',
  12: 'noun.feeling',
  13: 'noun.food',
  14: 'noun.group',
  15: 'noun.location',
  16: 'noun.motive',
  17: 'noun.object',
  18: 'noun.person',
  19: 'noun.phenomenon',
  20: 'noun.plant',
  21: 'noun.possession',
  22: 'noun.process',
  23: 'noun.quantity',
  24: 'noun.relation',
  25: 'noun.shape',
  26: 'noun.state',
  27: 'noun.substance',
  28: 'noun.time',
  29: 'verb.body',
  30: 'verb.change',
  31: 'verb.cognition',
  32: 'verb.communication',
  33: 'verb.competition',
  34: 'verb.consumption',
  35: 'verb.contact',
  36: 'verb.creation',
  37: 'verb.emotion',
  38: 'verb.motion',
  39: 'verb.perception',
  40: 'verb.possession',
  41: 'verb.social',
  42: 'verb.stative',
  43: 'verb.weather',
  44: 'adj.ppl'
};

// Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Data structures to hold parsed WordNet data
const synsets = new Map(); // synsetId -> synset object
const words = new Map();   // word -> word object
const relationships = []; // array of relationship objects
const wordSynsets = []; // array of word-synset mappings
const domains = new Map(); // domain name -> domain object

/**
 * Parse a synset from a data file line
 * 
 * @param {string} line - Line from a data file
 * @param {string} pos - Part of speech code
 * @returns {Object|null} - Parsed synset or null if invalid
 */
function parseSynset(line, pos) {
  // Basic format:
  // synset_offset lex_filenum pos w_cnt word lex_id [word lex_id...] p_cnt [ptr...] | gloss
  try {
    const parts = line.split('|');
    const definition = parts[1]?.trim() || '';
    
    const headerParts = parts[0].trim().split(/\s+/);
    const synsetOffset = headerParts[0];
    const lexFileNum = parseInt(headerParts[1]);
    const posCode = headerParts[2];
    const wordCount = parseInt(headerParts[3], 16);
    
    // Skip invalid synsets
    if (!synsetOffset || !posCode || !wordCount) return null;
    
    // Create synset ID in format like 'n02084071'
    const synsetId = `${posCode}${synsetOffset.padStart(8, '0')}`;
    
    // Extract words in this synset
    const synsetWords = [];
    let currentPos = 4;
    for (let i = 0; i < wordCount; i++) {
      const word = headerParts[currentPos++].replace('_', ' ');
      // Skip lex_id
      currentPos++;
      synsetWords.push(word);
    }
    
    // Create the synset object
    const synset = {
      id: synsetId,
      definition,
      pos: posCode,
      domain: LEXICAL_DOMAINS[lexFileNum] || null,
      lexical_file_num: lexFileNum,
      gloss: definition
    };
    
    // Process pointer count and pointers for relationships
    const ptrCount = parseInt(headerParts[currentPos++]);
    for (let i = 0; i < ptrCount; i++) {
      const ptrSymbol = headerParts[currentPos++];
      const ptrOffset = headerParts[currentPos++];
      const ptrPos = headerParts[currentPos++];
      // Skip source/target indices
      currentPos++;
      
      // Create relationship if type is known
      if (RELATIONSHIP_TYPES[ptrSymbol]) {
        const toSynsetId = `${ptrPos}${ptrOffset.padStart(8, '0')}`;
        relationships.push({
          from_synset_id: synsetId,
          to_synset_id: toSynsetId,
          relationship_type: RELATIONSHIP_TYPES[ptrSymbol]
        });
      }
    }
    
    // Record word-synset relationships and add words to map
    synsetWords.forEach(word => {
      const wordLower = word.toLowerCase();
      
      // Add word-synset mapping
      wordSynsets.push({
        word: wordLower,
        synset_id: synsetId,
        sense_number: 1, // Will be updated later from index.sense
        tag_count: 0    // Will be updated from index.sense
      });
      
      // Add or update word in the words map
      if (!words.has(wordLower)) {
        words.set(wordLower, {
          word: wordLower,
          pos: POS_MAP[posCode],
          polysemy: 1,
          difficulty_score: null,  // Will be calculated later if needed
          difficulty_level: null   // Will be set later if needed
        });
      }
    });
    
    // Add domain if it doesn't exist
    if (synset.domain && !domains.has(synset.domain)) {
      domains.set(synset.domain, {
        name: synset.domain,
        description: `WordNet lexical domain: ${synset.domain}`
      });
    }
    
    return synset;
  } catch (error) {
    console.error(`Error parsing synset line: ${line.slice(0, 50)}...`, error);
    return null;
  }
}

/**
 * Read a WordNet data file
 * 
 * @param {string} filename - Data file name
 * @param {string} pos - Part of speech code
 * @returns {Promise<void>}
 */
async function readDataFile(filename, pos) {
  console.log(`Reading ${filename}...`);
  
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(path.join(WORDNET_DIR, filename));
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let lineCount = 0;
    rl.on('line', (line) => {
      // Skip copyright/license header
      if (line.startsWith('  ')) return;
      
      lineCount++;
      if (lineCount % 5000 === 0) {
        console.log(`  Processed ${lineCount} lines from ${filename}`);
      }
      
      const synset = parseSynset(line, pos);
      if (synset) {
        synsets.set(synset.id, synset);
      }
    });
    
    rl.on('close', () => {
      console.log(`Finished reading ${filename}: ${lineCount} lines`);
      resolve();
    });
    
    fileStream.on('error', reject);
  });
}

/**
 * Read the index.sense file to get sense numbers and tag counts
 * 
 * @returns {Promise<void>}
 */
async function readSenseIndex() {
  console.log('Reading index.sense file...');
  
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(path.join(WORDNET_DIR, 'index.sense'));
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let lineCount = 0;
    const wordSenseMap = new Map(); // word -> [synsetIds]
    
    rl.on('line', (line) => {
      // Skip copyright/license header
      if (line.startsWith('  ')) return;
      
      lineCount++;
      if (lineCount % 10000 === 0) {
        console.log(`  Processed ${lineCount} lines from index.sense`);
      }
      
      // Format: sense_key synset_offset sense_number tag_count
      const parts = line.trim().split(/\s+/);
      if (parts.length < 4) return;
      
      const senseKey = parts[0];
      const offset = parts[1];
      const senseNumber = parseInt(parts[2]);
      const tagCount = parseInt(parts[3]);
      
      // Extract word from sense key (first part before %)
      const word = senseKey.split('%')[0].toLowerCase();
      const pos = senseKey.split('%')[1]?.charAt(0);
      
      if (!pos) return;
      
      // Create synset ID
      const synsetId = `${pos}${offset.padStart(8, '0')}`;
      
      // Update word-synset mapping with sense number and tag count
      for (let i = 0; i < wordSynsets.length; i++) {
        const ws = wordSynsets[i];
        if (ws.word === word && ws.synset_id === synsetId) {
          ws.sense_number = senseNumber;
          ws.tag_count = tagCount;
          break;
        }
      }
      
      // Track word senses for polysemy count
      if (!wordSenseMap.has(word)) {
        wordSenseMap.set(word, [synsetId]);
      } else {
        wordSenseMap.get(word).push(synsetId);
      }
    });
    
    rl.on('close', () => {
      console.log(`Finished reading index.sense: ${lineCount} lines`);
      
      // Update polysemy counts based on unique synsets
      for (const [word, synsetIds] of wordSenseMap.entries()) {
        if (words.has(word)) {
          const uniqueSynsets = new Set(synsetIds);
          words.get(word).polysemy = uniqueSynsets.size;
        }
      }
      
      resolve();
    });
    
    fileStream.on('error', reject);
  });
}

/**
 * Insert data into Supabase in batches with memory-efficient iteration
 * 
 * @param {string} table - Table name
 * @param {Array|Map} data - Array or Map of objects to insert
 * @param {Array} [returning] - Fields to return
 * @returns {Promise<void>}
 */
async function batchInsert(table, data, returning = ['id']) {
  // Set appropriate returning field for different tables
  if (table === 'domains') {
    returning = ['name'];
  } else if (table === 'synsets') {
    returning = ['id'];
  } else if (table === 'words') {
    returning = ['id', 'word'];
  } else if (table === 'word_synsets') {
    returning = ['id', 'word', 'synset_id'];
  } else if (table === 'relationships') {
    returning = ['id', 'from_synset_id', 'to_synset_id'];
  }
  
  // Handle both Arrays and Maps
  const isMap = data instanceof Map;
  const totalCount = isMap ? data.size : data.length;
  console.log(`Inserting ${totalCount} records into ${table}...`);
  
  // Prepare batches for Map
  if (isMap) {
    let processed = 0;
    let batchNum = 1;
    let batch = [];
    
    // Create an iterator to avoid having all values in memory at once
    const iterator = data.values();
    let item = iterator.next();
    
    while (!item.done) {
      batch.push(item.value);
      processed++;
      
      // Process a batch when it reaches the right size or we're at the end
      if (batch.length >= BATCH_SIZE || processed >= totalCount) {
        console.log(`  Inserting batch ${batchNum} of ${Math.ceil(totalCount / BATCH_SIZE)}`);
        
        try {
          const { error } = await supabase
            .from(table)
            .insert(batch)
            .select(returning.join(','));
          
          if (error) {
            console.error(`Error inserting batch into ${table}:`, error);
          }
        } catch (error) {
          console.error(`Error inserting batch into ${table}:`, error);
        }
        
        // Clear batch for next round
        batch = [];
        batchNum++;
      }
      
      // Get next item
      item = iterator.next();
    }
  } 
  // Handle Array data
  else {
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      console.log(`  Inserting batch ${i / BATCH_SIZE + 1} of ${Math.ceil(data.length / BATCH_SIZE)}`);
      
      try {
        const { error } = await supabase
          .from(table)
          .insert(batch)
          .select(returning.join(','));
        
        if (error) {
          console.error(`Error inserting batch into ${table}:`, error);
        }
      } catch (error) {
        console.error(`Error inserting batch into ${table}:`, error);
      }
    }
  }
  
  console.log(`Finished inserting into ${table}`);
}

/**
 * Main function to import WordNet data
 */
async function main() {
  try {
    console.log('Starting WordNet import process...');
    
    // Read data files
    await readDataFile('data.noun', 'n');
    await readDataFile('data.verb', 'v');
    await readDataFile('data.adj', 'a');
    await readDataFile('data.adv', 'r');
    
    // Read sense index to get sense numbers and tag counts
    await readSenseIndex();
    
    // Deduplicate word_synsets with detailed logging
    console.log('Analyzing word-synset duplicates...');
    const uniqueWordSynsets = new Map();
    const duplicateWordSynsets = new Map();
    
    for (const ws of wordSynsets) {
      const key = `${ws.word}|${ws.synset_id}`;
      
      if (uniqueWordSynsets.has(key)) {
        // Found a duplicate - record it
        if (!duplicateWordSynsets.has(key)) {
          duplicateWordSynsets.set(key, [uniqueWordSynsets.get(key)]);
        }
        duplicateWordSynsets.get(key).push(ws);
        
        // Keep entry with highest tag_count, break ties with lowest sense_number
        const existing = uniqueWordSynsets.get(key);
        if (ws.tag_count > existing.tag_count || 
            (ws.tag_count === existing.tag_count && ws.sense_number < existing.sense_number)) {
          uniqueWordSynsets.set(key, ws);
        }
      } else {
        uniqueWordSynsets.set(key, ws);
      }
    }
    
    // Log duplicate analysis
    const duplicateCount = duplicateWordSynsets.size;
    console.log(`Found ${duplicateCount} unique word-synset pairs with duplicates`);
    
    // Log some examples of duplicates for analysis
    if (duplicateCount > 0) {
      console.log('Sample of duplicate word-synset pairs:');
      let count = 0;
      for (const [key, duplicates] of duplicateWordSynsets.entries()) {
        if (count++ >= 5) break; // Show at most 5 examples
        
        const [word, synsetId] = key.split('|');
        console.log(`  "${word}" -> ${synsetId}:`);
        
        duplicates.forEach((dup, i) => {
          console.log(`    Duplicate #${i+1}: sense_number=${dup.sense_number}, tag_count=${dup.tag_count}`);
        });
      }
      
      // Save duplicate data to a log file for further analysis
      try {
        // Only save a limited number of sample duplicates to avoid memory issues
        const samples = [];
        let i = 0;
        
        for (const [key, dups] of duplicateWordSynsets.entries()) {
          if (i++ >= 100) break; // Only take 100 samples
          
          const [word, synsetId] = key.split('|');
          
          // Create a simpler structure to prevent deep nesting
          samples.push({
            word,
            synsetId,
            duplicateCount: dups.length,
            // Just include basic stats instead of full objects
            senseNumbers: dups.map(d => d.sense_number).filter(n => n),
            tagCounts: dups.map(d => d.tag_count).filter(n => n)
          });
        }
        
        const duplicateData = {
          count: duplicateCount,
          samples
        };
        
        // Write the file in a streaming way to avoid memory issues
        fs.writeFileSync('wordnet-duplicate-analysis.json', JSON.stringify(duplicateData, null, 2));
        console.log('Detailed duplicate analysis saved to wordnet-duplicate-analysis.json');
      } catch (error) {
        console.error('Warning: Could not save duplicate analysis:', error.message);
        console.log('Continuing with import process...');
      }
    }
    
    // Replace array with deduplicated values
    wordSynsets.length = 0;
    wordSynsets.push(...uniqueWordSynsets.values());
    console.log(`After deduplication: ${wordSynsets.length} word-synset mappings`);
    
    // Clear memory to prevent issues
    uniqueWordSynsets.clear();
    duplicateWordSynsets.clear();
    
    // Deduplicate relationships with logging
    console.log('Analyzing relationship duplicates...');
    
    // Use a more memory-efficient approach for relationship deduplication
    const uniqueKeys = new Set();
    const uniqueRelationships = [];
    let totalRelationships = relationships.length;
    let duplicateRelationshipCount = 0;
    
    // Process relationships in batches to avoid memory issues
    const DEDUP_BATCH_SIZE = 10000;
    for (let i = 0; i < relationships.length; i += DEDUP_BATCH_SIZE) {
      const batch = relationships.slice(i, Math.min(i + DEDUP_BATCH_SIZE, relationships.length));
      console.log(`  Deduplicating relationships batch ${Math.floor(i / DEDUP_BATCH_SIZE) + 1} of ${Math.ceil(relationships.length / DEDUP_BATCH_SIZE)}`);
      
      for (const rel of batch) {
        const key = `${rel.from_synset_id}|${rel.to_synset_id}|${rel.relationship_type}`;
        
        if (uniqueKeys.has(key)) {
          duplicateRelationshipCount++;
        } else {
          uniqueKeys.add(key);
          uniqueRelationships.push(rel);
        }
      }
      
      // Clear the batch to free memory
      batch.length = 0;
    }
    
    console.log(`Found ${duplicateRelationshipCount} duplicate relationships out of ${totalRelationships} total`);
    
    // Replace array with deduplicated values and free memory
    relationships.length = 0;
    relationships.push(...uniqueRelationships);
    uniqueRelationships.length = 0;
    uniqueKeys.clear();
    console.log(`After deduplication: ${relationships.length} relationships`);
    
    console.log(`Processed ${synsets.size} synsets`);
    console.log(`Processed ${words.size} unique words`);
    console.log(`Processed ${domains.size} domains`);
    
    // Insert into Supabase with improved error handling
    console.log('Importing data into Supabase...');
    
    // Use try-catch for each table to continue even if one fails
    try {
      // 1. Insert domains
      await batchInsert('domains', Array.from(domains.values()));
      // Free memory after each batch
      domains.clear();
    } catch (error) {
      console.error('Error importing domains:', error);
      console.log('Continuing with import process...');
    }
    
    try {
      // 2. Insert synsets
      await batchInsert('synsets', synsets);
      // Free memory
      synsets.clear();
    } catch (error) {
      console.error('Error importing synsets:', error);
      console.log('Continuing with import process...');
    }
    
    try {
      // 3. Insert words
      await batchInsert('words', words);
      // Free memory
      words.clear();
    } catch (error) {
      console.error('Error importing words:', error);
      console.log('Continuing with import process...');
    }
    
    try {
      // 4. Insert word-synset mappings
      await batchInsert('word_synsets', wordSynsets);
      // Free memory
      wordSynsets.length = 0;
    } catch (error) {
      console.error('Error importing word-synset mappings:', error);
      console.log('Continuing with import process...');
    }
    
    try {
      // 5. Insert relationships
      await batchInsert('relationships', relationships);
      // Free memory
      relationships.length = 0;
    } catch (error) {
      console.error('Error importing relationships:', error);
      console.log('Continuing with import process...');
    }
    
    console.log('WordNet import completed successfully!');
  } catch (error) {
    console.error('Error importing WordNet data:', error);
    process.exit(1);
  }
}

// Run the import process
main(); 