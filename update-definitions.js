/**
 * Update Short Definitions from Claude
 * 
 * This script takes the JSON output from Claude and updates
 * the app_words table with the short definitions.
 * 
 * Usage:
 * - node update-definitions.js --input definitions.json
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('input', {
    alias: 'i',
    type: 'string',
    description: 'Input JSON file with definitions from Claude',
    default: 'definitions.json'
  })
  .option('dry-run', {
    type: 'boolean',
    description: 'Show updates without applying them',
    default: false
  })
  .option('batch-size', {
    alias: 'b',
    type: 'number',
    description: 'Number of definitions to update in each batch',
    default: 25
  })
  .option('retry-failed', {
    alias: 'r',
    type: 'boolean',
    description: 'Retry failed updates',
    default: false
  })
  .option('max-retries', {
    type: 'number',
    description: 'Maximum number of retry attempts',
    default: 3
  })
  .help()
  .alias('help', 'h')
  .argv;

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be defined in .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Validate definition content
 * @param {Object} def - Definition object
 * @returns {Object} - Validation result
 */
function validateDefinition(def) {
  const issues = [];

  if (!def.id) issues.push('Missing ID');
  if (!def.word) issues.push('Missing word');
  if (!def.pos) issues.push('Missing part of speech');
  if (!def.shortDefinition) issues.push('Missing main definition');
  if (!def.owadPhrases || !Array.isArray(def.owadPhrases)) issues.push('Missing or invalid OWAD phrases array');
  
  // Check main definition length (should be brief)
  if (def.shortDefinition && def.shortDefinition.split(' ').length > 12) {
    issues.push('Main definition too long (exceeds 12 words)');
  }

  // Check OWAD phrases
  if (def.owadPhrases && Array.isArray(def.owadPhrases)) {
    if (def.owadPhrases.length !== 2) {
      issues.push('Must provide exactly 2 OWAD phrases');
    }
    
    def.owadPhrases.forEach((phrase, index) => {
      const wordCount = phrase.split(/[\s,-]+/).length;
      if (wordCount > 6) {
        issues.push(`OWAD phrase ${index + 1} too long (exceeds 6 words)`);
      }
      // Check for empty phrases or just punctuation
      if (phrase.trim().replace(/[^a-zA-Z0-9]/g, '').length === 0) {
        issues.push(`OWAD phrase ${index + 1} must contain actual words`);
      }
    });
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Update words with new definitions in batches
 * @param {Array} definitions - Definitions from Claude
 * @param {number} batchSize - Number of definitions per batch
 */
async function updateDefinitions(definitions, batchSize) {
  console.log(`Processing ${definitions.length} definitions in batches of ${batchSize}...`);
  
  let updateCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  const failed = [];
  
  // Process in batches
  for (let i = 0; i < definitions.length; i += batchSize) {
    const batch = definitions.slice(i, i + batchSize);
    console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(definitions.length/batchSize)}`);
    
    for (const def of batch) {
      // Validate definition
      const validation = validateDefinition(def);
      if (!validation.valid) {
        console.warn(`Skipping invalid definition for "${def.word || 'unknown'}": ${validation.issues.join(', ')}`);
        skippedCount++;
        continue;
      }

      if (argv['dry-run']) {
        console.log(`[DRY RUN] Would update: ${def.word} (ID: ${def.id}):`);
        console.log(`  Definition: "${def.shortDefinition}"`);
        console.log(`  OWAD phrases:`);
        def.owadPhrases.forEach((phrase, i) => console.log(`    ${i + 1}. "${phrase}"`));
        updateCount++;
        continue;
      }

      try {
        const { error } = await supabase
          .from('app_words')
          .update({
            short_definition: def.shortDefinition,
            owad_phrase: def.owadPhrases,
            definition_source: 'claude',
            definition_updated_at: new Date().toISOString()
          })
          .eq('id', def.id);

        if (error) {
          // If the error is about owad_phrase column type, try updating just the definition
          if (error.message && (error.message.includes('column "owad_phrase" does not exist') || 
              error.message.includes('invalid input syntax for type text'))) {
            const { error: fallbackError } = await supabase
              .from('app_words')
              .update({
                short_definition: def.shortDefinition,
                definition_source: 'claude',
                definition_updated_at: new Date().toISOString()
              })
              .eq('id', def.id);
            
            if (fallbackError) {
              console.error(`Error updating ${def.word} (ID: ${def.id}):`, fallbackError);
              errorCount++;
              failed.push(def);
            } else {
              console.log(`Updated (definition only): ${def.word} (ID: ${def.id}): "${def.shortDefinition}"`);
              console.warn('Note: owad_phrase column not available or not compatible with array type');
              updateCount++;
            }
          } else {
            console.error(`Error updating ${def.word} (ID: ${def.id}):`, error);
            errorCount++;
            failed.push(def);
          }
        } else {
          console.log(`Updated: ${def.word} (ID: ${def.id}):`);
          console.log(`  Definition: "${def.shortDefinition}"`);
          console.log(`  OWAD phrases:`);
          def.owadPhrases.forEach((phrase, i) => console.log(`    ${i + 1}. "${phrase}"`));
          updateCount++;
        }
      } catch (err) {
        console.error(`Exception updating ${def.word} (ID: ${def.id}):`, err);
        errorCount++;
        failed.push(def);
      }
    }
    
    // Add a small delay between batches
    if (i + batchSize < definitions.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Retry failed updates if requested
  if (argv['retry-failed'] && failed.length > 0) {
    console.log(`\nRetrying ${failed.length} failed updates...`);
    for (let retry = 0; retry < argv['max-retries']; retry++) {
      if (failed.length === 0) break;
      
      console.log(`Retry attempt ${retry + 1}/${argv['max-retries']}...`);
      const retryFailed = [...failed];
      failed.length = 0; // Clear the array
      
      for (const def of retryFailed) {
        try {
          const { error } = await supabase
            .from('app_words')
            .update({
              short_definition: def.shortDefinition,
              owad_phrase: def.owadPhrases,
              definition_source: 'claude',
              definition_updated_at: new Date().toISOString()
            })
            .eq('id', def.id);

          if (error) {
            console.error(`Retry failed for ${def.word} (ID: ${def.id}):`, error);
            failed.push(def);
          } else {
            console.log(`Retry successful for ${def.word} (ID: ${def.id})`);
            updateCount++;
            errorCount--;
          }
        } catch (err) {
          console.error(`Exception in retry for ${def.word} (ID: ${def.id}):`, err);
          failed.push(def);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }

  console.log(`\nUpdate summary:`);
  console.log(`- Total processed: ${definitions.length}`);
  console.log(`- Successfully updated: ${updateCount}`);
  console.log(`- Errors: ${errorCount}`);
  console.log(`- Skipped: ${skippedCount}`);
  
  if (failed.length > 0) {
    const failedWordsOutput = path.join(path.dirname(argv.input), 'failed-definitions.json');
    fs.writeFileSync(failedWordsOutput, JSON.stringify(failed, null, 2));
    console.log(`Failed definitions saved to ${failedWordsOutput}`);
  }
}

/**
 * Extract JSON from text (handles markdown code blocks)
 * @param {string} text - Text containing JSON
 * @returns {object|null} - Parsed JSON or null if invalid
 */
function extractJson(text) {
  try {
    // First try direct parsing
    return JSON.parse(text);
  } catch (err) {
    // Try extracting from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (innerErr) {
        return null;
      }
    }
    
    // Try finding array with relaxed regex
    const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch (arrayErr) {
        return null;
      }
    }
    
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`Starting definition update from ${argv.input}`);
  
  // Check if input file exists
  if (!fs.existsSync(argv.input)) {
    console.error(`Error: Input file ${argv.input} not found`);
    process.exit(1);
  }

  // Read and parse definitions
  try {
    const fileContent = fs.readFileSync(argv.input, 'utf8');
    const definitions = extractJson(fileContent);
    
    if (!definitions) {
      console.error('Error: Could not parse JSON from input file');
      process.exit(1);
    }
    
    if (!Array.isArray(definitions)) {
      console.error('Error: Input file does not contain a JSON array');
      process.exit(1);
    }

    console.log(`Loaded ${definitions.length} definitions from ${argv.input}`);
    await updateDefinitions(definitions, argv['batch-size']);
    
  } catch (err) {
    console.error('Error processing input file:', err);
    process.exit(1);
  }
}

// Run the script with proper error handling
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 