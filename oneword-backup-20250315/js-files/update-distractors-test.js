require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const INPUT_FILE = 'distractors-test.json';
const ORIGINAL_WORDS_FILE = 'test-batch-for-definitions.json';
const WORDNET_RELATIONSHIPS_FILE = 'wordnet-relationships.json';
const DRY_RUN = true; // Set to false to actually update the database

/**
 * Ensure the word_distractors table exists with all necessary columns
 */
async function ensureDistractorsTable() {
  // Check if the table exists
  const { data: tableExists, error: tableError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', 'word_distractors')
    .eq('table_schema', 'public');
  
  if (tableError) {
    console.error('Error checking for word_distractors table:', tableError);
    throw tableError;
  }
  
  // Create the table if it doesn't exist
  if (!tableExists || tableExists.length === 0) {
    console.log('Creating word_distractors table...');
    
    if (DRY_RUN) {
      console.log('DRY RUN: Would create word_distractors table with this SQL:');
      console.log(`
        CREATE TABLE public.word_distractors (
          id SERIAL PRIMARY KEY,
          word_id INTEGER NOT NULL REFERENCES public.words(id),
          word TEXT NOT NULL,
          distractor TEXT NOT NULL,
          similarity_score FLOAT DEFAULT 0.5,
          quality_score FLOAT DEFAULT 0.5,
          is_semantic BOOLEAN DEFAULT false,
          is_phonological BOOLEAN DEFAULT false,
          is_misconception BOOLEAN DEFAULT false,
          semantic_type TEXT,
          phonological_type TEXT,
          is_same_pos BOOLEAN DEFAULT true,
          source TEXT,
          distractor_type TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        CREATE INDEX word_distractors_word_idx ON public.word_distractors(word);
        CREATE INDEX word_distractors_distractor_idx ON public.word_distractors(distractor);
      `);
      return;
    }
    
    const createTableSQL = `
      CREATE TABLE public.word_distractors (
        id SERIAL PRIMARY KEY,
        word_id INTEGER NOT NULL REFERENCES public.words(id),
        word TEXT NOT NULL,
        distractor TEXT NOT NULL,
        similarity_score FLOAT DEFAULT 0.5,
        quality_score FLOAT DEFAULT 0.5,
        is_semantic BOOLEAN DEFAULT false,
        is_phonological BOOLEAN DEFAULT false,
        is_misconception BOOLEAN DEFAULT false,
        semantic_type TEXT,
        phonological_type TEXT,
        is_same_pos BOOLEAN DEFAULT true,
        source TEXT,
        distractor_type TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
      CREATE INDEX word_distractors_word_idx ON public.word_distractors(word);
      CREATE INDEX word_distractors_distractor_idx ON public.word_distractors(distractor);
    `;
    
    const { error: createError } = await supabase.rpc('execute_sql', {
      sql: createTableSQL
    });
    
    if (createError) {
      console.error('Error creating word_distractors table:', createError);
      throw createError;
    }
    
    console.log('Created word_distractors table successfully.');
  } else {
    console.log('word_distractors table already exists.');
    
    // Check for and add necessary columns for our enhanced approach
    const newColumns = [
      { name: 'is_semantic', type: 'BOOLEAN', default: 'false' },
      { name: 'is_phonological', type: 'BOOLEAN', default: 'false' },
      { name: 'is_misconception', type: 'BOOLEAN', default: 'false' },
      { name: 'semantic_type', type: 'TEXT', default: null },
      { name: 'phonological_type', type: 'TEXT', default: null },
      { name: 'distractor_type', type: 'TEXT', default: null },
      { name: 'quality_score', type: 'FLOAT', default: '0.5' }
    ];
    
    for (const column of newColumns) {
      // Check if column exists
      const { data: columnCheck, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'word_distractors')
        .eq('column_name', column.name);
      
      if (columnError) {
        console.error(`Error checking for ${column.name} column:`, columnError);
        continue;
      }
      
      // Add column if it doesn't exist
      if (!columnCheck || columnCheck.length === 0) {
        console.log(`Adding ${column.name} column to word_distractors table...`);
        
        let defaultClause = '';
        if (column.default !== null) {
          defaultClause = ` DEFAULT ${column.default}`;
        }
        
        if (!DRY_RUN) {
          const { error: alterError } = await supabase.rpc('execute_sql', {
            sql: `ALTER TABLE public.word_distractors ADD COLUMN ${column.name} ${column.type}${defaultClause};`
          });
          
          if (alterError) {
            console.error(`Error adding ${column.name} column:`, alterError);
          } else {
            console.log(`Added ${column.name} column successfully.`);
          }
        } else {
          console.log(`DRY RUN: Would add ${column.name} column to word_distractors table.`);
        }
      }
    }
  }
}

/**
 * Set distractor properties based on its type
 */
function setDistractorTypeProperties(distractor, type) {
  // Reset all type flags
  distractor.is_semantic = false;
  distractor.is_phonological = false;
  distractor.is_misconception = false;
  distractor.semantic_type = null;
  distractor.phonological_type = null;
  
  // Main distractor type
  distractor.distractor_type = type;
  
  // Semantic types
  const semanticTypes = [
    'co-hyponym', 'hypernym', 'hyponym', 'meronym', 'holonym', 
    'domain-related', 'semantic-associate'
  ];
  
  // Phonological types
  const phonologicalTypes = [
    'homophone', 'near-homophone', 'minimal-pair', 'orthographic', 'rhyme'
  ];
  
  // Misconception types
  const misconceptionTypes = [
    'common-misconception', 'false-cognate', 'collocation-related'
  ];
  
  // Set the appropriate flags and subtypes
  if (semanticTypes.some(t => type.includes(t))) {
    distractor.is_semantic = true;
    distractor.semantic_type = type;
    distractor.quality_score = 0.9; // Semantic distractors are usually high quality
    
    // Assign specific scores based on semantic subtype
    if (type.includes('co-hyponym')) {
      distractor.quality_score = 0.95; // Highest quality
    } else if (type.includes('hypernym')) {
      distractor.quality_score = 0.85;
    } else if (type.includes('hyponym')) {
      distractor.quality_score = 0.8;
    }
  }
  else if (phonologicalTypes.some(t => type.includes(t)) || type.includes('phonological')) {
    distractor.is_phonological = true;
    distractor.phonological_type = type;
    distractor.quality_score = 0.8; // Phonological distractors are usually good quality
  }
  else if (misconceptionTypes.some(t => type.includes(t))) {
    distractor.is_misconception = true;
    distractor.quality_score = 0.75; // Misconception distractors are also valuable
  }
  
  return distractor;
}

/**
 * Process and update distractors from Claude
 */
async function updateDistractors() {
  try {
    console.log('Updating distractors in the database with enhanced classification...');
    
    // Ensure the table exists with all necessary columns
    await ensureDistractorsTable();
    
    // Read original words data
    if (!fs.existsSync(ORIGINAL_WORDS_FILE)) {
      console.error(`Error: ${ORIGINAL_WORDS_FILE} not found. Please run extract-test-batch.js first.`);
      return;
    }
    
    const originalWords = JSON.parse(fs.readFileSync(ORIGINAL_WORDS_FILE, 'utf8'));
    console.log(`Loaded ${originalWords.length} original words.`);
    
    // Create word ID map
    const wordIdMap = {};
    originalWords.forEach(word => {
      wordIdMap[word.word.toLowerCase()] = word.id;
    });
    
    // Read WordNet relationships if available
    let wordNetData = {};
    if (fs.existsSync(WORDNET_RELATIONSHIPS_FILE)) {
      wordNetData = JSON.parse(fs.readFileSync(WORDNET_RELATIONSHIPS_FILE, 'utf8'));
      console.log(`Loaded WordNet relationships for ${Object.keys(wordNetData).length} words.`);
    }
    
    // Read Claude's output
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`Error: ${INPUT_FILE} not found. Please generate distractors with Claude first.`);
      return;
    }
    
    const distractorsJson = fs.readFileSync(INPUT_FILE, 'utf8');
    let distractorsData;
    
    try {
      distractorsData = JSON.parse(distractorsJson);
    } catch (parseError) {
      console.error('Error parsing JSON from Claude\'s output:', parseError);
      console.log('Make sure the file contains valid JSON in the expected format:');
      console.log(`[{"word": "example", "distractors": ["option1", "option2", "option3"]}, ...]`);
      return;
    }
    
    console.log(`Loaded distractors for ${distractorsData.length} words from Claude.`);
    
    // Validate distractors
    const validDistractorsData = distractorsData.filter(item => {
      const isValid = item.word && 
                     Array.isArray(item.distractors) && 
                     item.distractors.length > 0 &&
                     Array.isArray(item.distractor_types || item.relationships) &&
                     (item.distractor_types || item.relationships).length === item.distractors.length;
      
      if (!isValid) {
        console.warn(`Skipping invalid distractor data for: ${JSON.stringify(item)}`);
      }
      return isValid;
    });
    
    // Prepare distractor records with enhanced classification
    const distractorRecords = [];
    validDistractorsData.forEach(item => {
      const wordLower = item.word.toLowerCase();
      const wordId = wordIdMap[wordLower];
      
      if (!wordId) {
        console.warn(`Word ID not found for: ${item.word}`);
        return;
      }
      
      // Get original word data for POS matching
      const originalWord = originalWords.find(w => w.word.toLowerCase() === wordLower);
      
      // Use distractor_types if available, otherwise use relationships
      const typeArray = item.distractor_types || item.relationships;
      
      item.distractors.forEach((distractor, index) => {
        if (!distractor) return;
        
        const type = typeArray[index] || 'unknown';
        
        // Create the distractor record with base properties
        let distractorRecord = {
          word_id: wordId,
          word: item.word,
          distractor: distractor,
          similarity_score: 0.5,
          quality_score: 0.5,
          is_semantic: false,
          is_phonological: false,
          is_misconception: false,
          is_same_pos: true, // Assuming Claude followed instructions
          source: 'claude_enhanced',
          distractor_type: type
        };
        
        // Set properties based on distractor type
        distractorRecord = setDistractorTypeProperties(distractorRecord, type);
        
        distractorRecords.push(distractorRecord);
      });
    });
    
    console.log(`Prepared ${distractorRecords.length} distractor records with enhanced classification.`);
    
    // Group distractors by word for display
    const distractorsByWord = {};
    distractorRecords.forEach(record => {
      if (!distractorsByWord[record.word]) {
        distractorsByWord[record.word] = [];
      }
      distractorsByWord[record.word].push(record);
    });
    
    // Show sample of distractors with enhanced classification
    console.log('\nSample of prepared distractors with enhanced classification:');
    let count = 0;
    for (const word of Object.keys(distractorsByWord)) {
      if (count >= 3) break;
      
      const distractors = distractorsByWord[word];
      console.log(`${word}:`);
      
      distractors.forEach(d => {
        const qualityLabel = d.quality_score >= 0.9 ? 'excellent' : 
                             d.quality_score >= 0.8 ? 'good' : 
                             d.quality_score >= 0.7 ? 'fair' : 'basic';
        
        console.log(`  - ${d.distractor} (${d.distractor_type}, quality: ${qualityLabel})`);
      });
      
      count++;
    }
    
    // If in dry run mode, just show what would be updated
    if (DRY_RUN) {
      console.log('\nDRY RUN - Would insert these distractors into database.');
      console.log(`(${distractorRecords.length} records for ${Object.keys(distractorsByWord).length} words)`);
      console.log('\nTo update the database, set DRY_RUN = false and run this script again.');
      return;
    }
    
    // Insert distractors
    if (distractorRecords.length === 0) {
      console.log('No valid distractors to insert.');
      return;
    }
    
    console.log('\nInserting distractors into database...');
    
    // Process in batches to avoid hitting limits
    const BATCH_SIZE = 50;
    for (let i = 0; i < distractorRecords.length; i += BATCH_SIZE) {
      const batch = distractorRecords.slice(i, i + BATCH_SIZE);
      
      const { error: insertError } = await supabase
        .from('word_distractors')
        .insert(batch);
      
      if (insertError) {
        console.error(`Error inserting batch ${Math.floor(i/BATCH_SIZE) + 1}:`, insertError);
      } else {
        console.log(`Inserted batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(distractorRecords.length/BATCH_SIZE)}`);
      }
    }
    
    console.log('Insert complete!');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the update
updateDistractors(); 