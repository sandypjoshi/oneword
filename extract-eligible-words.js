// Script to extract eligible words from the database for AI definition generation
// Optimized to include essential WordNet data for balanced, concise definitions

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const BATCH_SIZE = 1000;
const OUTPUT_FILE = 'eligible-words-for-definitions.json';

/**
 * Fetches eligible words from word_families table
 * This ensures we only process words that meet our quality criteria
 */
async function extractEligibleWords() {
  console.log('Starting extraction of eligible words...');
  
  try {
    // Get words from word_families that meet our criteria
    const { data: eligibleWordsList, error: eligibleError } = await supabase
      .from('word_families')
      .select(`
        word,
        pos,
        frequency,
        difficulty_score,
        base_word,
        family_type
      `)
      .eq('enrichment_status', 'pending')
      .order('frequency', { ascending: false })  // Start with more common words
      .limit(BATCH_SIZE);
    
    if (eligibleError) {
      console.error('Error fetching eligible words:', eligibleError);
      return;
    }
    
    if (!eligibleWordsList || eligibleWordsList.length === 0) {
      console.log('No eligible words found.');
      return;
    }
    
    const eligibleWords = eligibleWordsList.map(w => w.word);
    console.log(`Found ${eligibleWords.length} eligible words to process.`);
    
    // Get definitions for these words from word_definitions view
    const { data: definitions, error: defError } = await supabase
      .from('word_definitions')
      .select('word, definition, pos, domain, sense_number, difficulty_level')
      .in('word', eligibleWords)
      .order('word')
      .order('sense_number');
    
    if (defError) {
      console.error('Error fetching definitions:', defError);
      return;
    }
    
    // Get examples for these words from word_with_examples view
    const { data: examples, error: exError } = await supabase
      .from('word_with_examples')
      .select('word, example')
      .in('word', eligibleWords);
    
    if (exError) {
      console.error('Error fetching examples:', exError);
    }
    
    // Get WordNet relationships
    const wordNetData = await getWordNetRelationships(eligibleWords);
    console.log(`Retrieved WordNet data for ${Object.keys(wordNetData).length} words`);
    
    // Combine all the data
    const combinedData = processData(eligibleWordsList, definitions, examples, wordNetData);
    
    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(combinedData, null, 2));
    
    console.log(`
=== EXTRACTION COMPLETE ===
- Found ${eligibleWords.length} eligible words
- Retrieved ${definitions ? definitions.length : 0} definitions
- Retrieved ${examples ? examples.length : 0} examples
- Retrieved WordNet data for ${Object.keys(wordNetData).length} words
- Combined data saved to ${OUTPUT_FILE}

Sample: ${JSON.stringify(combinedData.slice(0, 3), null, 2)}
    `);
    
    return combinedData;
  } catch (error) {
    console.error('Error in extraction process:', error);
  }
}

/**
 * Fetches WordNet relationships for words to enhance definition quality
 */
async function getWordNetRelationships(words) {
  try {
    console.log(`Fetching WordNet relationships for ${words.length} single words...`);
    
    // First get synsets and their domains for these words
    const { data: wordSynsets, error: wsError } = await supabase
      .from('word_synsets')
      .select(`
        word,
        synset:synsets!inner(
          id,
          definition,
          domain
        )
      `)
      .in('word', words);
    
    if (wsError) {
      console.error('Error fetching word synsets:', wsError);
      return {};
    }
    
    // Then get hypernyms for these synsets
    const synsetIds = wordSynsets?.map(ws => ws.synset.id) || [];
    const { data: hypernyms, error: hypError } = await supabase
      .from('relationships')
      .select(`
        from_synset_id,
        to_synset:synsets!relationships_to_synset_id_fkey(
          id,
          definition
        )
      `)
      .in('from_synset_id', synsetIds)
      .eq('relationship_type', 'hypernym');
    
    if (hypError) {
      console.error('Error fetching hypernyms:', hypError);
      return {};
    }
    
    // Create a map of synset IDs to their hypernyms
    const synsetHypernyms = {};
    hypernyms?.forEach(hyp => {
      if (!synsetHypernyms[hyp.from_synset_id]) {
        synsetHypernyms[hyp.from_synset_id] = [];
      }
      if (hyp.to_synset?.definition) {
        // Extract the main term from the hypernym definition
        const hypernymTerm = hyp.to_synset.definition.split(';')[0].trim();
        if (!synsetHypernyms[hyp.from_synset_id].includes(hypernymTerm)) {
          synsetHypernyms[hyp.from_synset_id].push(hypernymTerm);
        }
      }
    });
    
    // Create the final word map
    const wordNetMap = {};
    
    wordSynsets?.forEach(ws => {
      const word = ws.word;
      
      if (!wordNetMap[word]) {
        wordNetMap[word] = {
          hypernyms: [],
          domains: new Set()
        };
      }
      
      // Add domain if present
      if (ws.synset.domain) {
        wordNetMap[word].domains.add(ws.synset.domain);
      }
      
      // Add hypernyms if present
      const synsetHyps = synsetHypernyms[ws.synset.id] || [];
      synsetHyps.forEach(hyp => {
        if (!wordNetMap[word].hypernyms.includes(hyp)) {
          wordNetMap[word].hypernyms.push(hyp);
        }
      });
    });
    
    // Convert domain sets to arrays
    Object.keys(wordNetMap).forEach(word => {
      wordNetMap[word].domains = [...wordNetMap[word].domains];
    });
    
    console.log(`Successfully retrieved WordNet data for ${Object.keys(wordNetMap).length} words`);
    return wordNetMap;
    
  } catch (error) {
    console.error('Error getting WordNet relationships:', error);
    return {};
  }
}

/**
 * Combines all data into a structured format for definition generation
 */
function processData(wordsList, definitions, examples, wordNetData) {
  const wordMap = {};
  
  // First add base word data
  wordsList.forEach(wordInfo => {
    wordMap[wordInfo.word] = {
      word: wordInfo.word,
      base_word: wordInfo.base_word,
      family_type: wordInfo.family_type,
      pos: wordInfo.pos,
      frequency: wordInfo.frequency,
      difficulty_score: wordInfo.difficulty_score,
      definitions: [],
      examples: [],
      wordnet: wordNetData[wordInfo.word] || { hypernyms: [], domains: [] }
    };
  });
  
  // Process definitions
  if (definitions && definitions.length > 0) {
    definitions.forEach(def => {
      if (wordMap[def.word]) {
        wordMap[def.word].definitions.push({
          definition: def.definition,
          pos: def.pos,
          domain: def.domain,
          sense_number: def.sense_number,
          difficulty_level: def.difficulty_level
        });
      }
    });
  }
  
  // Process examples
  if (examples && examples.length > 0) {
    examples.forEach(ex => {
      if (wordMap[ex.word]) {
        // Avoid duplicates
        if (!wordMap[ex.word].examples.includes(ex.example)) {
          wordMap[ex.word].examples.push(ex.example);
        }
      }
    });
  }
  
  // Convert to array
  return Object.values(wordMap);
}

// Execute the main function
extractEligibleWords().catch(error => {
  console.error('Unhandled error in extraction process:', error);
  process.exit(1);
}); 