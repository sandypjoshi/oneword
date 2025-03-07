require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Constants
const BATCH_SIZE = 100;
const WORDNET_DIR = path.join(__dirname, '../wordnet-data/dict');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Parts of speech mapping
const POS_MAP = {
  'n': 'noun',
  'v': 'verb',
  'a': 'adjective',
  's': 'adjective satellite',
  'r': 'adverb'
};

/**
 * Process a single line from index.sense file
 * @param {string} line - Line from index.sense file
 * @returns {Object|null} - Parsed word-synset mapping or null
 */
function parseSenseLine(line) {
  // Skip comment lines
  if (line.startsWith('  ') || line.trim() === '') {
    return null;
  }

  // Format: sense_key synset_offset sense_number tag_count
  const parts = line.trim().split(/\s+/);
  if (parts.length < 4) return null;

  const senseKey = parts[0];
  const offset = parts[1];
  const senseNumber = parseInt(parts[2]);
  const tagCount = parseInt(parts[3]);

  // Extract word from sense key (first part before %)
  const word = senseKey.split('%')[0].toLowerCase();
  const posPart = senseKey.split('%')[1];
  if (!posPart) return null;

  const pos = parseInt(posPart.charAt(0));
  if (!pos) return null;

  // Create synset ID in WordNet format (e.g., "n00001740")
  const synsetId = generateSynsetId(offset, pos);

  // Debug: Log first few synset IDs we generate
  if (Math.random() < 0.001) { // Log ~0.1% of synset IDs
    console.log('Generated synset ID:', synsetId, 'from offset:', offset, 'and pos:', pos);
  }

  return {
    word,
    synset_id: synsetId, // This matches the column name in word_synsets table
    sense_number: senseNumber,
    tag_count: tagCount
  };
}

function generateSynsetId(offset, pos) {
  // Convert pos number to letter: 1=n, 2=v, 3=a, 4=r, 5=s
  const posToLetter = {
    1: 'n',
    2: 'v',
    3: 'a',
    4: 'r',
    5: 's'
  };
  
  // Pad offset with leading zeros to 8 digits
  const paddedOffset = offset.toString().padStart(8, '0');
  
  // Return synset ID in format: [pos_letter][8_digit_offset]
  return `${posToLetter[pos]}${paddedOffset}`;
}

/**
 * Get all existing synset IDs from the database
 * @returns {Set<string>} Set of synset IDs
 */
async function getExistingSynsetIds() {
  console.log('Fetching existing synset IDs...');
  const synsetIds = new Set();
  
  let lastId = null;
  let hasMore = true;
  
  while (hasMore) {
    const query = supabase
      .from('synsets')
      .select('id') // This is the primary key in the synsets table
      .order('id')
      .limit(1000);
    
    if (lastId) {
      query.gt('id', lastId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching synset IDs:', error);
      break;
    }
    
    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      // Add each synset ID to our set
      data.forEach(row => {
        synsetIds.add(row.id);
        // Debug: Log first few synset IDs from database
        if (synsetIds.size <= 5) {
          console.log('Found synset ID in database:', row.id);
        }
      });
      lastId = data[data.length - 1].id;
    }
  }
  
  console.log(`Found ${synsetIds.size} existing synsets`);
  return synsetIds;
}

/**
 * Import word-synset mappings in batches
 * @param {Array} mappings - Array of word-synset mappings
 * @param {Set<string>} validSynsetIds - Set of valid synset IDs from synsets table
 */
async function importBatch(supabase, mappings, batchNumber) {
  try {
    // Use upsert instead of insert to handle duplicates
    const { data, error } = await supabase
      .from('word_synsets')
      .upsert(mappings, { 
        onConflict: 'word,synset_id',
        ignoreDuplicates: true 
      });

    if (error) {
      console.error('Error importing batch:', error);
      return;
    }

    console.log(`Imported batch ${batchNumber} (${batchNumber * BATCH_SIZE} total mappings)`);
  } catch (error) {
    console.error('Error importing batch:', error);
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('Starting word-synset mapping import...');
  
  // First get all valid synset IDs from the synsets table
  const validSynsetIds = await getExistingSynsetIds();
  
  // Read and process index.sense file
  const fileStream = fs.createReadStream(path.join(WORDNET_DIR, 'index.sense'));
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentBatch = [];
  let totalProcessed = 0;
  let batchCount = 0;
  let skippedCount = 0;

  for await (const line of rl) {
    const mapping = parseSenseLine(line);
    if (mapping) {
      // Check if the synset exists in our database
      if (validSynsetIds.has(mapping.synset_id)) {
        currentBatch.push(mapping);
      } else {
        skippedCount++;
        // Debug: Log first few skipped mappings
        if (skippedCount <= 5) {
          console.log('Skipped mapping:', mapping);
        }
      }

      if (currentBatch.length >= BATCH_SIZE) {
        await importBatch(supabase, currentBatch, batchCount + 1);
        totalProcessed += currentBatch.length;
        batchCount++;
        console.log(`Imported batch ${batchCount} (${totalProcessed} total mappings, ${skippedCount} skipped)`);
        currentBatch = [];
      }
    }
  }

  // Import final batch if any
  if (currentBatch.length > 0) {
    await importBatch(supabase, currentBatch, batchCount + 1);
    totalProcessed += currentBatch.length;
    console.log(`Imported final batch (${totalProcessed} total mappings, ${skippedCount} skipped)`);
  }

  console.log('Word-synset mapping import completed.');
  console.log(`Total mappings processed: ${totalProcessed}`);
  console.log(`Total mappings skipped: ${skippedCount}`);
}

// Run the import
main().catch(console.error); 