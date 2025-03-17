#!/usr/bin/env node

/**
 * Test Word Regeneration
 * Regenerate definition, OWAD phrases, and distractors for a single word
 */
const { createClient } = require('@supabase/supabase-js');
const config = require('./config');
const definitionGenerator = require('./generators/definition-generator');
const owadGenerator = require('./generators/owad-generator');
const distractorGenerator = require('./generators/distractor-generator');
const logger = require('./utils/logger');

// Initialize Supabase client
const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_KEY
);

async function processWord(word) {
  console.log(`Processing '${word}'...`);
  
  // Fetch the word from the database
  const { data, error } = await supabase
    .from('app_words')
    .select('*')
    .eq('word', word)
    .limit(1);
    
  if (error) {
    console.error(`Error fetching word: ${error.message}`);
    return;
  }
  
  if (!data || data.length === 0) {
    console.error(`Word '${word}' not found in the database`);
    return;
  }
  
  const wordData = data[0];
  console.log('Original word data:');
  console.log('- Short definition:', wordData.short_definition || 'N/A');
  console.log('- OWAD phrases:', wordData.owad_phrase || 'N/A');
  console.log('- Distractors:', wordData.distractors ? 
    wordData.distractors.map(d => d.distractor).join(', ') : 'N/A');
  console.log('\n');
  
  try {
    // Generate new definition
    console.log('Generating new definition...');
    const withDefinition = await definitionGenerator.generateDefinitions([wordData]);
    const newDefinition = withDefinition[0].short_definition;
    console.log('New definition:', newDefinition);
    
    // Generate new OWAD phrases
    console.log('\nGenerating new OWAD phrases...');
    const withPhrases = await owadGenerator.generateOwadPhrases([withDefinition[0]]);
    const newPhrases = withPhrases[0].owad_phrase;
    console.log('New OWAD phrases:', newPhrases);
    
    // Generate new distractors
    console.log('\nGenerating new distractors...');
    const withDistractors = await distractorGenerator.generateDistractors([withPhrases[0]]);
    const newDistractors = withDistractors[0].distractors;
    console.log('New distractors:', newDistractors.map(d => `${d.distractor} (${d.type})`).join(', '));
    
    // Ask user if they want to update the database
    console.log('\n');
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Do you want to update the database with these new values? (y/n) ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        // Update the database
        const { data, error } = await supabase
          .from('app_words')
          .update({
            short_definition: newDefinition,
            definition_updated_at: new Date().toISOString(),
            definition_source: 'gemini',
            owad_phrase: newPhrases,
            distractors: newDistractors
          })
          .eq('id', wordData.id);
          
        if (error) {
          console.error(`Error updating word: ${error.message}`);
        } else {
          console.log('Database updated successfully!');
        }
      } else {
        console.log('Database not updated.');
      }
      
      readline.close();
    });
    
  } catch (error) {
    console.error(`Error processing word: ${error.message}`);
  }
}

// Get word from command line arguments
const wordToProcess = process.argv[2];

if (!wordToProcess) {
  console.error('Please provide a word to process. Example: node test-word.js anomaly');
  process.exit(1);
}

processWord(wordToProcess); 