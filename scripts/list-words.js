/**
 * List Words with Difficulty Scores
 * 
 * This script retrieves and displays words with their difficulty scores.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://ipljgsggnbdwaomjfuok.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbGpnc2dnbmJkd2FvbWpmdW9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTA4MDEwNiwiZXhwIjoyMDU2NjU2MTA2fQ.qkwn-imaZVnK6IGFgG75eFcFEQySgzIN_gvUJbbDFWE';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * List words with their difficulty scores
 * @param {number} maxId - Maximum word ID to consider
 */
async function listWords(maxId = 100) {
  try {
    console.log(`Retrieving words with ID <= ${maxId}`);

    // Get all words in the specified range
    const { data, error } = await supabase
      .from('words')
      .select('id, word, difficulty_score, difficulty_level')
      .lte('id', maxId)
      .order('id');

    if (error) {
      throw error;
    }

    console.log(`\nFound ${data.length} words in total`);
    console.log(`\nWord List (ID 1-${maxId}):`);
    console.log('-'.repeat(60));
    console.log('ID  | Word               | Difficulty Score | Level');
    console.log('-'.repeat(60));
    
    for (const word of data) {
      const id = String(word.id).padEnd(3);
      const wordText = (word.word || '').padEnd(18).substring(0, 18);
      const score = word.difficulty_score !== null 
        ? word.difficulty_score.toFixed(2).padEnd(16)
        : 'N/A'.padEnd(16);
      const level = (word.difficulty_level || 'N/A').padEnd(10);
      
      console.log(`${id} | ${wordText} | ${score} | ${level}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error retrieving words:', error);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const maxId = args.length > 0 ? parseInt(args[0], 10) : 100;

  await listWords(maxId);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });
}

// Export for testing
module.exports = {
  listWords
}; 