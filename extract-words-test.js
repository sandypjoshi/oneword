// Test script to extract a small batch of words for demonstration

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration for test - small batch only
const BATCH_SIZE = 10; // Just extract 10 words for demonstration
const OUTPUT_FILE = 'test-words-for-definitions.json';

async function extractWordBatch() {
  // Fetch a small batch of words that don't have short definitions yet
  const { data, error } = await supabase
    .from('words')
    .select('id, word, definitions, pos')
    .order('id', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('Error fetching words:', error);
    return [];
  }

  return data || [];
}

async function extractTestWords() {
  try {
    console.log('Extracting a small test batch of words...');
    
    const wordBatch = await extractWordBatch();
    
    if (wordBatch.length === 0) {
      console.log('No words found.');
      return;
    }
    
    // Write the extracted words to a file
    fs.writeFileSync(
      OUTPUT_FILE, 
      JSON.stringify(wordBatch, null, 2)
    );
    
    console.log(`
Test extraction complete!
- Words extracted: ${wordBatch.length}
- Words saved to: ${OUTPUT_FILE}

The extracted words are:
${wordBatch.map(w => `- ${w.word} (${w.pos})`).join('\n')}
    `);
    
  } catch (error) {
    console.error('Error in extractTestWords:', error);
  }
}

// Start the extraction
extractTestWords()
  .catch(error => {
    console.error('Error in main process:', error);
  }); 