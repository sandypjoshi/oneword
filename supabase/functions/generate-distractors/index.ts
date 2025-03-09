// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Edge Function for Generating High-Quality Distractors for Word Quizzes
 * 
 * This function uses a multi-strategy approach to generate distractor definitions:
 * 1. WordNet semantic relations (from our database)
 * 2. Datamuse API for semantic similarity
 * 3. Datamuse API for phonetic similarity
 * 4. Definition transformation techniques
 * 
 * The function includes caching, quality scoring, and tracking mechanisms
 * to improve distractor quality over time based on user interactions.
 */

// Create a Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Datamuse API configuration
const DATAMUSE_BASE_URL = 'https://api.datamuse.com/words';
const DATAMUSE_RATE_LIMIT = 1000; // 1000ms between calls
let lastDatamuseCall = 0;

// Cache for Datamuse API results to avoid duplicate calls
const datamuseCache = new Map();

// Configuration
const CONFIG = {
  DISTRACTOR_COUNT: 3,
  QUALITY_THRESHOLD: 0.6,
  POS_WEIGHT: 0.3,
  SIMILARITY_WEIGHT: 0.4, 
  DIFFICULTY_ALIGNMENT_WEIGHT: 0.3,
  DIFFICULTY_THRESHOLDS: {
    'beginner': { min: 0.3, max: 0.5 },
    'intermediate': { min: 0.5, max: 0.7 },
    'advanced': { min: 0.6, max: 0.85 }
  },
  // Set cache TTL to 7 days in milliseconds
  CACHE_TTL: 7 * 24 * 60 * 60 * 1000,
  // Maximum cache size to prevent memory issues
  MAX_CACHE_SIZE: 1000
};

/**
 * Logger utility to standardize logging with timestamps and levels
 */
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, data ? data : '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, data ? data : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, error ? error : '');
  }
};

/**
 * Main function to generate distractors for a word
 */
async function generateDistractors(wordData, difficultyLevel = 'intermediate', count = CONFIG.DISTRACTOR_COUNT) {
  logger.info(`Generating distractors for word: ${wordData.word}, difficulty: ${difficultyLevel}`);

  // 1. Try to get existing high-quality distractors
  const existingDistractors = await getExistingDistractors(wordData.id, count);
  if (existingDistractors.length >= count) {
    logger.info(`Found ${existingDistractors.length} existing distractors, reusing them`);
    return existingDistractors;
  }

  // 2. Check how many more distractors we need
  const neededCount = count - existingDistractors.length;
  logger.info(`Need ${neededCount} more distractors`);
  
  // 3. Generate new distractors using multiple strategies
  const distractors = [];
  const startTime = Date.now();

  try {
    // 3.1 Get WordNet-based distractors
    const wordnetDistractors = await getWordNetDistractors(wordData, difficultyLevel, neededCount * 3);
    distractors.push(...wordnetDistractors);
    logger.info(`Got ${wordnetDistractors.length} WordNet distractors`);

    // 3.2 If we still need more, try Datamuse semantic distractors
    if (distractors.length < neededCount * 2) {
      const semanticDistractors = await getDatamuseSemanticDistractors(wordData, difficultyLevel, neededCount * 2);
      distractors.push(...semanticDistractors);
      logger.info(`Got ${semanticDistractors.length} semantic distractors`);
    }

    // 3.3 If we still need more, try Datamuse phonetic distractors
    if (distractors.length < neededCount * 2) {
      const phoneticDistractors = await getDatamusePhoneticDistractors(wordData, difficultyLevel, neededCount * 2);
      distractors.push(...phoneticDistractors);
      logger.info(`Got ${phoneticDistractors.length} phonetic distractors`);
    }

    // 3.4 If we still don't have enough, try definition transformation as last resort
    if (distractors.length < neededCount) {
      const transformedDistractors = transformDefinitions(wordData.definitions, neededCount);
      distractors.push(...transformedDistractors);
      logger.info(`Got ${transformedDistractors.length} transformed distractors`);
    }

    // 4. Score and rank all distractors
    const scoredDistractors = scoreDistractors(distractors, wordData, difficultyLevel);
    
    // 5. Choose the best distractors
    const bestDistractors = chooseBestDistractors(scoredDistractors, wordData, neededCount);
    
    // 6. Store the new distractors in the database
    await storeDistractors(wordData.id, bestDistractors);
    
    // 7. Combine with existing distractors
    const allDistractors = [...existingDistractors, ...bestDistractors];
    
    // Log timing information
    const totalTime = Date.now() - startTime;
    logger.info(`Total distractor generation time: ${totalTime}ms for word "${wordData.word}"`);
    
    return allDistractors;
  } catch (error) {
    logger.error(`Error in generateDistractors for word ${wordData.word}:`, error);
    
    // Even if we hit an error, return whatever distractors we were able to generate
    const scoredDistractors = scoreDistractors(distractors, wordData, difficultyLevel);
    const bestDistractors = chooseBestDistractors(scoredDistractors, wordData, neededCount);
    
    return [...existingDistractors, ...bestDistractors];
  }
}

/**
 * Get existing high-quality distractors from the database
 */
async function getExistingDistractors(wordId, count) {
  try {
    const { data, error } = await supabaseClient
      .from('word_distractors')
      .select('id, distractor_definition, quality_score, source_type')
      .eq('word_id', wordId)
      .order('quality_score', { ascending: false })
      .limit(count);
      
    if (error) {
      logger.error('Error fetching existing distractors:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    logger.error(`Error in getExistingDistractors for word_id ${wordId}:`, error);
    return [];
  }
}

/**
 * Get distractors based on WordNet semantic relationships
 */
async function getWordNetDistractors(wordData, difficultyLevel, count) {
  logger.info(`Getting WordNet distractors for word: ${wordData.word}`);
  
  try {
    // Query for sibling synsets (words that share the same hypernym)
    const { data: siblingData, error: siblingError } = await supabaseClient.rpc(
      'get_sibling_synsets',
      { target_word: wordData.word, target_pos: wordData.pos, limit_count: count }
    );
    
    if (siblingError) {
      logger.error('Error fetching sibling synsets:', siblingError);
      return [];
    }
    
    // If the RPC doesn't exist or returns no results, try a direct query instead
    if (!siblingData || siblingData.length === 0) {
      logger.info(`No sibling synsets found for ${wordData.word}, trying similar words by POS`);
      
      // Try the alternative function to get similar words by POS
      const { data: similarByPOS, error: similarError } = await supabaseClient.rpc(
        'get_similar_words_by_pos',
        { target_pos: wordData.pos, exclude_word: wordData.word, limit_count: count }
      );
      
      if (similarError) {
        logger.error('Error fetching similar words by POS:', similarError);
      }
      
      if (similarByPOS && similarByPOS.length > 0) {
        return similarByPOS.map(item => ({
          definition: item.definition,
          source_type: 'wordnet_pos_similar',
          source_word: item.word,
          quality_score: 0.6
        }));
      }
      
      // If both RPCs fail, try a direct query as last resort
      logger.info(`RPCs failed, trying direct query for ${wordData.word}`);
      
      const { data: manualQueryData, error: manualQueryError } = await supabaseClient
        .from('synsets')
        .select(`
          id, definition, 
          word_synsets!inner(
            words!inner(word, pos)
          )
        `)
        .eq('word_synsets.words.pos', wordData.pos)
        .neq('word_synsets.words.word', wordData.word)
        .limit(count);
        
      if (manualQueryError) {
        logger.error('Error in manual synset query:', manualQueryError);
        return [];
      }
      
      // Format the results
      return (manualQueryData || []).map(synset => ({
        definition: synset.definition,
        source_type: 'wordnet_manual',
        source_word: synset.word_synsets[0]?.words?.word || null,
        quality_score: 0.5 // Lower quality since this is a last resort
      }));
    }
    
    // Format the WordNet results
    logger.info(`Found ${siblingData.length} sibling synsets for ${wordData.word}`);
    return (siblingData || []).map(item => ({
      definition: item.definition,
      source_type: 'wordnet_sibling',
      source_word: item.word,
      quality_score: 0.7
    }));
  } catch (error) {
    logger.error(`Error in WordNet distractor generation for word ${wordData.word}:`, error);
    return [];
  }
}

/**
 * Get distractors based on Datamuse semantic relationships
 */
async function getDatamuseSemanticDistractors(wordData, difficultyLevel, count) {
  logger.info(`Getting Datamuse semantic distractors for word: ${wordData.word}`);
  
  try {
    // Get semantically similar words
    const mlResults = await callDatamuseApi({
      'ml': wordData.word,
      'md': 'dp',
      'max': 15
    });
    
    // Get words with the same part of speech that are related
    const posParam = wordData.pos === 'adj' ? 'rel_jjb' : 
                     wordData.pos === 'adv' ? 'rel_jja' : 
                     wordData.pos === 'v' ? 'rel_trg' : 'rel_trg';
    
    const posResults = await callDatamuseApi({
      [posParam]: wordData.word,
      'md': 'dp',
      'max': 15
    });
    
    // Combine results
    const allWords = [...(mlResults || []), ...(posResults || [])];
    
    // Filter to keep only words with the same POS
    const samePosTags = {
      'noun': ['n'],
      'n': ['n'],
      'verb': ['v'],
      'v': ['v'],
      'adj': ['adj'],
      'adv': ['adv']
    };
    
    const targetPosTags = samePosTags[wordData.pos] || [];
    
    const filteredWords = allWords.filter(item => {
      const posTags = item.tags ? item.tags.filter(tag => tag.startsWith('p:')) : [];
      const pos = posTags.length ? posTags[0].substring(2) : null;
      return !pos || targetPosTags.includes(pos);
    });
    
    // Fetch definitions for these words
    const wordDefinitions = [];
    
    for (const item of filteredWords.slice(0, count)) {
      // Skip the target word itself
      if (item.word === wordData.word) {
        continue;
      }
      
      // Get definition from our database first
      const { data: existingWordData, error: wordError } = await supabaseClient
        .from('words')
        .select('definitions')
        .eq('word', item.word)
        .maybeSingle();
        
      if (!wordError && existingWordData?.definitions?.length) {
        wordDefinitions.push({
          definition: existingWordData.definitions[0],
          source_type: 'datamuse_semantic',
          source_word: item.word,
          quality_score: 0.65
        });
      } else {
        // Alternatively, check if the Datamuse result includes a definition
        if (item.defs && item.defs.length) {
          const def = item.defs[0].replace(/^[^:]+:\s*/, ''); // Remove POS prefix
          wordDefinitions.push({
            definition: def,
            source_type: 'datamuse_semantic',
            source_word: item.word,
            quality_score: 0.6
          });
        }
      }
    }
    
    logger.info(`Found ${wordDefinitions.length} semantic distractors via Datamuse for ${wordData.word}`);
    return wordDefinitions;
  } catch (error) {
    logger.error(`Error in Datamuse semantic distractor generation for word ${wordData.word}:`, error);
    return [];
  }
}

/**
 * Get distractors based on Datamuse phonetic relationships
 */
async function getDatamusePhoneticDistractors(wordData, difficultyLevel, count) {
  logger.info(`Getting Datamuse phonetic distractors for word: ${wordData.word}`);
  
  try {
    // Get phonetically similar words (sounds like)
    const slResults = await callDatamuseApi({
      'sl': wordData.word,
      'md': 'dp',
      'max': 10
    });
    
    // Get similarly spelled words
    const spResults = await callDatamuseApi({
      'sp': wordData.word,
      'md': 'dp',
      'max': 10
    });
    
    // Get rhyming words
    const rhyResults = await callDatamuseApi({
      'rel_rhy': wordData.word,
      'md': 'dp',
      'max': 8
    });
    
    // Combine and deduplicate results
    const allWords = [...(slResults || []), ...(spResults || []), ...(rhyResults || [])];
    const uniqueWords = allWords.filter((item, index, self) => 
      index === self.findIndex(t => t.word === item.word)
    );
    
    // Filter out the target word
    const filteredWords = uniqueWords.filter(item => item.word !== wordData.word);
    
    // Fetch definitions for these words
    const wordDefinitions = [];
    
    for (const item of filteredWords.slice(0, count)) {
      // Get definition from our database first
      const { data: existingWordData, error: wordError } = await supabaseClient
        .from('words')
        .select('definitions')
        .eq('word', item.word)
        .maybeSingle();
        
      if (!wordError && existingWordData?.definitions?.length) {
        wordDefinitions.push({
          definition: existingWordData.definitions[0],
          source_type: 'datamuse_phonetic',
          source_word: item.word,
          quality_score: 0.75 // Phonetic distractors often make excellent options
        });
      } else {
        // Alternatively, check if the Datamuse result includes a definition
        if (item.defs && item.defs.length) {
          const def = item.defs[0].replace(/^[^:]+:\s*/, ''); // Remove POS prefix
          wordDefinitions.push({
            definition: def,
            source_type: 'datamuse_phonetic',
            source_word: item.word,
            quality_score: 0.7
          });
        }
      }
    }
    
    logger.info(`Found ${wordDefinitions.length} phonetic distractors via Datamuse for ${wordData.word}`);
    return wordDefinitions;
  } catch (error) {
    logger.error(`Error in Datamuse phonetic distractor generation for word ${wordData.word}:`, error);
    return [];
  }
}

/**
 * Transform definitions to create additional distractors
 */
function transformDefinitions(definitions, count) {
  if (!definitions || !definitions.length) {
    return [];
  }
  
  const originalDef = definitions[0];
  const transformedDefs = [];
  
  // Technique 1: Scope change (change qualifiers)
  const scopeChangers = [
    { from: 'all', to: 'some' },
    { from: 'always', to: 'sometimes' },
    { from: 'never', to: 'rarely' },
    { from: 'every', to: 'many' },
    { from: 'completely', to: 'partially' },
    { from: 'must', to: 'may' },
    { from: 'will', to: 'might' }
  ];
  
  // Apply scope changers
  for (const changer of scopeChangers) {
    const regex = new RegExp(`\\b${changer.from}\\b`, 'i');
    if (regex.test(originalDef)) {
      transformedDefs.push({
        definition: originalDef.replace(regex, changer.to),
        source_type: 'transformed_scope',
        source_word: null,
        quality_score: 0.55
      });
    }
  }
  
  // Technique 2: Negation
  if (!originalDef.includes('not') && !originalDef.includes("n't")) {
    // Find the first verb that isn't a be-verb
    const verbs = originalDef.match(/\b(is|are|was|were|be|been|being)\b/i);
    if (verbs && verbs.length) {
      const verb = verbs[0];
      const negatedDef = originalDef.replace(
        new RegExp(`\\b${verb}\\b`, 'i'), 
        `${verb} not`
      );
      
      transformedDefs.push({
        definition: negatedDef,
        source_type: 'transformed_negation',
        source_word: null,
        quality_score: 0.5
      });
    }
  }
  
  // Technique 3: Domain shift
  const domains = [
    { from: 'science', to: 'art' },
    { from: 'mathematics', to: 'literature' },
    { from: 'technology', to: 'nature' },
    { from: 'business', to: 'education' },
    { from: 'living', to: 'inanimate' },
    { from: 'natural', to: 'artificial' }
  ];
  
  // Apply domain shifters
  for (const domain of domains) {
    const regex = new RegExp(`\\b${domain.from}\\b`, 'i');
    if (regex.test(originalDef)) {
      transformedDefs.push({
        definition: originalDef.replace(regex, domain.to),
        source_type: 'transformed_domain',
        source_word: null,
        quality_score: 0.5
      });
    }
  }
  
  // Technique 4: Adjective swap
  const adjectives = originalDef.match(/\b(large|small|important|significant|major|minor|good|bad|positive|negative)\b/gi);
  if (adjectives && adjectives.length) {
    // Map of adjectives to their opposites
    const opposites = {
      'large': 'small', 'small': 'large',
      'important': 'trivial', 'significant': 'insignificant',
      'major': 'minor', 'minor': 'major',
      'good': 'bad', 'bad': 'good',
      'positive': 'negative', 'negative': 'positive'
    };
    
    const adjective = adjectives[0].toLowerCase();
    if (opposites[adjective]) {
      transformedDefs.push({
        definition: originalDef.replace(
          new RegExp(`\\b${adjective}\\b`, 'i'), 
          opposites[adjective]
        ),
        source_type: 'transformed_adjective',
        source_word: null,
        quality_score: 0.6
      });
    }
  }
  
  // Return the best transformed definitions
  return transformedDefs.slice(0, count);
}

/**
 * Score distractors based on quality criteria
 */
function scoreDistractors(distractors, wordData, difficultyLevel) {
  return distractors.map(distractor => {
    // Start with the initial quality score
    let score = distractor.quality_score || 0.5;
    
    // Adjust score based on target difficulty level
    const diffThresholds = CONFIG.DIFFICULTY_THRESHOLDS[difficultyLevel] || CONFIG.DIFFICULTY_THRESHOLDS.intermediate;
    
    // Simple heuristic: award higher scores to distractors from phonetic sources for advanced difficulty
    if (difficultyLevel === 'advanced' && distractor.source_type === 'datamuse_phonetic') {
      score += 0.1;
    }
    
    // Award higher scores to WordNet-based distractors for beginner difficulty
    if (difficultyLevel === 'beginner' && distractor.source_type.startsWith('wordnet')) {
      score += 0.1;
    }
    
    // Enhanced scoring by definition length similarity
    if (wordData.definitions && wordData.definitions.length > 0) {
      const correctDefLength = wordData.definitions[0].length;
      const distractorDefLength = distractor.definition.length;
      
      // Penalize definitions that are much shorter or longer than the correct definition
      const lengthRatio = Math.min(correctDefLength, distractorDefLength) / 
                          Math.max(correctDefLength, distractorDefLength);
      
      // Apply a small adjustment based on length similarity
      if (lengthRatio > 0.8) {
        score += 0.05; // Very similar lengths
      } else if (lengthRatio < 0.5) {
        score -= 0.05; // Very different lengths
      }
    }
    
    // Ensure score is within bounds
    score = Math.min(Math.max(score, 0), 1);
    
    return {
      ...distractor,
      quality_score: score
    };
  });
}

/**
 * Choose the best distractors based on scores and diversity
 */
function chooseBestDistractors(scoredDistractors, wordData, count) {
  // First, sort by quality score
  const sortedDistractors = [...scoredDistractors].sort((a, b) => b.quality_score - a.quality_score);
  
  // Ensure diversity of sources
  const selectedDistractors = [];
  const selectedSources = new Set();
  
  // First pass: get the best distractor from each source
  for (const distractor of sortedDistractors) {
    const sourceType = distractor.source_type.split('_')[0]; // Get the main source category
    
    if (!selectedSources.has(sourceType) && selectedDistractors.length < count) {
      selectedDistractors.push(distractor);
      selectedSources.add(sourceType);
    }
  }
  
  // Second pass: fill remaining slots with highest scoring distractors
  for (const distractor of sortedDistractors) {
    if (selectedDistractors.length >= count) break;
    
    // Check if this exact distractor is already included
    const alreadyIncluded = selectedDistractors.some(d => 
      d.definition === distractor.definition
    );
    
    if (!alreadyIncluded) {
      selectedDistractors.push(distractor);
    }
  }
  
  return selectedDistractors.slice(0, count);
}

/**
 * Store distractors in the database
 */
async function storeDistractors(wordId, distractors) {
  if (distractors.length === 0) return;
  
  try {
    const distractorEntries = distractors.map(d => ({
      word_id: wordId,
      distractor_definition: d.definition,
      distractor_word: d.source_word,
      source_type: d.source_type,
      quality_score: d.quality_score,
      semantic_distance: d.semantic_distance || null
    }));
    
    const { error } = await supabaseClient
      .from('word_distractors')
      .insert(distractorEntries);
      
    if (error) {
      logger.error('Error storing distractors:', error);
    } else {
      logger.info(`Successfully stored ${distractorEntries.length} distractors for word_id ${wordId}`);
    }
  } catch (error) {
    logger.error(`Error in storeDistractors for word_id ${wordId}:`, error);
  }
}

/**
 * Call Datamuse API with rate limiting and caching
 */
async function callDatamuseApi(params) {
  // Generate a cache key from the parameters
  const cacheKey = JSON.stringify(params);
  
  // Check cache first
  if (datamuseCache.has(cacheKey)) {
    const cachedData = datamuseCache.get(cacheKey);
    logger.info(`Using cached Datamuse result for ${cacheKey}`);
    return cachedData.data;
  }
  
  // Build URL with parameters
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  const url = `${DATAMUSE_BASE_URL}?${queryString}`;
  
  // Implement rate limiting
  const now = Date.now();
  const timeSinceLastCall = now - lastDatamuseCall;
  
  if (timeSinceLastCall < DATAMUSE_RATE_LIMIT) {
    const waitTime = DATAMUSE_RATE_LIMIT - timeSinceLastCall;
    logger.info(`Rate limiting Datamuse API - waiting ${waitTime}ms before call`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  try {
    lastDatamuseCall = Date.now();
    logger.info(`Calling Datamuse API: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Datamuse API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Manage cache size before adding new items
    if (datamuseCache.size >= CONFIG.MAX_CACHE_SIZE) {
      // Remove oldest cache entries
      const cacheKeys = Array.from(datamuseCache.keys());
      const oldestKeys = cacheKeys.slice(0, Math.floor(CONFIG.MAX_CACHE_SIZE * 0.2)); // Remove 20% oldest
      
      oldestKeys.forEach(key => datamuseCache.delete(key));
      logger.info(`Cache cleanup: removed ${oldestKeys.length} oldest entries`);
    }
    
    // Store in cache with timestamp
    datamuseCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    logger.error(`Datamuse API call failed: ${error.message}`);
    return [];
  }
}

// Edge Function handler
Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    // Parse request
    const { 
      word_id, 
      word, 
      difficulty_level = 'intermediate', 
      count = CONFIG.DISTRACTOR_COUNT,
      forceRefresh = false,
      quizFormat = 'standard',
      includeExamples = false
    } = await req.json();
    
    logger.info(`Received request for distractors: ${word_id ? `word_id=${word_id}` : `word=${word}`}, format: ${quizFormat}`);
    
    let wordData;
    
    // Get word data either by ID or word text
    if (word_id) {
      const { data, error } = await supabaseClient
        .from('words')
        .select('id, word, pos, definitions, examples, difficulty_level')
        .eq('id', word_id)
        .single();
        
      if (error) {
        logger.error(`Word with ID ${word_id} not found:`, error);
        return new Response(
          JSON.stringify({ error: `Word with ID ${word_id} not found` }),
          { headers: { 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      
      wordData = data;
    } else if (word) {
      const { data, error } = await supabaseClient
        .from('words')
        .select('id, word, pos, definitions, examples, difficulty_level')
        .eq('word', word.toLowerCase())
        .single();
        
      if (error) {
        logger.error(`Word "${word}" not found:`, error);
        return new Response(
          JSON.stringify({ error: `Word "${word}" not found` }),
          { headers: { 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      
      wordData = data;
    } else {
      logger.error('Missing required parameter: either word_id or word');
      return new Response(
        JSON.stringify({ error: 'Either word_id or word parameter is required' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get the correct definition for this word
    const correctDefinition = wordData.definitions && wordData.definitions.length > 0 
      ? wordData.definitions[0] 
      : null;
      
    if (!correctDefinition) {
      logger.error(`No definition found for word "${wordData.word}"`);
      return new Response(
        JSON.stringify({ error: `No definition found for word "${wordData.word}"` }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Check if we need to generate new distractors or we can use pre-generated ones
    if (forceRefresh) {
      logger.info(`Force refresh requested for word "${wordData.word}". Generating new distractors.`);
      
      // Call DB function to generate high-quality distractors
      try {
        const { data: generatedData, error: genError } = await supabaseClient.rpc(
          'generate_wordnet_distractors',
          { target_word_id: wordData.id, distractor_count: Math.max(count * 2, 10) }
        );
        
        if (genError) {
          logger.warn(`Error calling generate_wordnet_distractors: ${genError.message}. Falling back to normal generation.`);
        } else {
          logger.info(`Successfully generated ${generatedData} new distractors for "${wordData.word}"`);
        }
      } catch (genError) {
        logger.warn(`Exception in generate_wordnet_distractors: ${genError.message}. Falling back to normal generation.`);
      }
    }
    
    // Fetch the best pre-generated distractors from the database
    const { data: preGenDistractors, error: fetchError } = await supabaseClient
      .from('word_distractors')
      .select('id, distractor_definition, quality_score, distractor_type, similarity_score')
      .eq('word_id', wordData.id)
      .order('quality_score', { ascending: false })
      .limit(count * 2); // Fetch extra to ensure diversity
    
    let distractors = [];
    
    if (fetchError || !preGenDistractors || preGenDistractors.length < count) {
      logger.info(`Not enough pre-generated distractors found for "${wordData.word}". Generating on-demand.`);
      // Generate distractors on-demand using existing function
      distractors = await generateDistractors(
        wordData, 
        difficulty_level, 
        count
      );
    } else {
      logger.info(`Using ${preGenDistractors.length} pre-generated distractors for "${wordData.word}"`);
      
      // Use pre-generated distractors
      // Ensure a mix of distractor types for better educational value
      const typeGroups = {};
      
      // Group by distractor_type
      preGenDistractors.forEach(d => {
        const type = d.distractor_type || 'unknown';
        if (!typeGroups[type]) {
          typeGroups[type] = [];
        }
        typeGroups[type].push(d);
      });
      
      // Pick from each type to ensure diversity
      const selectedDistractors = [];
      const types = Object.keys(typeGroups);
      
      // Ensure we get at least one of each type if available
      types.forEach(type => {
        if (typeGroups[type].length > 0) {
          selectedDistractors.push(typeGroups[type][0]);
          typeGroups[type].shift();
        }
      });
      
      // Fill remaining slots with highest quality distractors
      const remaining = count - selectedDistractors.length;
      if (remaining > 0) {
        const flattenedRemaining = [].concat(...Object.values(typeGroups));
        flattenedRemaining.sort((a, b) => b.quality_score - a.quality_score);
        selectedDistractors.push(...flattenedRemaining.slice(0, remaining));
      }
      
      distractors = selectedDistractors.slice(0, count);
      
      // Update usage count for these distractors
      const distractorIds = distractors.map(d => d.id);
      if (distractorIds.length > 0) {
        await supabaseClient.rpc('update_distractors_usage', { 
          distractor_ids: distractorIds 
        }).catch(err => {
          logger.warn(`Failed to update distractor usage: ${err.message}`);
        });
      }
    }
    
    // Create response based on quiz format
    let response;
    
    if (quizFormat === 'standard' || quizFormat === 'default') {
      // Combine correct definition and distractors
      const allDefinitions = [
        { 
          definition: correctDefinition, 
          isCorrect: true,
          examples: includeExamples ? wordData.examples : undefined
        },
        ...distractors.map(d => ({ 
          definition: d.distractor_definition, 
          isCorrect: false, 
          id: d.id,
          type: d.distractor_type
        }))
      ];
      
      // Shuffle the definitions
      const shuffledDefinitions = shuffleArray(allDefinitions);
      
      response = {
        word: wordData.word,
        word_id: wordData.id,
        pos: wordData.pos,
        difficulty_level: wordData.difficulty_level || difficulty_level,
        correctDefinition,
        definitions: shuffledDefinitions
      };
    } else if (quizFormat === 'matching') {
      // For matching format, return definitions and words separately
      const definitionsList = [
        { id: 'correct', definition: correctDefinition },
        ...distractors.map((d, i) => ({ 
          id: `distractor_${i}`, 
          definition: d.distractor_definition 
        }))
      ];
      
      const wordsList = [
        { id: 'correct', word: wordData.word },
        ...distractors.map((d, i) => ({ 
          id: `distractor_${i}`, 
          // We would need to get the actual words, but for now use placeholder
          word: `distractor_word_${i}` 
        }))
      ];
      
      response = {
        format: 'matching',
        definitions: shuffleArray(definitionsList),
        words: shuffleArray(wordsList),
        correctMatches: [{ definitionId: 'correct', wordId: 'correct' }]
      };
    } else {
      // Default format
      const allDefinitions = [
        { 
          definition: correctDefinition, 
          isCorrect: true 
        },
        ...distractors.map(d => ({ 
          definition: d.distractor_definition, 
          isCorrect: false, 
          id: d.id
        }))
      ];
      
      response = {
        word: wordData.word,
        word_id: wordData.id,
        pos: wordData.pos,
        difficulty_level: wordData.difficulty_level || difficulty_level,
        correctDefinition,
        definitions: shuffleArray(allDefinitions)
      };
    }
    
    const totalTime = Date.now() - startTime;
    logger.info(`Request for word "${wordData.word}" completed in ${totalTime}ms`);
    
    return new Response(
      JSON.stringify(response),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Utility function to shuffle an array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-distractors' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"word":"happy","count":3,"forceRefresh":true}'

*/ 