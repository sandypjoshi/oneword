/**
 * Table Creation Script for OneWord App
 * 
 * This script creates the necessary tables in Supabase for storing WordNet data.
 * It sets up the schema according to our implementation plan.
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - use environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Execute an SQL query on Supabase
 * @param {string} query - SQL query to execute
 * @param {string} description - Description for logging
 */
async function executeQuery(query, description) {
  console.log(`Executing: ${description}`);
  
  const { error } = await supabase.rpc('exec_sql', { query_text: query });
  
  if (error) {
    console.error(`Error executing ${description}:`, error);
    return false;
  }
  
  console.log(`Successfully executed: ${description}`);
  return true;
}

/**
 * Create all necessary tables for the WordNet data
 */
async function createTables() {
  try {
    console.log('Creating tables for WordNet data...');
    
    // Create words table
    const createWordsTable = `
      CREATE TABLE IF NOT EXISTS words (
        id SERIAL PRIMARY KEY,
        word TEXT NOT NULL,
        pos TEXT,
        polysemy INTEGER,
        syllables INTEGER,
        difficulty_score FLOAT,
        difficulty_level TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(word)
      );
      CREATE INDEX IF NOT EXISTS idx_words_difficulty_level ON words(difficulty_level);
      CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
    `;
    
    // Create synsets table
    const createSynsetsTable = `
      CREATE TABLE IF NOT EXISTS synsets (
        id TEXT PRIMARY KEY,
        definition TEXT NOT NULL,
        pos TEXT NOT NULL,
        domain TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_synsets_pos ON synsets(pos);
      CREATE INDEX IF NOT EXISTS idx_synsets_domain ON synsets(domain);
    `;
    
    // Create word_synsets table (mapping between words and synsets)
    const createWordSynsetsTable = `
      CREATE TABLE IF NOT EXISTS word_synsets (
        id SERIAL PRIMARY KEY,
        word TEXT NOT NULL,
        synset_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (synset_id) REFERENCES synsets(id) ON DELETE CASCADE,
        UNIQUE(word, synset_id)
      );
      CREATE INDEX IF NOT EXISTS idx_word_synsets_word ON word_synsets(word);
      CREATE INDEX IF NOT EXISTS idx_word_synsets_synset_id ON word_synsets(synset_id);
    `;
    
    // Create relationships table
    const createRelationshipsTable = `
      CREATE TABLE IF NOT EXISTS relationships (
        id SERIAL PRIMARY KEY,
        from_synset_id TEXT NOT NULL,
        to_synset_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (from_synset_id) REFERENCES synsets(id) ON DELETE CASCADE,
        FOREIGN KEY (to_synset_id) REFERENCES synsets(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_relationships_from_synset_id ON relationships(from_synset_id);
      CREATE INDEX IF NOT EXISTS idx_relationships_to_synset_id ON relationships(to_synset_id);
      CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);
    `;
    
    // Create domains table
    const createDomainsTable = `
      CREATE TABLE IF NOT EXISTS domains (
        name TEXT PRIMARY KEY,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Create distractors table
    const createDistractorsTable = `
      CREATE TABLE IF NOT EXISTS distractors (
        id SERIAL PRIMARY KEY,
        word TEXT NOT NULL,
        distractor TEXT NOT NULL,
        distractor_type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (word) REFERENCES words(word) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_distractors_word ON distractors(word);
    `;
    
    // Create daily_words table
    const createDailyWordsTable = `
      CREATE TABLE IF NOT EXISTS daily_words (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        word TEXT NOT NULL,
        difficulty_level TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (word) REFERENCES words(word) ON DELETE CASCADE,
        UNIQUE(date, difficulty_level)
      );
      CREATE INDEX IF NOT EXISTS idx_daily_words_date ON daily_words(date);
      CREATE INDEX IF NOT EXISTS idx_daily_words_difficulty ON daily_words(difficulty_level);
    `;
    
    // Execute all table creation queries
    await executeQuery(createWordsTable, 'Create words table');
    await executeQuery(createSynsetsTable, 'Create synsets table');
    await executeQuery(createWordSynsetsTable, 'Create word_synsets table');
    await executeQuery(createRelationshipsTable, 'Create relationships table');
    await executeQuery(createDomainsTable, 'Create domains table');
    await executeQuery(createDistractorsTable, 'Create distractors table');
    await executeQuery(createDailyWordsTable, 'Create daily_words table');
    
    console.log('All tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

// Execute table creation
createTables().catch(console.error); 