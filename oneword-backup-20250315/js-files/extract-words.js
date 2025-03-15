// Script to extract words from the database for AI definition generation

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const BATCH_SIZE = 100; // Number of words to extract in each batch
let lastProcessedId = 0; // Start from the beginning
const OUTPUT_FILE = 'words-for-definitions.json';

async function extractWordBatch() {
  // Fetch a batch of words that don't have short definitions yet
  const { data, error } = await supabase
    .from('words')
    .select('id, word, definitions, pos, short_definition')
    .is('short_definition', null) // Only get words without short definitions
    .gt('id', lastProcessedId)
    .order('id', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('Error fetching words:', error);
    return [];
  }

  return data || [];
}

async function extractWords() {
  try {
    console.log('Starting word extraction...');
    
    const allExtractedWords = [];
    let continueFetching = true;
    let totalExtracted = 0;
    let batchNumber = 1;
    
    while (continueFetching) {
      const wordBatch = await extractWordBatch();
      
      if (wordBatch.length === 0) {
        console.log('No more words to extract.');
        continueFetching = false;
        break;
      }
      
      // Update lastProcessedId for the next batch
      lastProcessedId = wordBatch[wordBatch.length - 1].id;
      
      // Add to our collection
      allExtractedWords.push(...wordBatch);
      totalExtracted += wordBatch.length;
      
      console.log(`Batch ${batchNumber}: Extracted ${wordBatch.length} words. Total so far: ${totalExtracted}`);
      batchNumber++;
      
      // If we processed fewer words than the batch size, we're done
      if (wordBatch.length < BATCH_SIZE) {
        continueFetching = false;
      }
    }
    
    // Write the extracted words to a file
    fs.writeFileSync(
      OUTPUT_FILE, 
      JSON.stringify(allExtractedWords, null, 2)
    );
    
    console.log(`
Extraction complete!
- Total words extracted: ${totalExtracted}
- Words saved to: ${OUTPUT_FILE}

Next steps:
1. Share this file with Claude or your AI assistant
2. Ask the AI to generate short, learner-friendly definitions for each word
3. Save the results and use the update-definitions.js script to update your database
    `);
    
  } catch (error) {
    console.error('Error in extractWords:', error);
  }
}

// Start the extraction
extractWords()
  .catch(error => {
    console.error('Error in main process:', error);
  }); 