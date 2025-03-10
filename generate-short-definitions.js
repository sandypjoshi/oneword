// Script to generate short, learner-friendly definitions for words
// and save them in a new column in the words table

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const BATCH_SIZE = 50; // Number of words to process in each batch
const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds delay between batches
let totalProcessed = 0;
let totalUpdated = 0;
let totalErrors = 0;

// State tracking
let lastProcessedId = 0;
const processedWords = new Set();

// Common filler words to remove when shortening definitions
const FILLER_WORDS = [
  'a', 'an', 'the', 'that', 'which', 'who', 'whom', 'whose', 'this', 'these', 'those',
  'being', 'having', 'doing', 'especially', 'particularly', 'specifically', 'generally',
  'typically', 'usually', 'often', 'sometimes', 'frequently', 'occasionally', 'rarely',
  'commonly', 'primarily', 'mainly', 'mostly', 'largely', 'chiefly', 'principally'
];

// First, add the short_definition column if it doesn't exist
async function addShortDefinitionColumn() {
  console.log('Checking if short_definition column exists...');

  // Check if the column already exists
  const { data: columns, error: columnsError } = await supabase
    .from('words')
    .select('short_definition')
    .limit(1)
    .maybeSingle();

  if (columnsError) {
    // If error contains 'column "short_definition" does not exist', we need to add it
    if (columnsError.message.includes('column "short_definition" does not exist')) {
      console.log('Adding short_definition column to words table...');
      
      // Create the column via SQL query
      const { error: alterError } = await supabase.rpc('execute_sql', { 
        sql: 'ALTER TABLE public.words ADD COLUMN short_definition TEXT;' 
      });

      if (alterError) {
        console.error('Error adding short_definition column:', alterError);
        throw alterError;
      }
      
      console.log('Successfully added short_definition column to words table.');
    } else {
      console.error('Error checking for short_definition column:', columnsError);
      throw columnsError;
    }
  } else {
    console.log('short_definition column already exists.');
  }
}

// Function to create short, learner-friendly definitions
function generateShortDefinition(word, fullDefinitions, pos) {
  try {
    // Handle case when definitions is null or empty
    if (!fullDefinitions || (Array.isArray(fullDefinitions) && fullDefinitions.length === 0)) {
      return `A ${pos || 'word'} that refers to ${word}`;
    }

    // Prepare the definitions as an array
    const definitions = Array.isArray(fullDefinitions) 
      ? fullDefinitions 
      : [String(fullDefinitions || '')];
    
    // Get the primary (first) definition
    let primaryDef = definitions[0] || '';
    
    // Remove any content in parentheses
    primaryDef = primaryDef.replace(/\([^)]*\)/g, '').trim();
    
    // Remove introductory phrases like "one who..." or "the act of..."
    primaryDef = primaryDef
      .replace(/^(a|an|the) (person|one|act|quality|state|condition|process) (of|who|that|which) /i, '')
      .replace(/^(someone|something) (who|that|which) /i, '')
      .replace(/^(to|being|having) /i, '')
      .trim();
    
    // Split into words for further processing
    const words = primaryDef.split(/\s+/);
    
    // If the definition is already short, return it as is
    if (words.length <= 15) {
      // Just capitalize the first letter
      return primaryDef.charAt(0).toUpperCase() + primaryDef.slice(1);
    }
    
    // For longer definitions, create a shortened version
    // Keep only essential words (remove filler words if possible)
    let shortWords = [];
    let essentialCount = 0;
    
    for (const word of words) {
      // Keep words that aren't in the filler list, or keep if we don't have enough words yet
      if (!FILLER_WORDS.includes(word.toLowerCase()) || essentialCount < 10) {
        shortWords.push(word);
        essentialCount++;
      }
      
      // Stop once we have enough words
      if (shortWords.length >= 15) {
        break;
      }
    }
    
    // Join the words back into a definition
    let shortDef = shortWords.join(' ');
    
    // Make sure the definition ends with proper punctuation
    if (!shortDef.match(/[.!?]$/)) {
      shortDef += '.';
    }
    
    // Ensure the first letter is capitalized
    shortDef = shortDef.charAt(0).toUpperCase() + shortDef.slice(1);
    
    // Add appropriate prefix based on part of speech
    if (pos) {
      switch (pos.toLowerCase()) {
        case 'verb':
        case 'v':
          if (!shortDef.toLowerCase().startsWith('to ')) {
            shortDef = 'To ' + shortDef.charAt(0).toLowerCase() + shortDef.slice(1);
          }
          break;
        case 'noun':
        case 'n':
          if (!shortDef.toLowerCase().startsWith('a ') && 
              !shortDef.toLowerCase().startsWith('an ') && 
              !shortDef.toLowerCase().startsWith('the ')) {
            const firstChar = shortDef.charAt(0).toLowerCase();
            const article = 'aeiou'.includes(firstChar) ? 'An ' : 'A ';
            shortDef = article + shortDef.charAt(0).toLowerCase() + shortDef.slice(1);
          }
          break;
        case 'adjective':
        case 'adj':
        case 'a':
          // For adjectives, we just need to make sure it's descriptive
          if (shortDef.toLowerCase().startsWith('being ') || 
              shortDef.toLowerCase().startsWith('having ')) {
            // This is already fine
          } else if (!shortDef.match(/ing$/) && !shortDef.match(/ed$/)) {
            shortDef = 'Being ' + shortDef.charAt(0).toLowerCase() + shortDef.slice(1);
          }
          break;
        case 'adverb':
        case 'adv':
        case 'r':
          if (!shortDef.toLowerCase().startsWith('in ') && 
              !shortDef.toLowerCase().startsWith('with ') &&
              !shortDef.toLowerCase().startsWith('by ')) {
            shortDef = 'In a manner that is ' + shortDef.charAt(0).toLowerCase() + shortDef.slice(1);
          }
          break;
      }
    }
    
    return shortDef;
  } catch (error) {
    console.error(`Error generating definition for ${word}:`, error);
    return `A ${pos || 'word'} related to ${word}`;
  }
}

// Fetch a batch of words that don't have short definitions yet
async function fetchWordBatch() {
  const { data, error } = await supabase
    .from('words')
    .select('id, word, definitions, pos, short_definition')
    .is('short_definition', null)
    .gt('id', lastProcessedId)
    .order('id', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('Error fetching words:', error);
    return [];
  }

  return data || [];
}

// Update a word with its new short definition
async function updateWordDefinition(id, shortDefinition) {
  const { error } = await supabase
    .from('words')
    .update({ short_definition: shortDefinition })
    .eq('id', id);
  
  if (error) {
    console.error(`Error updating word ID ${id}:`, error);
    totalErrors++;
    return false;
  }
  
  totalUpdated++;
  return true;
}

// Main processing function
async function processWords() {
  try {
    // First, ensure the short_definition column exists
    await addShortDefinitionColumn();
    
    console.log('Starting word processing...');
    let continueFetching = true;
    
    while (continueFetching) {
      const wordBatch = await fetchWordBatch();
      
      if (wordBatch.length === 0) {
        console.log('No more words to process.');
        continueFetching = false;
        break;
      }
      
      console.log(`Processing batch of ${wordBatch.length} words...`);
      
      for (const wordData of wordBatch) {
        const { id, word, definitions, pos } = wordData;
        
        // Skip if we've already processed this word
        if (processedWords.has(word)) {
          continue;
        }
        
        // Track the last processed ID for pagination
        lastProcessedId = id;
        processedWords.add(word);
        
        console.log(`Processing word: ${word} (ID: ${id})`);
        
        // Generate the short definition
        const shortDefinition = generateShortDefinition(word, definitions, pos);
        
        if (shortDefinition) {
          // Update the word with the new short definition
          const updated = await updateWordDefinition(id, shortDefinition);
          if (updated) {
            console.log(`Updated: ${word} - Short definition: ${shortDefinition}`);
          }
        } else {
          console.log(`Skipped: ${word} - Could not generate a short definition.`);
          totalErrors++;
        }
        
        totalProcessed++;
      }
      
      // Summary after each batch
      console.log(`
Batch summary:
- Words processed: ${wordBatch.length}
- Total processed: ${totalProcessed}
- Total updated: ${totalUpdated}
- Total errors: ${totalErrors}
      `);
      
      // If we processed fewer words than the batch size, we're done
      if (wordBatch.length < BATCH_SIZE) {
        continueFetching = false;
      } else {
        // Add a delay between batches to avoid rate limiting
        console.log(`Waiting ${DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    console.log(`
Processing complete!
- Total words processed: ${totalProcessed}
- Total words updated: ${totalUpdated}
- Total errors: ${totalErrors}
    `);
    
  } catch (error) {
    console.error('Error in processWords:', error);
  }
}

// Start the process
processWords()
  .catch(error => {
    console.error('Error in main process:', error);
  }); 