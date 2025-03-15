require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function executeDbCleanup() {
  console.log('Starting database cleanup...');
  
  // Array of statements to execute
  const statements = [
    // 1. Drop views first to avoid dependency issues
    "DROP VIEW IF EXISTS complete_word_view;",
    
    // 2. Create the consolidated relationships view
    `CREATE OR REPLACE VIEW word_relationships AS
    SELECT 
        w1.word,
        w2.word AS related_word,
        r.relationship_type,
        s1.definition AS word_definition,
        s2.definition AS related_word_definition,
        s1.pos,
        s2.pos AS related_pos
    FROM 
        word_synsets w1
        JOIN synsets s1 ON w1.synset_id = s1.id
        JOIN relationships r ON w1.synset_id = r.from_synset_id
        JOIN synsets s2 ON r.to_synset_id = s2.id
        JOIN word_synsets w2 ON w2.synset_id = r.to_synset_id
    WHERE
        r.relationship_type IN ('synonym', 'antonym', 'hypernym', 'hyponym');`,
    
    // 3. Drop individual relationship views
    "DROP VIEW IF EXISTS word_synonyms;",
    "DROP VIEW IF EXISTS word_antonyms;",
    "DROP VIEW IF EXISTS word_hypernyms;",
    "DROP VIEW IF EXISTS word_hyponyms;",
    
    // 4. Drop empty tables (handling constraints)
    "ALTER TABLE IF EXISTS word_metadata DROP CONSTRAINT IF EXISTS word_metadata_word_fkey;",
    "DROP TABLE IF EXISTS word_metadata;",
    "DROP TABLE IF EXISTS app_word_distractors;",
    
    // 5. Drop word_normalization_map which has 54,451 rows but seems redundant
    "DROP TABLE IF EXISTS word_normalization_map;"
  ];
  
  // Execute each statement sequentially
  for (const sql of statements) {
    try {
      console.log(`Executing: ${sql}`);
      const { data, error } = await supabase.rpc('mcp__query', { sql });
      
      if (error) {
        console.error(`Error executing: ${sql}`);
        console.error(error);
      } else {
        console.log('Success!');
      }
    } catch (err) {
      console.error(`Exception executing: ${sql}`);
      console.error(err);
    }
  }
  
  console.log('Database cleanup completed.');
}

executeDbCleanup()
  .catch(err => console.error('Error during cleanup:', err)); 