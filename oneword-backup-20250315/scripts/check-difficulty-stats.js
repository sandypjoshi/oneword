/**
 * Script to check difficulty statistics
 * 
 * This script retrieves and displays statistics about word difficulty levels
 * in the database, including counts per level and score ranges.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://ipljgsggnbdwaomjfuok.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbGpnc2dnbmJkd2FvbWpmdW9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTA4MDEwNiwiZXhwIjoyMDU2NjU2MTA2fQ.qkwn-imaZVnK6IGFgG75eFcFEQySgzIN_gvUJbbDFWE';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get difficulty level statistics for words
 * @param {number} maxId - Maximum word ID to consider
 */
async function getDifficultyStats(maxId = 100) {
  try {
    console.log(`Getting difficulty stats for words with ID <= ${maxId}`);

    // Get all words with difficulty scores
    const { data, error } = await supabase
      .from('words')
      .select('id, word, difficulty_score, difficulty_level')
      .lte('id', maxId)
      .not('difficulty_score', 'is', null)
      .order('id');

    if (error) {
      throw error;
    }

    // Calculate statistics
    const totalWords = data.length;
    console.log(`Found ${totalWords} words with difficulty scores`);

    // Count by level
    const levelCounts = {
      beginner: 0,
      intermediate: 0,
      advanced: 0
    };

    for (const word of data) {
      if (word.difficulty_level) {
        levelCounts[word.difficulty_level]++;
      }
    }

    // Calculate score statistics
    const scores = data.map(w => w.difficulty_score);
    const avgScore = scores.reduce((acc, score) => acc + score, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    // Find words with min and max scores
    const minScoreWord = data.find(w => w.difficulty_score === minScore);
    const maxScoreWord = data.find(w => w.difficulty_score === maxScore);

    // Print statistics
    console.log('\nDifficulty Level Distribution:');
    console.log(`Beginner: ${levelCounts.beginner} (${(levelCounts.beginner / totalWords * 100).toFixed(1)}%)`);
    console.log(`Intermediate: ${levelCounts.intermediate} (${(levelCounts.intermediate / totalWords * 100).toFixed(1)}%)`);
    console.log(`Advanced: ${levelCounts.advanced} (${(levelCounts.advanced / totalWords * 100).toFixed(1)}%)`);

    console.log('\nDifficulty Score Statistics:');
    console.log(`Average Score: ${avgScore.toFixed(2)}`);
    console.log(`Minimum Score: ${minScore.toFixed(2)} (Word: "${minScoreWord.word}")`);
    console.log(`Maximum Score: ${maxScore.toFixed(2)} (Word: "${maxScoreWord.word}")`);

    // List 5 sample words from each level
    console.log('\nSample Words by Level:');
    
    console.log('\nBeginner Level Examples:');
    const beginnerSamples = data.filter(w => w.difficulty_level === 'beginner').slice(0, 5);
    for (const word of beginnerSamples) {
      console.log(`- "${word.word}" (Score: ${word.difficulty_score.toFixed(2)})`);
    }
    
    console.log('\nIntermediate Level Examples:');
    const intermediateSamples = data.filter(w => w.difficulty_level === 'intermediate').slice(0, 5);
    for (const word of intermediateSamples) {
      console.log(`- "${word.word}" (Score: ${word.difficulty_score.toFixed(2)})`);
    }
    
    console.log('\nAdvanced Level Examples:');
    const advancedSamples = data.filter(w => w.difficulty_level === 'advanced').slice(0, 5);
    for (const word of advancedSamples) {
      console.log(`- "${word.word}" (Score: ${word.difficulty_score.toFixed(2)})`);
    }

    return {
      totalWords,
      levelCounts,
      avgScore,
      minScore,
      maxScore,
      minScoreWord,
      maxScoreWord
    };
  } catch (error) {
    console.error('Error getting difficulty stats:', error);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const maxId = args.length > 0 ? parseInt(args[0], 10) : 100;

  await getDifficultyStats(maxId);
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
  getDifficultyStats
}; 