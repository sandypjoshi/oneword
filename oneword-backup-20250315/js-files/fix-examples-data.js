// Script to fix examples data by restoring the missing first character

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const BATCH_SIZE = 100; // Process words in batches
const DRY_RUN = true; // Set to false to actually update the database
let lastProcessedId = 0;
let totalProcessed = 0;
let totalUpdated = 0;
let totalErrors = 0;

// Function to fetch a batch of words with examples
async function fetchWordBatch() {
  const { data, error } = await supabase
    .from('words')
    .select('id, word, definitions, examples')
    .not('examples', 'is', null)
    .gt('id', lastProcessedId)
    .order('id', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('Error fetching words:', error);
    return [];
  }

  return data || [];
}

// Function to check if examples likely have the first character missing
function examplesMissingFirstChar(definitions, examples) {
  if (!Array.isArray(examples) || examples.length === 0) return false;
  if (!Array.isArray(definitions) || definitions.length === 0) return false;
  
  // Try to find evidence that examples are missing first character
  // Strategy: Look for patterns in definitions that might match the examples
  
  const defText = definitions.join(' ').toLowerCase();
  let missingEvidence = 0;
  
  for (const example of examples) {
    // Skip empty examples
    if (!example || typeof example !== 'string' || example.length === 0) continue;
    
    // Look for a pattern where the example might be contained in the definition
    // but missing its first character
    const exLower = example.toLowerCase();
    
    // Check if there's any substring in the definition that starts with a character
    // followed by the beginning of the example
    if (exLower.length >= 3) {
      // Take the first few characters of the example (minus the potentially missing first char)
      const exampleStart = exLower.substring(0, Math.min(5, exLower.length));
      
      // Look for patterns in the definition that could be the source
      // We're looking for any character followed by the example start
      let found = false;
      for (let i = 0; i < defText.length - exampleStart.length; i++) {
        const potentialMatch = defText.substring(i, i + exampleStart.length + 1);
        // If the definition has a character followed by the example start
        if (potentialMatch.substring(1) === exampleStart) {
          found = true;
          break;
        }
      }
      
      if (!found) {
        // If we couldn't find a potential match, it might not have the issue
        missingEvidence++;
      }
    }
  }
  
  // If a significant portion of examples don't show evidence, assume they're not missing the first char
  return missingEvidence < examples.length / 2;
}

// Function to try to restore the first character of examples
function restoreExamples(definitions, examples) {
  if (!Array.isArray(examples) || examples.length === 0) return examples;
  if (!Array.isArray(definitions) || definitions.length === 0) return examples;
  
  const defText = definitions.join(' ');
  const fixedExamples = [];
  
  for (const example of examples) {
    // Skip empty examples
    if (!example || typeof example !== 'string' || example.length === 0) {
      fixedExamples.push(example);
      continue;
    }
    
    // Try to find the example in the definition with a character before it
    let fixedExample = null;
    
    if (example.length >= 3) {
      // Take the first few characters of the example
      const exampleStart = example.substring(0, Math.min(5, example.length));
      
      // Look for the best match in the definition
      for (let i = 0; i < defText.length - exampleStart.length; i++) {
        // If the definition has the example start
        if (defText.substring(i + 1, i + 1 + exampleStart.length).toLowerCase() === 
            exampleStart.toLowerCase()) {
          // Get the character before the example start
          const missingChar = defText.charAt(i);
          fixedExample = missingChar + example;
          break;
        }
      }
    }
    
    // If we couldn't find a match, make an educated guess
    if (!fixedExample) {
      const firstChar = example.charAt(0);
      // If the example starts with a lowercase letter, assume it's missing a capital letter
      if (firstChar >= 'a' && firstChar <= 'z') {
        fixedExample = 'T' + example; // Often examples start with "The" or "This"
      } else {
        // Otherwise just duplicate the first character as a fallback
        fixedExample = example.charAt(0) + example;
      }
    }
    
    fixedExamples.push(fixedExample);
  }
  
  return fixedExamples;
}

// Update a word with fixed examples
async function updateWord(id, fixedExamples) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would update word ID ${id} with fixed examples: ${JSON.stringify(fixedExamples)}`);
    return true;
  }
  
  const { error } = await supabase
    .from('words')
    .update({ examples: fixedExamples })
    .eq('id', id);
  
  if (error) {
    console.error(`Error updating word ID ${id}:`, error);
    totalErrors++;
    return false;
  }
  
  totalUpdated++;
  return true;
}

// Main process function
async function fixExamplesData() {
  console.log(`Starting fix process in ${DRY_RUN ? 'DRY RUN' : 'LIVE'} mode...`);
  
  let continueFetching = true;
  let batchNumber = 1;
  
  while (continueFetching) {
    const wordBatch = await fetchWordBatch();
    
    if (wordBatch.length === 0) {
      console.log('No more words to process.');
      continueFetching = false;
      break;
    }
    
    console.log(`Processing batch ${batchNumber} with ${wordBatch.length} words...`);
    
    for (const word of wordBatch) {
      const { id, word: wordText, definitions, examples } = word;
      
      // Track the last processed ID for pagination
      lastProcessedId = id;
      
      // Check if examples likely have the first character missing
      const likelyMissing = examplesMissingFirstChar(definitions, examples);
      
      if (likelyMissing) {
        // Try to restore the examples
        const fixedExamples = restoreExamples(definitions, examples);
        
        // Log a preview of the changes
        console.log(`Word: ${wordText} (ID: ${id})`);
        console.log('  Before:', JSON.stringify(examples));
        console.log('  After:', JSON.stringify(fixedExamples));
        
        // Update the word with fixed examples
        await updateWord(id, fixedExamples);
      } else {
        console.log(`Word: ${wordText} (ID: ${id}) - No fix needed`);
      }
      
      totalProcessed++;
    }
    
    console.log(`
Batch ${batchNumber} complete:
- Words processed: ${wordBatch.length}
- Total processed: ${totalProcessed}
- Total updated: ${totalUpdated}
- Total errors: ${totalErrors}
    `);
    
    // If we processed fewer words than the batch size, we're done
    if (wordBatch.length < BATCH_SIZE) {
      continueFetching = false;
    }
    
    batchNumber++;
  }
  
  console.log(`
Fix process complete!
- Total words processed: ${totalProcessed}
- Total words updated: ${totalUpdated}
- Total errors: ${totalErrors}

${DRY_RUN ? 'This was a DRY RUN. To apply changes, set DRY_RUN = false in the script.' : 'Changes have been applied to the database.'}
  `);
}

// Start the process
fixExamplesData()
  .catch(error => {
    console.error('Error in main process:', error);
  }); 