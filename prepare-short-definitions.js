require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const INPUT_FILE = 'claude-definitions.txt';
const OUTPUT_FILE = 'short-definitions-ready.json';
const DRY_RUN = true; // Set to false to actually update the database

/**
 * Parse Claude's output to extract word-definition pairs
 * Expected format: "word: short definition" on each line
 */
function parseClaudeOutput(outputText) {
  const lines = outputText.split('\n').filter(line => line.trim());
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
    
    // Read Claude's output
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`Error: ${INPUT_FILE} not found. Please generate definitions with Claude first.`);
      return;
    }
    
    const claudeText = fs.readFileSync(INPUT_FILE, 'utf8');
    const shortDefinitions = parseClaudeOutput(claudeText);
    
    const wordCount = Object.keys(shortDefinitions).length;
    console.log(`Found ${wordCount} short definitions from Claude's output.`);
    
    if (wordCount === 0) {
      console.error('No definitions found in Claude\'s output. Please check the format.');
      return;
    }
    
    // Fetch the eligible words from the database to get their IDs
    const words = Object.keys(shortDefinitions);
    const { data: wordsData, error } = await supabase
      .from('words')
      .select('id, word')
      .in('word', words);
    
    if (error) {
      console.error('Error fetching words from database:', error);
      return;
    }
    
    // Prepare the update data
    const updateData = wordsData.map(wordRecord => {
      const word = wordRecord.word.toLowerCase();
      return {
        id: wordRecord.id,
        word: word,
        short_definition: shortDefinitions[word] || null
      };
    });
    
    // Filter out any words that don't have definitions
    const readyData = updateData.filter(item => item.short_definition);
    
    console.log(`Prepared ${readyData.length} words with short definitions for update.`);
    
    // Write the prepared data to a file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(readyData, null, 2));
    
    console.log(`\nShort definitions prepared and saved to ${OUTPUT_FILE}.`);
    console.log('Sample of prepared data:');
    console.log(JSON.stringify(readyData.slice(0, 3), null, 2));
    
    // Preview update operation
    if (DRY_RUN) {
      console.log('\nDRY RUN: Database will not be updated.');
      console.log(`To update the database, set DRY_RUN = false and run this script again.`);
    } else {
      console.log('\nWARNING: This will update the database. Press Ctrl+C to cancel.');
      // Add a small delay to allow cancellation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
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
      
      // If column doesn't exist, we need to add it
      if (!columnCheck || columnCheck.length === 0) {
        console.log('Adding short_definition column to words table...');
        
        // Run SQL to add the column
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
      console.log(`Updating ${readyData.length} words with short definitions...`);
      
      // Process in chunks to avoid hitting limits
      const CHUNK_SIZE = 50;
      for (let i = 0; i < readyData.length; i += CHUNK_SIZE) {
        const chunk = readyData.slice(i, i + CHUNK_SIZE);
        const { error: updateError } = await supabase
          .from('words')
          .upsert(chunk, { onConflict: 'id' });
        
        if (updateError) {
          console.error(`Error updating words batch ${i}-${i + chunk.length}:`, updateError);
        } else {
          console.log(`Updated words ${i + 1}-${i + chunk.length} of ${readyData.length}`);
        }
      }
      
      console.log('Update complete!');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the preparation
prepareShortDefinitions(); 