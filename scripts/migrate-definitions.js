/**
 * Definition Data Migration Script
 * 
 * This script processes all tables containing WordNet definition data,
 * extracts examples from quoted text, and updates the database structure.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration
const BATCH_SIZE = 50;

/**
 * Extract definition and examples from a WordNet gloss
 * @param {string} gloss - The full definition text
 * @returns {Object} - Separated definition and examples
 */
function extractDefinitionAndExamples(gloss) {
  if (!gloss) return { definition: '', examples: [] };
  
  const examples = [];
  let definition = gloss;
  
  // Extract all quoted examples
  const quoteRegex = /"([^"]+)"/g;
  let match;
  
  while ((match = quoteRegex.exec(gloss)) !== null) {
    examples.push(match[1]);
  }
  
  // Remove examples from definition if examples were found
  if (examples.length > 0) {
    // Split by the first quote and take the first part
    definition = gloss.split('"')[0].trim();
    // Remove trailing semicolon or comma if present
    definition = definition.replace(/[;,]$/, '').trim();
  }
  
  return { definition, examples };
}

/**
 * Process and update synsets table
 */
async function migrateSynsets() {
  console.log('Migrating synsets table...');
  
  // Check if examples column exists, add if not
  try {
    // Try to query with examples column to see if it exists
    await supabase
      .from('synsets')
      .select('examples')
      .limit(1);
    
    console.log('Examples column already exists in synsets table.');
  } catch (error) {
    // Column doesn't exist, add it
    try {
      const { error: alterError } = await supabase.rpc('execute_sql', {
        sql: 'ALTER TABLE synsets ADD COLUMN examples TEXT[] DEFAULT NULL'
      });
      
      if (alterError) {
        console.error('Error adding examples column:', alterError);
        return;
      }
      
      console.log('Added examples column to synsets table.');
    } catch (e) {
      console.error('Error altering table:', e);
      return;
    }
  }
  
  // Fetch and process synsets in batches
  let processed = 0;
  let lastId = null;
  let hasMore = true;
  
  while (hasMore) {
    const query = supabase
      .from('synsets')
      .select('id, definition')
      .order('id')
      .limit(BATCH_SIZE);
    
    if (lastId) {
      query.gt('id', lastId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching synsets:', error);
      break;
    }
    
    if (!data || data.length === 0) {
      hasMore = false;
      continue;
    }
    
    lastId = data[data.length - 1].id;
    
    // Process and update each synset
    const updates = [];
    
    for (const synset of data) {
      const { definition, examples } = extractDefinitionAndExamples(synset.definition);
      
      updates.push({
        id: synset.id,
        definition: definition,
        examples: examples.length > 0 ? examples : null
      });
    }
    
    if (updates.length > 0) {
      const { error: updateError } = await supabase
        .from('synsets')
        .upsert(updates, { onConflict: 'id' });
      
      if (updateError) {
        console.error('Error updating synsets:', updateError);
      } else {
        processed += updates.length;
        console.log(`Processed ${processed} synsets...`);
      }
    }
  }
  
  console.log(`Finished migrating synsets table. Processed ${processed} synsets.`);
}

/**
 * Process and update words table
 */
async function migrateWords() {
  console.log('Migrating words table...');
  
  // Fetch all words with string definitions rather than arrays
  let processed = 0;
  let lastWord = null;
  let hasMore = true;
  
  while (hasMore) {
    const query = supabase
      .from('words')
      .select('word, definitions')
      .order('word')
      .limit(BATCH_SIZE);
    
    if (lastWord) {
      query.gt('word', lastWord);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching words:', error);
      break;
    }
    
    if (!data || data.length === 0) {
      hasMore = false;
      continue;
    }
    
    lastWord = data[data.length - 1].word;
    
    // Process and update each word
    const updates = [];
    
    for (const word of data) {
      // Skip if definitions is already an array
      if (Array.isArray(word.definitions)) {
        continue;
      }
      
      // If definition is a string, parse it
      if (typeof word.definitions === 'string') {
        const { definition, examples } = extractDefinitionAndExamples(word.definitions);
        
        updates.push({
          word: word.word,
          definitions: [definition],
          examples: examples.length > 0 ? examples : null
        });
      }
    }
    
    if (updates.length > 0) {
      const { error: updateError } = await supabase
        .from('words')
        .upsert(updates, { onConflict: 'word' });
      
      if (updateError) {
        console.error('Error updating words:', updateError);
      } else {
        processed += updates.length;
        console.log(`Processed ${processed} words...`);
      }
    }
  }
  
  console.log(`Finished migrating words table. Processed ${processed} words.`);
}

/**
 * Main function
 */
async function main() {
  console.log('Starting definition data migration...');
  
  // Migrate synsets table
  await migrateSynsets();
  
  // Migrate words table
  await migrateWords();
  
  console.log('Definition data migration complete!');
}

// Run the script
main().catch(console.error); 