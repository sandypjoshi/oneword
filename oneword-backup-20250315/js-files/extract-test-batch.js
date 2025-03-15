require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const BATCH_SIZE = 20; // Small test batch
const OUTPUT_FILE = 'test-batch-for-definitions.json';
const WORDNET_RELATIONSHIPS_FILE = 'wordnet-relationships.json';

async function extractTestBatch() {
  console.log('Extracting test batch of eligible single words...');
  
  try {
    // Get eligible single words (no spaces, no underscores)
    // Note: enrichment_eligible is a string field with values like "eligible-word"
    const { data: eligibleWords, error } = await supabase
      .from('words')
      .select(`
        id, 
        word,
        pos,
        difficulty_level
      `)
      .eq('enrichment_eligible', 'eligible-word') // Using string value instead of boolean
      .not('word', 'like', '% %') // No spaces
      .not('word', 'like', '%\\_%', { rejectOnNothing: true }) // No underscores
      .not('word', 'like', '%-%') // No hyphens for simplicity in this test
      .order('difficulty_score', { ascending: true }) // Start with easier words
      .limit(BATCH_SIZE);
    
    if (error) {
      console.error('Error fetching eligible words:', error);
      return;
    }
    
    if (!eligibleWords || eligibleWords.length === 0) {
      console.log('No eligible words found.');
      return;
    }
    
    console.log(`Found ${eligibleWords.length} eligible words.`);
    
    // Get primary definitions for these words from word_definitions view
    const wordList = eligibleWords.map(w => w.word);
    const { data: definitions, error: defError } = await supabase
      .from('word_definitions')
      .select('word, definition, pos, domain, synset_id, sense_number')
      .in('word', wordList)
      .eq('sense_number', 1) // Primary sense only
      .order('word');
    
    if (defError) {
      console.error('Error fetching definitions:', defError);
      return;
    }
    
    // Combine word data with primary definitions
    const wordsWithDefs = eligibleWords.map(word => {
      const primaryDef = definitions.find(d => d.word === word.word);
      return {
        id: word.id,
        word: word.word,
        pos: word.pos || (primaryDef ? primaryDef.pos : null),
        definition: primaryDef ? primaryDef.definition : null,
        domain: primaryDef ? primaryDef.domain : null,
        synset_id: primaryDef ? primaryDef.synset_id : null,
        difficulty_level: word.difficulty_level
      };
    });
    
    // Filter out words with no definitions
    const finalWords = wordsWithDefs.filter(w => w.definition);
    
    console.log(`Final count: ${finalWords.length} words with definitions.`);
    
    // Write words to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalWords, null, 2));
    
    console.log(`Words saved to ${OUTPUT_FILE}`);
    
    // Also generate a formatted text version for easy copying to Claude
    const formattedText = finalWords.map(word => {
      let text = `Word: ${word.word}\n`;
      text += `POS: ${word.pos || 'unknown'}\n`;
      text += `Definition: ${word.definition}\n`;
      if (word.domain) {
        text += `Domain: ${word.domain}\n`;
      }
      text += `Difficulty Level: ${word.difficulty_level || 'unknown'}\n`;
      text += '---\n';
      return text;
    }).join('\n');
    
    fs.writeFileSync('test-batch-for-claude.txt', formattedText);
    console.log('Formatted text version saved to test-batch-for-claude.txt');
    
    console.log('\nNext steps:');
    console.log('1. Upload test-batch-for-claude.txt to Claude');
    console.log('2. Use the improved prompt to generate learner-friendly short definitions');
    console.log('3. Save Claude\'s output to short-definitions-test.txt');
    
    return finalWords;
    
  } catch (err) {
    console.error('Unexpected error:', err);
    return [];
  }
}

// Enhanced function to fetch WordNet relationships for distractor generation
async function fetchWordNetRelationships(words) {
  console.log('Fetching WordNet relationships for distractor generation...');
  
  const wordNetData = {};
  const synsetIds = words.filter(w => w.synset_id).map(w => w.synset_id);
  
  if (synsetIds.length === 0) {
    console.warn('No synset IDs found. Cannot fetch WordNet relationships.');
    return wordNetData;
  }
  
  try {
    // 1. Fetch hypernyms (broader terms)
    const { data: hypernyms, error: hypError } = await supabase
      .from('relationships')
      .select('from_synset_id, to_synset_id')
      .in('from_synset_id', synsetIds)
      .eq('relationship_type', 'hypernym');
    
    if (hypError) {
      console.error('Error fetching hypernyms:', hypError);
    } else {
      console.log(`Found ${hypernyms?.length || 0} hypernym relationships.`);
    }
    
    // 2. Fetch hyponyms (narrower terms)
    const { data: hyponyms, error: hypoError } = await supabase
      .from('relationships')
      .select('from_synset_id, to_synset_id')
      .in('to_synset_id', synsetIds)
      .eq('relationship_type', 'hypernym'); // Note: inverting hypernym gives us hyponyms
    
    if (hypoError) {
      console.error('Error fetching hyponyms:', hypoError);
    } else {
      console.log(`Found ${hyponyms?.length || 0} hyponym relationships.`);
    }
    
    // 3. Get all unique synset IDs from relationships
    const relatedSynsetIds = new Set();
    
    // Add hypernym synsets
    if (hypernyms && hypernyms.length > 0) {
      hypernyms.forEach(rel => relatedSynsetIds.add(rel.to_synset_id));
    }
    
    // Add hyponym synsets
    if (hyponyms && hyponyms.length > 0) {
      hyponyms.forEach(rel => relatedSynsetIds.add(rel.from_synset_id));
    }
    
    console.log(`Found ${relatedSynsetIds.size} related synsets.`);
    
    // 4. Fetch words for these synsets (potential distractors)
    if (relatedSynsetIds.size > 0) {
      const { data: relatedWords, error: wordError } = await supabase
        .from('word_synsets')
        .select('word, synset_id')
        .in('synset_id', Array.from(relatedSynsetIds));
      
      if (wordError) {
        console.error('Error fetching related words:', wordError);
      } else if (relatedWords && relatedWords.length > 0) {
        console.log(`Found ${relatedWords.length} potential distractor words.`);
        
        // 5. Organize WordNet relationships by original word
        for (const word of words) {
          if (!word.synset_id) continue;
          
          const wordRelationships = {
            synonyms: [],
            hypernyms: [],
            hyponyms: [],
            cohyponyms: []
          };
          
          // Find hypernyms
          const wordHypernyms = hypernyms
            ?.filter(rel => rel.from_synset_id === word.synset_id)
            .map(rel => rel.to_synset_id) || [];
          
          // Find hyponyms
          const wordHyponyms = hyponyms
            ?.filter(rel => rel.to_synset_id === word.synset_id)
            .map(rel => rel.from_synset_id) || [];
          
          // Find words for each relationship type
          if (wordHypernyms.length > 0) {
            wordRelationships.hypernyms = relatedWords
              .filter(rw => wordHypernyms.includes(rw.synset_id))
              .map(rw => rw.word);
          }
          
          if (wordHyponyms.length > 0) {
            wordRelationships.hyponyms = relatedWords
              .filter(rw => wordHyponyms.includes(rw.synset_id))
              .map(rw => rw.word);
          }
          
          // Find co-hyponyms (siblings) - words that share a hypernym with the target word
          if (wordHypernyms.length > 0) {
            const siblings = new Set();
            
            for (const hypernymId of wordHypernyms) {
              // Find all words that have this hypernym
              const siblingRelations = hyponyms
                ?.filter(rel => rel.to_synset_id === hypernymId && rel.from_synset_id !== word.synset_id) || [];
              
              const siblingIds = siblingRelations.map(rel => rel.from_synset_id);
              
              if (siblingIds.length > 0) {
                const siblingWords = relatedWords
                  .filter(rw => siblingIds.includes(rw.synset_id))
                  .map(rw => rw.word);
                
                siblingWords.forEach(sw => siblings.add(sw));
              }
            }
            
            wordRelationships.cohyponyms = Array.from(siblings);
          }
          
          // Find synonyms (words from the same synset)
          wordRelationships.synonyms = relatedWords
            .filter(rw => rw.synset_id === word.synset_id && rw.word !== word.word)
            .map(rw => rw.word);
          
          // Store the relationships
          wordNetData[word.word] = wordRelationships;
        }
      }
    }
    
    // Save WordNet relationships to a file
    fs.writeFileSync(WORDNET_RELATIONSHIPS_FILE, JSON.stringify(wordNetData, null, 2));
    console.log(`WordNet relationships saved to ${WORDNET_RELATIONSHIPS_FILE}`);
    
    return wordNetData;
    
  } catch (err) {
    console.error('Error fetching WordNet relationships:', err);
    return {};
  }
}

// Enhanced function to prepare distractors with WordNet data
async function extractTestBatchForDistractors(words, wordNetData) {
  console.log('\nExtracting test batch for distractor generation with WordNet relationships...');
  
  try {
    // If no words provided, load them from file
    if (!words || words.length === 0) {
      if (!fs.existsSync(OUTPUT_FILE)) {
        console.log('Please run extractTestBatch() first.');
        return;
      }
      
      words = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    }
    
    // If no WordNet data provided, load it from file if exists
    if (!wordNetData || Object.keys(wordNetData).length === 0) {
      if (fs.existsSync(WORDNET_RELATIONSHIPS_FILE)) {
        wordNetData = JSON.parse(fs.readFileSync(WORDNET_RELATIONSHIPS_FILE, 'utf8'));
      }
    }
    
    // Create a formatted text version for Claude with WordNet relationship guidance
    const formattedText = words.map(word => {
      let text = `Word: ${word.word}\n`;
      text += `POS: ${word.pos || 'unknown'}\n`;
      text += `Definition: ${word.definition}\n`;
      if (word.domain) {
        text += `Domain: ${word.domain}\n`;
      }
      text += `Difficulty: ${word.difficulty_level || 'intermediate'}\n`;
      
      // Add WordNet relationship hints if available
      const relationships = wordNetData[word.word];
      if (relationships) {
        if (relationships.synonyms.length > 0) {
          text += `Synonyms: ${relationships.synonyms.join(', ')}\n`;
        }
        if (relationships.hypernyms.length > 0) {
          text += `Broader Terms: ${relationships.hypernyms.join(', ')}\n`;
        }
        if (relationships.hyponyms.length > 0) {
          text += `Narrower Terms: ${relationships.hyponyms.join(', ')}\n`;
        }
        if (relationships.cohyponyms.length > 0) {
          text += `Related Terms: ${limitArray(relationships.cohyponyms, 5).join(', ')}\n`;
        }
      }
      
      text += '---\n';
      return text;
    }).join('\n');
    
    fs.writeFileSync('test-batch-for-distractors.txt', formattedText);
    console.log('Enhanced text for distractors saved to test-batch-for-distractors.txt');
    
    console.log('\nNext steps for distractors:');
    console.log('1. Upload test-batch-for-distractors.txt to Claude');
    console.log('2. Use the improved prompt with WordNet guidance to generate distractors');
    console.log('3. Save Claude\'s output to distractors-test.json');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Helper function to limit array size with random selection
function limitArray(array, maxSize) {
  if (!array || array.length <= maxSize) return array || [];
  
  const result = [];
  const indices = new Set();
  
  while (indices.size < maxSize) {
    const randomIndex = Math.floor(Math.random() * array.length);
    if (!indices.has(randomIndex)) {
      indices.add(randomIndex);
      result.push(array[randomIndex]);
    }
  }
  
  return result;
}

// Run both extraction processes
async function run() {
  const words = await extractTestBatch();
  const wordNetData = await fetchWordNetRelationships(words);
  await extractTestBatchForDistractors(words, wordNetData);
}

run(); 