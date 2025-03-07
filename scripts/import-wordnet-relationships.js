/**
 * WordNet Relationships Import Script
 * 
 * This script focuses exclusively on importing the semantic relationships between synsets
 * from the WordNet data that has already been processed. It assumes that synsets and 
 * word-synset mappings have already been imported.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ===== Constants =====
const BATCH_SIZE = 5000;
const WORDNET_DIR = path.join(__dirname, '../wordnet-data/dict');

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
  '@': 'hypernym',
  '~': 'hyponym',
  '*': 'entailment',
  '>': 'cause',
  '^': 'also_see',
  '$': 'verb_group',
  '+': 'derivationally_related',
  ';c': 'domain_topic',
  ';r': 'domain_region',
  ';u': 'domain_usage',
  
  // Adjective relationships
  '!': 'antonym',
  '<': 'participle',
  '\\': 'pertainym',
  '=': 'attribute',
  '^': 'also_see',
  ';c': 'domain_topic',
  ';r': 'domain_region',
  ';u': 'domain_usage',
  '+': 'derivationally_related',
  
  // Adverb relationships
  '\\': 'derived_from',
  ';c': 'domain_topic',
  ';r': 'domain_region',
  ';u': 'domain_usage'
};

/**
 * Parse a synset from a data file line
 * @param {string} line - Line from a data file
 * @returns {Object} - Parsed synset object with relationships
 */
function parseSynset(line) {
  // Skip comment lines or empty lines
  if (line.startsWith('  ') || line.trim() === '') {
    return null;
  }
  
  // The format is complex, but we can extract the relevant parts
  const parts = line.split('|');
  if (parts.length < 1) {
    return null;
  }
  
  // First part contains synset info and pointers
  const synsetData = parts[0].trim();
  
  // Match the synset definition pattern
  // Format: synset_offset lex_filenum ss_type w_cnt word ... p_cnt ptr ... | definition
  const synsetMatch = synsetData.match(/^(\d{8}) (\d{2}) ([nvarsp]) (\d{2})/);
  if (!synsetMatch) {
    return null;
  }
  
  const [, synsetOffset, lexFilenum, pos, senseCount] = synsetMatch;
  
  // Create synset ID in the format used by our database (e.g., "n00001740")
  // Ensure the offset is padded to 8 digits to match the original import
  const synsetId = `${pos}${synsetOffset.padStart(8, '0')}`;
  
  // Get the remainder of the line for pointer extraction
  let remainder = synsetData.substring(synsetMatch[0].length).trim();
  
  // Extract word count (in hex)
  const wordCount = parseInt(remainder.substring(0, 2), 16);
  remainder = remainder.substring(2).trim();
  
  // Skip past all the words
  for (let i = 0; i < wordCount; i++) {
    const wordEnd = remainder.indexOf(' ');
    if (wordEnd === -1) break;
    remainder = remainder.substring(wordEnd + 1).trim();
  }
  
  // Now extract pointer count (in hex)
  if (remainder.length < 2) {
    return { synsetId, relationships: [] };
  }
  
  const pointerCount = parseInt(remainder.substring(0, 2), 16);
  remainder = remainder.substring(2).trim();
  
  // Extract all pointers
  const relationships = [];
  
  for (let i = 0; i < pointerCount; i++) {
    // Format of each pointer: pointer_symbol target_synset_offset pos source/target
    const parts = remainder.split(' ', 4);
    if (parts.length < 4) break;
    
    const [pointerSymbol, targetSynsetOffset, targetPos, sourceTarget] = parts;
    remainder = remainder.substring(parts.join(' ').length + 1).trim();
    
    // Create target synset ID
    const targetSynsetId = `${targetPos}${targetSynsetOffset.padStart(8, '0')}`;
    
    // Skip reflexive relationships (pointing to self)
    if (targetSynsetId === synsetId) continue;
    
    // Only add supported relationship types
    const relType = RELATIONSHIP_TYPES[pointerSymbol];
    if (relType) {
      relationships.push({
        from_synset_id: synsetId,
        to_synset_id: targetSynsetId,
        relationship_type: relType
      });
    }
  }
  
  return { synsetId, relationships };
}

/**
 * Read and process a WordNet data file
 * @param {string} fileName - Data file name (e.g., 'data.noun')
 * @returns {Array} - Array of relationships
 */
async function readDataFile(fileName) {
  console.log(`Processing ${fileName}...`);
  const filePath = path.join(WORDNET_DIR, fileName);
  const data = fs.readFileSync(filePath, 'utf8');
  const lines = data.split('\n');
  
  const relationships = [];
  
  // Process each non-comment line
  for (const line of lines) {
    if (line.startsWith('  ') || line === '') continue;
    
    const parsed = parseSynset(line);
    if (parsed && parsed.relationships.length > 0) {
      relationships.push(...parsed.relationships);
    }
  }
  
  console.log(`Found ${relationships.length} relationships in ${fileName}`);
  return relationships;
}

/**
 * Insert data into a table in batches
 * @param {string} table - Table name
 * @param {Array} data - Array of objects to insert
 * @returns {Promise<void>}
 */
async function batchInsert(table, data) {
  const totalCount = data.length;
  console.log(`Inserting ${totalCount} records into ${table}...`);
  
  // Track unique relationships to avoid duplicates
  const seen = new Set();
  const uniqueData = [];
  
  for (const item of data) {
    const key = `${item.from_synset_id}:${item.to_synset_id}:${item.relationship_type}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueData.push(item);
    }
  }
  
  console.log(`Filtered out ${totalCount - uniqueData.length} duplicate relationships`);
  
  // Insert in batches
  for (let i = 0; i < uniqueData.length; i += BATCH_SIZE) {
    const batch = uniqueData.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(uniqueData.length / BATCH_SIZE);
    
    console.log(`  Inserting batch ${batchNum} of ${totalBatches} (${batch.length} records)`);
    
    try {
      const { data, error } = await supabase
        .from(table)
        .insert(batch)
        .select('id');
      
      if (error) {
        console.error(`Error inserting batch into ${table}:`, error);
      } else {
        console.log(`  Successfully inserted batch ${batchNum}`);
      }
    } catch (error) {
      console.error(`Exception inserting batch into ${table}:`, error);
    }
    
    // Log progress every 5 batches
    if (batchNum % 5 === 0 || batchNum === totalBatches) {
      console.log(`Progress: ${Math.min(i + BATCH_SIZE, uniqueData.length)} / ${uniqueData.length} records (${Math.round((Math.min(i + BATCH_SIZE, uniqueData.length) / uniqueData.length) * 100)}%)`);
    }
  }
  
  console.log(`Finished inserting into ${table}`);
  return uniqueData.length;
}

/**
 * Main function to run the import process
 */
async function main() {
  console.log('Starting WordNet relationships import...');
  
  try {
    // Process all data files to extract relationships
    let allRelationships = [];
    
    // Process noun data
    const nounRelationships = await readDataFile('data.noun');
    console.log(`Extracted ${nounRelationships.length} noun relationships`);
    allRelationships = allRelationships.concat(nounRelationships);
    
    // Process verb data
    const verbRelationships = await readDataFile('data.verb');
    console.log(`Extracted ${verbRelationships.length} verb relationships`);
    allRelationships = allRelationships.concat(verbRelationships);
    
    // Process adjective data
    const adjRelationships = await readDataFile('data.adj');
    console.log(`Extracted ${adjRelationships.length} adjective relationships`);
    allRelationships = allRelationships.concat(adjRelationships);
    
    // Process adverb data
    const advRelationships = await readDataFile('data.adv');
    console.log(`Extracted ${advRelationships.length} adverb relationships`);
    allRelationships = allRelationships.concat(advRelationships);
    
    console.log(`Total relationships found: ${allRelationships.length}`);
    
    // Insert relationships into the database
    const insertedCount = await batchInsert('relationships', allRelationships);
    
    console.log(`WordNet relationships import completed successfully!`);
    console.log(`Inserted ${insertedCount} unique relationships.`);
  } catch (error) {
    console.error('Error importing WordNet relationships:', error);
    process.exit(1);
  }
}

// Run the import process
main(); 