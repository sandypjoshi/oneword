require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const INPUT_FILE = 'short-definitions-test.txt';
const ORIGINAL_WORDS_FILE = 'test-batch-for-definitions.json';
const DRY_RUN = true; // Set to false to actually update the database

/**
 * Parse Claude's output to extract word-definition pairs
 * Expected format: "word: short definition" on each line
 */
function parseShortDefinitions(content) {
  const lines = content.trim().split('\n').filter(line => line.trim());
  const definitions = {};
  
  for (const line of lines) {
    // Match "word: definition" pattern
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const word = match[1].trim().toLowerCase();
      const definition = match[2].trim();
      definitions[word] = definition;
    }
  }
  
  return definitions;
}

/**
 * Prepare short definitions by combining original word data with Claude's definitions
 */
async function prepareShortDefinitions() {
  try {
    console.log('Preparing short definitions...');
    
    // Read original words data
    if (!fs.existsSync(ORIGINAL_WORDS_FILE)) {
      console.error(`Error: ${ORIGINAL_WORDS_FILE} not found. Please run extract-test-batch.js first.`);
      return;
    }
    
    const originalWords = JSON.parse(fs.readFileSync(ORIGINAL_WORDS_FILE, 'utf8'));
    console.log(`Loaded ${originalWords.length} original words.`);
    
    // Read Claude's output
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`Error: ${INPUT_FILE} not found. Please generate definitions with Claude first.`);
      return;
    }
    
    const claudeText = fs.readFileSync(INPUT_FILE, 'utf8');
    const shortDefinitions = parseShortDefinitions(claudeText);
    
    const wordCount = Object.keys(shortDefinitions).length;
    console.log(`Found ${wordCount} short definitions from Claude's output.`);
    
    if (wordCount === 0) {
      console.error('No definitions found in Claude\'s output. Please check the format.');
      return;
    }
    
    // Combine the data
    const combinedData = originalWords.map(word => {
      return {
        id: word.id,
        word: word.word,
        original_definition: word.definition,
        short_definition: shortDefinitions[word.word.toLowerCase()] || null
      };
    });
    
    // Check if all words have definitions
    const missingDefs = combinedData.filter(item => !item.short_definition);
    if (missingDefs.length > 0) {
      console.warn(`Warning: ${missingDefs.length} words don't have short definitions:`);
      missingDefs.forEach(item => console.warn(`- ${item.word}`));
    }
    
    console.log('Sample of prepared data:');
    combinedData.slice(0, 3).forEach(item => {
      console.log(`${item.word}:`);
      console.log(`  Original: ${item.original_definition}`);
      console.log(`  Short: ${item.short_definition || 'MISSING'}`);
      console.log('');
    });
    
    // If in dry run mode, just show what would be updated
    if (DRY_RUN) {
      console.log('\nDRY RUN - Database would be updated with these definitions:');
      combinedData.forEach(item => {
        if (item.short_definition) {
          console.log(`${item.word}: ${item.short_definition}`);
        }
      });
      
      console.log('\nTo update the database, set DRY_RUN = false and run this script again.');
      return;
    }
    
    // Check if short_definition column exists
    const { data: columnCheck, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'words')
      .eq('column_name', 'short_definition');
    
    if (columnError) {
      console.error('Error checking short_definition column:', columnError);
      return;
    }
    
    // If column doesn't exist, add it
    if (!columnCheck || columnCheck.length === 0) {
      console.log('Adding short_definition column to words table...');
      
      const { error: alterError } = await supabase.rpc('execute_sql', {
        sql: 'ALTER TABLE public.words ADD COLUMN short_definition TEXT;'
      });
      
      if (alterError) {
        console.error('Error adding short_definition column:', alterError);
        return;
      }
      
      console.log('Column added successfully.');
    }
    
    // Update the words with short definitions
    console.log('\nUpdating short definitions in database...');
    
    const updates = combinedData
      .filter(item => item.short_definition)
      .map(item => ({
        id: item.id,
        short_definition: item.short_definition
      }));
    
    const { error: updateError } = await supabase
      .from('words')
      .upsert(updates, { onConflict: 'id' });
    
    if (updateError) {
      console.error('Error updating words:', updateError);
      return;
    }
    
    console.log(`Successfully updated ${updates.length} words with short definitions.`);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the preparation and update
prepareShortDefinitions(); 