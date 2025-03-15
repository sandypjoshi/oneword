/**
 * Definition and Example Extractor for OneWord App
 * 
 * This script extracts definitions and examples from WordNet synsets
 * and updates the words table with this information, ensuring proper
 * separation between definitions and examples.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parse a WordNet gloss into definition and examples
 * WordNet glosses typically have the definition followed by examples in quotes
 */
function parseGloss(gloss) {
  if (!gloss) return { definition: '', examples: [] };
  
  // Split by semicolons (often separates definition from examples)
  const parts = gloss.split(';');
  const definition = parts[0].trim();
  const examples = [];
  
  // Extract examples (typically in quotes)
  for (let i = 1; i < parts.length; i++) {
    // Look for text in quotes
    const exampleMatches = parts[i].match(/"([^"]+)"/g);
    if (exampleMatches) {
      examples.push(...exampleMatches.map(ex => ex.slice(1, -1).trim()));
    } else if (parts[i].trim()) {
      // If no quotes but content exists, might be part of definition
      // or an example without quotes
      const text = parts[i].trim();
      if (text.startsWith('e.g.,') || text.startsWith('ex.')) {
        // Clearly marked as example
        examples.push(text.replace(/^(e\.g\.,|ex\.)/, '').trim());
      }
    }
  }
  
  return { definition, examples };
}

/**
 * Fetch all synsets and extract definitions/examples
 */
async function extractDefinitionsAndExamples() {
  console.log('Fetching synsets from database...');
  
  // Process in batches to avoid memory issues
  let startId = 0;
  const batchSize = 1000;
  let totalProcessed = 0;
  
  while (true) {
    // Fetch a batch of synsets
    const { data: synsets, error } = await supabase
      .from('synsets')
      .select('id, definition, word_synsets(word_id)')
      .order('id')
      .gt('id', startId)
      .limit(batchSize);
      
    if (error) {
      console.error('Error fetching synsets:', error);
      process.exit(1);
    }
    
    if (!synsets || synsets.length === 0) {
      break; // No more synsets
    }
    
    console.log(`Processing batch of ${synsets.length} synsets...`);
    
    // Extract and process each synset
    for (const synset of synsets) {
      if (!synset.definition) continue;
      
      // Parse the gloss into definition and examples
      const { definition, examples } = parseGloss(synset.definition);
      
      // Update words linked to this synset
      if (synset.word_synsets && synset.word_synsets.length > 0) {
        for (const link of synset.word_synsets) {
          if (!link.word_id) continue;
          
          // Get the current word data
          const { data: wordData, error: wordError } = await supabase
            .from('words')
            .select('definitions, examples')
            .eq('id', link.word_id)
            .single();
            
          if (wordError) {
            console.error(`Error fetching word ${link.word_id}:`, wordError);
            continue;
          }
          
          // Prepare the arrays for updates
          const definitions = Array.isArray(wordData.definitions) 
            ? [...wordData.definitions] 
            : [];
            
          const wordExamples = Array.isArray(wordData.examples) 
            ? [...wordData.examples] 
            : [];
          
          // Add new definition if it doesn't exist
          if (definition && !definitions.includes(definition)) {
            definitions.push(definition);
          }
          
          // Add new examples if they don't exist
          for (const example of examples) {
            if (!wordExamples.includes(example)) {
              wordExamples.push(example);
            }
          }
          
          // Update the word with new definitions and examples
          const { error: updateError } = await supabase
            .from('words')
            .update({
              definitions,
              examples: wordExamples,
              updated_at: new Date().toISOString()
            })
            .eq('id', link.word_id);
            
          if (updateError) {
            console.error(`Error updating word ${link.word_id}:`, updateError);
          }
        }
      }
      
      startId = synset.id; // Update starting point for next batch
    }
    
    totalProcessed += synsets.length;
    console.log(`Processed ${totalProcessed} synsets so far...`);
    
    if (synsets.length < batchSize) {
      break; // No more data
    }
  }
  
  console.log(`Completed processing ${totalProcessed} synsets`);
}

async function main() {
  try {
    console.log('Starting definition and example extraction...');
    await extractDefinitionsAndExamples();
    console.log('Extraction complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 