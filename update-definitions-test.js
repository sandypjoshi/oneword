// Test script to update the database with AI-generated short definitions

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration for test
const INPUT_FILE = 'test-words-with-definitions.json';
const DRY_RUN = true; // Set to false to actually update the database

// Check if the short_definition column exists and add it if necessary
async function checkAndAddColumn() {
  console.log('Checking if short_definition column exists...');

  try {
    // Try to select the column to see if it exists
    const { data, error } = await supabase
      .from('words')
      .select('short_definition')
      .limit(1);

    if (error) {
      // If the error message indicates the column doesn't exist
      if (error.message && error.message.includes('does not exist')) {
        console.log('The short_definition column does not exist.');
        
        if (DRY_RUN) {
          console.log('[DRY RUN] Would execute: ALTER TABLE public.words ADD COLUMN short_definition TEXT;');
          return false;
        } else {
          console.log('Adding short_definition column...');
          
          // Create the column via SQL query
          const { error: alterError } = await supabase.rpc('execute_sql', { 
            sql: 'ALTER TABLE public.words ADD COLUMN short_definition TEXT;' 
          });

          if (alterError) {
            console.error('Error adding column:', alterError);
            return false;
          }
          
          console.log('Successfully added short_definition column.');
          return true;
        }
      } else {
        // Some other error occurred
        console.error('Error checking column:', error);
        return false;
      }
    } else {
      // No error means the column exists
      console.log('The short_definition column already exists.');
      return true;
    }
  } catch (error) {
    console.error('Exception checking column:', error);
    return false;
  }
}

// Preview what would be updated (or actually update if DRY_RUN is false)
async function previewOrUpdateWords(wordsWithDefinitions) {
  console.log(`\n${DRY_RUN ? 'PREVIEW' : 'UPDATE'} OF DEFINITIONS:\n`);
  
  for (const wordData of wordsWithDefinitions) {
    const { id, word, short_definition } = wordData;
    
    if (DRY_RUN) {
      console.log(`Would update word "${word}" (ID: ${id}):`);
      console.log(`  Short definition: "${short_definition}"`);
      console.log('---');
    } else {
      // Actually update the database
      const { error } = await supabase
        .from('words')
        .update({ short_definition })
        .eq('id', id);
      
      if (error) {
        console.error(`Error updating word ID ${id}:`, error);
      } else {
        console.log(`Updated "${word}" with: "${short_definition}"`);
      }
    }
  }
}

async function testUpdateDefinitions() {
  try {
    // First, check if the column exists
    const columnExists = await checkAndAddColumn();
    
    // Read the JSON file with AI-generated definitions
    if (!fs.existsSync(INPUT_FILE)) {
      throw new Error(`Input file not found: ${INPUT_FILE}`);
    }
    
    const fileContent = fs.readFileSync(INPUT_FILE, 'utf8');
    const wordsWithDefinitions = JSON.parse(fileContent);
    
    if (!Array.isArray(wordsWithDefinitions)) {
      throw new Error('Input file does not contain an array of words');
    }
    
    console.log(`Loaded ${wordsWithDefinitions.length} words with definitions from ${INPUT_FILE}`);
    
    // Preview or update the database
    await previewOrUpdateWords(wordsWithDefinitions);
    
    console.log(`\n${DRY_RUN ? 'Preview' : 'Update'} complete!`);
    
    if (DRY_RUN) {
      console.log(`
To actually update the database, change DRY_RUN to false in the script.

IMPORTANT: This is just a test with 10 words. For the full process:
1. Run extract-words.js to get all words without short definitions
2. Get AI-generated definitions from Claude
3. Run prepare-definitions.js to prepare the update file
4. Run update-definitions.js to update the database
      `);
    }
    
  } catch (error) {
    console.error('Error in testUpdateDefinitions:', error);
  }
}

// Start the test update process
testUpdateDefinitions()
  .catch(error => {
    console.error('Error in main process:', error);
  }); 