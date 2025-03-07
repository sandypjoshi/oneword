/**
 * WordNet Relationships Import Script (Final Fixed Version)
 * 
 * This script properly extracts all semantic relationships between synsets
 * from the WordNet data. The previous script had issues with the pointer parsing.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

// ===== Constants =====
const BATCH_SIZE = 5000;
const WORDNET_DIR = path.join(__dirname, '../wordnet-data/dict');
const LOG_FILE = path.join(__dirname, '../wordnet-relationships-import-final.log');

// Initialize logging
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
function log(message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;
  console.log(formattedMessage);
  logStream.write(formattedMessage + '\n');
}

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ===== Relationship Types =====
const RELATIONSHIP_TYPES = {
  // Noun relationships
  '@': 'hypernym',
  '~': 'hyponym',
  '#m': 'member_holonym',
  '#s': 'substance_holonym',
  '#p': 'part_holonym',
  '%m': 'member_meronym',
  '%s': 'substance_meronym',
  '%p': 'part_meronym',
  '=': 'attribute',
  '+': 'derivationally_related',
  ';c': 'domain_topic',
  '-c': 'member_of_domain_topic',
  ';r': 'domain_region',
  '-r': 'member_of_domain_region',
  ';u': 'domain_usage',
  '-u': 'member_of_domain_usage',
  
  // Verb relationships
  '*': 'entailment',
  '>': 'cause',
  '^': 'also_see',
  '$': 'verb_group',
  
  // Adjective relationships
  '!': 'antonym',
  '<': 'participle',
  '\\': 'pertainym',
  
  // Adverb relationships
};

/**
 * Process a single line from a WordNet data file and extract relationships
 * This improved version correctly handles the WordNet pointer format
 * @param {string} line - Line from a data file
 * @param {Set} validSynsets - Set of valid synset IDs
 * @returns {Array} - Array of relationship objects
 */
function extractRelationships(line, validSynsets) {
  // Skip comment lines or empty lines
  if (line.startsWith('  ') || line.trim() === '') {
    return [];
  }
  
  // Split the line at the vertical bar to separate definition
  const parts = line.split('|');
  if (parts.length < 1) {
    return [];
  }
  
  // First part contains synset info and pointers
  const synsetData = parts[0].trim();
  
  // Extract the synset offset, part of speech, and other metadata
  const synsetRegex = /^(\d{8}) (\d{2}) ([nvarsp]) (\d{2})(.*)/;
  const synsetMatch = synsetData.match(synsetRegex);
  if (!synsetMatch) {
    return [];
  }
  
  const [, offset, lexFilenum, pos, wordCount, remainder] = synsetMatch;
  
  // Create synset ID in the format used by our database (e.g., "n00001740")
  const synsetId = `${pos}${offset.padStart(8, '0')}`;
  
  // Skip processing if the source synset doesn't exist in the database
  if (!validSynsets.has(synsetId)) {
    return [];
  }
  
  // Parse all words and pointers
  const relationships = [];
  let restOfLine = remainder.trim();
  
  // Extract word count (in hex) and skip past all words
  // Format: [word_count] word1 sense_num1 word2 sense_num2 ... [ptr_count] ptrs...
  const actualWordCount = parseInt(wordCount, 16);
  for (let i = 0; i < actualWordCount; i++) {
    // Skip the word
    const wordEndPos = restOfLine.indexOf(' ');
    if (wordEndPos === -1) break;
    restOfLine = restOfLine.substring(wordEndPos + 1).trim();
    
    // Skip the sense number
    const senseEndPos = restOfLine.indexOf(' ');
    if (senseEndPos === -1) break;
    restOfLine = restOfLine.substring(senseEndPos + 1).trim();
  }
  
  // Extract pointer count (in hex)
  if (restOfLine.length < 2) {
    return relationships;
  }
  
  const ptrCountHex = restOfLine.substring(0, 2);
  const ptrCount = parseInt(ptrCountHex, 16);
  restOfLine = restOfLine.substring(2).trim();
  
  // Process each pointer
  for (let i = 0; i < ptrCount; i++) {
    // Format: pointer_symbol target_offset target_pos source/target_flags
    const ptrParts = restOfLine.split(' ', 4);
    if (ptrParts.length < 4) break;
    
    const [ptrSymbol, targetOffset, targetPos, flags] = ptrParts;
    restOfLine = restOfLine.substring(ptrParts.join(' ').length + 1).trim();
    
    // Create target synset ID
    const targetSynsetId = `${targetPos}${targetOffset.padStart(8, '0')}`;
    
    // Skip reflexive relationships (pointing to self)
    if (targetSynsetId === synsetId) continue;
    
    // Skip relationships where target synset doesn't exist
    if (!validSynsets.has(targetSynsetId)) continue;
    
    // Get relationship type
    let relType = RELATIONSHIP_TYPES[ptrSymbol];
    
    // Handle multi-character pointer symbols
    if (!relType && ptrSymbol.length > 1) {
      relType = RELATIONSHIP_TYPES[ptrSymbol.substring(0, 2)];
    }
    
    // Add the relationship if we have a valid type
    if (relType) {
      relationships.push({
        from_synset_id: synsetId,
        to_synset_id: targetSynsetId,
        relationship_type: relType
      });
    }
  }
  
  return relationships;
}

/**
 * Fetch all valid synset IDs from the database
 * @returns {Promise<Set>} - Set of valid synset IDs
 */
async function fetchValidSynsets() {
  log('Fetching all valid synset IDs from the database...');
  
  const validSynsets = new Set();
  let startIndex = 0;
  const pageSize = 10000;
  let hasMore = true;
  
  while (hasMore) {
    try {
      log(`Fetching synsets from index ${startIndex} to ${startIndex + pageSize - 1}...`);
      const { data, error } = await supabase
        .from('synsets')
        .select('id')
        .range(startIndex, startIndex + pageSize - 1);
      
      if (error) {
        log(`Error fetching synsets: ${error.message}`);
        break;
      }
      
      if (data && data.length > 0) {
        data.forEach(synset => validSynsets.add(synset.id));
        startIndex += data.length;
        log(`Fetched ${validSynsets.size} synsets so far...`);
      } else {
        hasMore = false;
      }
      
      // Avoid hitting rate limits
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (err) {
      log(`Exception fetching synsets: ${err.message}`);
      break;
    }
  }
  
  log(`Fetched ${validSynsets.size} valid synset IDs.`);
  return validSynsets;
}

/**
 * Process a WordNet data file line by line to extract relationships
 * @param {string} fileName - Data file name (e.g., 'data.noun')
 * @param {Set} validSynsets - Set of valid synset IDs
 * @returns {Promise<number>} - Number of relationships processed
 */
async function processDataFile(fileName, validSynsets) {
  const filePath = path.join(WORDNET_DIR, fileName);
  log(`Processing ${fileName}...`);
  
  // Use readline for efficient line-by-line processing
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  const relationships = [];
  let lineCount = 0;
  let relationshipsFound = 0;
  
  for await (const line of rl) {
    lineCount++;
    
    if (lineCount % 10000 === 0) {
      log(`Processed ${lineCount} lines in ${fileName}`);
    }
    
    const lineRelationships = extractRelationships(line, validSynsets);
    relationshipsFound += lineRelationships.length;
    relationships.push(...lineRelationships);
    
    // Process in batches to avoid memory issues
    if (relationships.length >= BATCH_SIZE) {
      await insertRelationshipBatch(relationships.splice(0, BATCH_SIZE));
    }
  }
  
  // Insert any remaining relationships
  if (relationships.length > 0) {
    await insertRelationshipBatch(relationships);
  }
  
  log(`Found and processed ${relationshipsFound} relationships in ${fileName} (${lineCount} lines)`);
  return relationshipsFound;
}

/**
 * Insert a batch of relationships into the database
 * @param {Array} batch - Array of relationship objects to insert
 */
async function insertRelationshipBatch(batch) {
  if (batch.length === 0) return;
  
  try {
    // Track unique relationships to avoid duplicates within this batch
    const seen = new Set();
    const uniqueBatch = [];
    
    for (const rel of batch) {
      const key = `${rel.from_synset_id}:${rel.to_synset_id}:${rel.relationship_type}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueBatch.push(rel);
      }
    }
    
    log(`Inserting batch of ${uniqueBatch.length} relationships...`);
    
    const { data, error } = await supabase
      .from('relationships')
      .insert(uniqueBatch)
      .select('id');
    
    if (error) {
      if (error.code === '23505') {  // Unique constraint violation
        log(`Some relationships were duplicate and not inserted (constraint violation)`);
      } else {
        log(`Error inserting relationships: ${error.message}`);
      }
    } else {
      log(`Successfully inserted ${data.length} relationships`);
    }
  } catch (error) {
    log(`Exception inserting relationships: ${error.message}`);
  }
}

/**
 * Main function to run the import process
 */
async function main() {
  log('Starting WordNet relationships import (final version)...');
  
  try {
    // 1. Fetch all valid synset IDs from the database
    const validSynsets = await fetchValidSynsets();
    log(`Ready to import relationships with ${validSynsets.size} valid synsets.`);
    
    // Empty the relationships table first to ensure clean import
    log('Clearing relationships table...');
    const { error: deleteError } = await supabase
      .from('relationships')
      .delete()
      .neq('id', 0); // Dummy condition to delete all rows
    
    if (deleteError) {
      log(`Error clearing relationships table: ${deleteError.message}`);
    } else {
      log('Relationships table cleared successfully.');
    }
    
    // 2. Process each data file and insert relationships
    const results = [];
    
    // Process files
    log('Processing noun data file...');
    const nounCount = await processDataFile('data.noun', validSynsets);
    results.push({ type: 'noun', count: nounCount });
    
    log('Processing verb data file...');
    const verbCount = await processDataFile('data.verb', validSynsets);
    results.push({ type: 'verb', count: verbCount });
    
    log('Processing adjective data file...');
    const adjCount = await processDataFile('data.adj', validSynsets);
    results.push({ type: 'adjective', count: adjCount });
    
    log('Processing adverb data file...');
    const advCount = await processDataFile('data.adv', validSynsets);
    results.push({ type: 'adverb', count: advCount });
    
    // 3. Print summary
    log('\nRelationship import summary:');
    let totalCount = 0;
    for (const result of results) {
      log(`- ${result.type} relationships: ${result.count}`);
      totalCount += result.count;
    }
    
    log(`\nTotal relationships imported: ${totalCount}`);
    log('WordNet relationships import completed successfully!');
  } catch (error) {
    log(`Error importing WordNet relationships: ${error.message}`);
    log(error.stack);
  } finally {
    logStream.end();
  }
}

// Run the import process
main(); 