// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Create a Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  try {
    // Parse request body
    const { word, count = 3, forceRefresh = false } = await req.json();
    
    if (!word) {
      return new Response(
        JSON.stringify({ error: 'Word parameter is required' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get word data with definitions
    const { data: wordData, error: wordError } = await supabaseClient
      .from('words')
      .select(`
        id, 
        word, 
        pos, 
        definitions,
        examples
      `)
      .eq('word', word.toLowerCase())
      .maybeSingle();
    
    if (wordError || !wordData) {
      return new Response(
        JSON.stringify({ error: `Word "${word}" not found in database` }),
        { headers: { 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Get related synsets for this word
    const { data: wordSynsets, error: synsetError } = await supabaseClient
      .from('word_synsets')
      .select('synset_id, synsets:synset_id(id, definition, pos, domain)')
      .eq('word_id', wordData.id);
      
    if (synsetError) {
      console.error('Error fetching synsets:', synsetError);
    }
    
    // Check if we have existing distractors and not forcing refresh
    if (!forceRefresh) {
      const { data: existingDistractors } = await supabaseClient
        .from('distractors')
        .select('distractors')
        .eq('word', word.toLowerCase())
        .maybeSingle();
        
      if (existingDistractors?.distractors?.length > 0) {
        return new Response(
          JSON.stringify({ 
            word: word.toLowerCase(), 
            distractors: existingDistractors.distractors.slice(0, count) 
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Check if we have definitions
    const definitions = Array.isArray(wordData.definitions) ? wordData.definitions : [];
    const definition = definitions.length > 0 ? definitions[0] : "";
    
    // If no definition is available, generate fallback distractors
    if (!definition) {
      console.log(`No definition found for word "${word}", generating fallback distractors`);
      
      // Generate fallback distractors that don't depend on definition
      const fallbackDistractors = [];
      for (let i = 0; i < count; i++) {
        fallbackDistractors.push({
          word: generateFallbackDistractor(word, "", i),
          definition: `Similar to "${word}" but different meaning`,
          similarity: "morphological",
          source: "fallback",
          quality_score: 0.3
        });
      }
      
      // Store fallback distractors
      await supabaseClient
        .from('distractors')
        .upsert({
          word: word.toLowerCase(),
          distractors: fallbackDistractors,
          updated_at: new Date().toISOString()
        }, { onConflict: 'word' });
      
      return new Response(
        JSON.stringify({ 
          word: word.toLowerCase(), 
          distractors: fallbackDistractors,
          note: "Using fallback distractors due to missing definition"
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Use normal distractor generation if definition is available
    const distractors = await generateDistractors(
      word, 
      definition, 
      wordData, 
      wordSynsets || [],
      count
    );
    
    // Store distractors
    await supabaseClient
      .from('distractors')
      .upsert({
        word: word.toLowerCase(),
        distractors,
        updated_at: new Date().toISOString()
      }, { onConflict: 'word' });
    
    return new Response(
      JSON.stringify({ word: word.toLowerCase(), distractors }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Generates distractors using multiple strategies
 */
async function generateDistractors(
  word: string, 
  definition: string, 
  wordData: any, 
  wordSynsets: any[],
  count: number
) {
  const distractors: any[] = [];
  const usedDistractors = new Set();
  
  // 1. Get WordNet-based distractors (from relationships)
  const wordnetDistractors = await getWordNetDistractors(word, wordData, wordSynsets);
  for (const distractor of wordnetDistractors) {
    if (!usedDistractors.has(distractor.distractor)) {
      distractors.push(distractor);
      usedDistractors.add(distractor.distractor);
    }
    
    if (distractors.length >= count) break;
  }
  
  // 2. Enhanced Datamuse integration
  if (distractors.length < count) {
    const datamuseDistractors = await getEnhancedDatamuseDistractors(word, definition, wordData.pos);
    for (const distractor of datamuseDistractors) {
      if (!usedDistractors.has(distractor.distractor)) {
        distractors.push(distractor);
        usedDistractors.add(distractor.distractor);
      }
      
      if (distractors.length >= count) break;
    }
  }
  
  // 3. Generate fallback distractors if needed
  while (distractors.length < count) {
    const fallbackDistractor = generateFallbackDistractor(word, definition, distractors.length);
    if (!usedDistractors.has(fallbackDistractor.distractor)) {
      distractors.push(fallbackDistractor);
      usedDistractors.add(fallbackDistractor.distractor);
    }
  }
  
  return distractors;
}

/**
 * Gets WordNet-based distractors using relationships table
 */
async function getWordNetDistractors(word: string, wordData: any, wordSynsets: any[]) {
  const distractors: any[] = [];
  
  if (!wordSynsets || wordSynsets.length === 0) {
    return distractors;
  }
  
  // Extract synset IDs
  const synsetIds = wordSynsets.map(ws => ws.synset_id).filter(id => id);
  
  if (synsetIds.length === 0) {
    return distractors;
  }
  
  // Get related synsets via relationships table
  const { data: relationships } = await supabaseClient
    .from('relationships')
    .select('relationship_type, to_synset_id')
    .in('from_synset_id', synsetIds)
    .in('relationship_type', ['hypernym', 'hyponym', 'similar_to']);
  
  if (!relationships || relationships.length === 0) {
    return distractors;
  }
  
  // For each relationship, find words associated with the target synset
  for (const relationship of relationships) {
    const { data: relatedWordSynsets } = await supabaseClient
      .from('word_synsets')
      .select('word_id')
      .eq('synset_id', relationship.to_synset_id)
      .limit(5);
    
    if (!relatedWordSynsets || relatedWordSynsets.length === 0) continue;
    
    // Get the actual words
    const wordIds = relatedWordSynsets.map(rws => rws.word_id);
    const { data: relatedWords } = await supabaseClient
      .from('words')
      .select('word, definitions')
      .in('id', wordIds);
    
    if (!relatedWords || relatedWords.length === 0) continue;
    
    for (const relatedWord of relatedWords) {
      // Skip if this is the same as our target word
      if (relatedWord.word.toLowerCase() === word.toLowerCase()) {
        continue;
      }
      
      // Define relationship-specific description
      let relationshipDesc = '';
      switch (relationship.relationship_type) {
        case 'hypernym':
          relationshipDesc = `A more general term than "${word}"`;
          break;
        case 'hyponym':
          relationshipDesc = `A more specific type of "${word}"`;
          break;
        case 'similar_to':
          relationshipDesc = `Similar in meaning to "${word}"`;
          break;
        default:
          relationshipDesc = `Related to "${word}"`;
      }
      
      // Add as a distractor
      distractors.push({
        distractor: relatedWord.word,
        definition: relatedWord.definitions?.[0] || relationshipDesc,
        distractor_type: relationship.relationship_type,
        semantic_similarity: 0.7, // Moderate similarity for WordNet relations
        quality_score: 6.0, // Higher quality for WordNet-based distractors
        source: 'wordnet'
      });
    }
  }
  
  return distractors;
}

/**
 * Gets enhanced distractors from Datamuse API using multiple parameters
 */
async function getEnhancedDatamuseDistractors(word: string, definition: string, pos: string = '') {
  const distractors: any[] = [];
  const usedWords = new Set();
  
  try {
    // 1. Words with similar meaning
    await addDatamuseWords(
      `https://api.datamuse.com/words?ml=${encodeURIComponent(word)}&max=7`,
      'semantic',
      `Similar in meaning to "${word}"`,
      5.0,
      distractors,
      usedWords,
      word
    );
    
    // 2. Words that sound like our target word
    await addDatamuseWords(
      `https://api.datamuse.com/words?sl=${encodeURIComponent(word)}&max=5`,
      'phonetic',
      `Sounds like "${word}"`,
      4.0,
      distractors,
      usedWords,
      word
    );
    
    // 3. Words with similar spelling
    await addDatamuseWords(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&max=5`,
      'spelling',
      `Similar spelling to "${word}"`,
      3.5,
      distractors,
      usedWords,
      word
    );
    
    // 4. If we have part of speech, try to get words with same POS
    if (pos) {
      let datamusePOS = '';
      // Map our POS to Datamuse expected format
      if (pos === 'noun' || pos === 'n') datamusePOS = 'n';
      else if (pos === 'verb' || pos === 'v') datamusePOS = 'v';
      else if (pos === 'adjective' || pos === 'adj' || pos === 'a') datamusePOS = 'adj';
      else if (pos === 'adverb' || pos === 'adv' || pos === 'r') datamusePOS = 'adv';
      
      if (datamusePOS) {
        await addDatamuseWords(
          `https://api.datamuse.com/words?ml=${encodeURIComponent(word)}&sp=${encodeURIComponent(`*`)}&md=p&max=10`,
          'same_pos',
          `Same part of speech as "${word}"`,
          4.5,
          distractors,
          usedWords,
          word,
          (item) => item.tags && item.tags.includes(datamusePOS)
        );
      }
    }
    
    // 5. Words that are contextually related
    await addDatamuseWords(
      `https://api.datamuse.com/words?rel_trg=${encodeURIComponent(word)}&max=5`,
      'trigger',
      `Triggered by "${word}"`,
      4.2,
      distractors,
      usedWords,
      word
    );
    
  } catch (error) {
    console.error('Error fetching from Datamuse:', error);
  }
  
  return distractors;
}

/**
 * Helper function to fetch and add Datamuse words
 */
async function addDatamuseWords(
  url: string,
  type: string,
  definitionPrefix: string,
  qualityScore: number,
  distractors: any[],
  usedWords: Set<string>,
  originalWord: string,
  filter?: (item: any) => boolean
) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.length > 0) {
      for (const item of data) {
        // Skip if no word or same as original or already used
        if (!item.word || 
            item.word.toLowerCase() === originalWord.toLowerCase() ||
            usedWords.has(item.word.toLowerCase())) {
          continue;
        }
        
        // Apply custom filter if provided
        if (filter && !filter(item)) {
          continue;
        }
        
        // Add to distractors
        distractors.push({
          distractor: item.word,
          definition: definitionPrefix,
          distractor_type: type,
          semantic_similarity: item.score ? Math.min(item.score / 10000, 1) : 0.6,
          quality_score: qualityScore,
          source: 'datamuse'
        });
        
        // Track used words
        usedWords.add(item.word.toLowerCase());
      }
    }
  } catch (error) {
    console.error(`Error fetching Datamuse words (${type}):`, error);
  }
}

/**
 * Generates a fallback distractor when other methods fail
 */
function generateFallbackDistractor(word: string, correctDefinition: string, index: number) {
  // Enhanced version to provide better fallbacks
  
  // Common prefixes and suffixes for morphological variants
  const prefixes = ['un', 're', 'dis', 'in', 'im', 'non', 'anti', 'de', 'over', 'under'];
  const suffixes = ['ment', 'ness', 'ity', 'tion', 'sion', 'ance', 'ence', 'ing', 'ed', 'er', 'or'];
  
  // Common letter substitutions for visually similar distractors
  const substitutions: { [key: string]: string[] } = {
    'a': ['e', 'o'], 'e': ['a', 'i'], 'i': ['e', 'y'], 'o': ['a', 'u'], 'u': ['o', 'y'],
    'b': ['d', 'p'], 'd': ['b', 'p'], 'g': ['j', 'q'], 'm': ['n', 'w'], 'n': ['m', 'r'],
    'c': ['k', 's'], 'k': ['c', 'q'], 's': ['c', 'z']
  };
  
  // Use different strategies based on index
  let distractor = word;
  
  switch (index % 4) {
    case 0:
      // Add prefix
      if (word.length > 3) {
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        distractor = prefix + word;
      } else {
        // For very short words, double a letter
        const pos = Math.floor(Math.random() * word.length);
        distractor = word.slice(0, pos) + word[pos] + word.slice(pos);
      }
      break;
      
    case 1:
      // Add suffix
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      // Remove trailing 'e' if present before adding certain suffixes
      if (word.endsWith('e') && (suffix === 'ing' || suffix === 'ed' || suffix === 'er')) {
        distractor = word.slice(0, -1) + suffix;
      } else {
        distractor = word + suffix;
      }
      break;
      
    case 2:
      // Letter substitution
      if (word.length > 2) {
        const pos = Math.floor(Math.random() * word.length);
        const letter = word[pos].toLowerCase();
        
        if (substitutions[letter]) {
          const replacement = substitutions[letter][Math.floor(Math.random() * substitutions[letter].length)];
          distractor = word.slice(0, pos) + replacement + word.slice(pos + 1);
        } else {
          // If no substitution defined, swap two adjacent letters
          if (pos < word.length - 1) {
            distractor = word.slice(0, pos) + word[pos + 1] + word[pos] + word.slice(pos + 2);
          }
        }
      }
      break;
      
    case 3:
      // Letter transposition (swap adjacent letters)
      if (word.length > 2) {
        const pos = Math.floor(Math.random() * (word.length - 1));
        distractor = word.slice(0, pos) + word[pos + 1] + word[pos] + word.slice(pos + 2);
      }
      break;
  }
  
  // Make sure we didn't generate the original word
  if (distractor === word) {
    // Fallback - append or prepend a letter
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    
    distractor = (index % 2 === 0) ? randomLetter + word : word + randomLetter;
  }
  
  return distractor;
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-distractors' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"word":"happy","count":3,"forceRefresh":true}'

*/ 