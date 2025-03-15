/**
 * Compare current difficulty scores with previous values
 * Shows how the increased frequency weight affects scoring
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://ipljgsggnbdwaomjfuok.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbGpnc2dnbmJkd2FvbWpmdW9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTA4MDEwNiwiZXhwIjoyMDU2NjU2MTA2fQ.qkwn-imaZVnK6IGFgG75eFcFEQySgzIN_gvUJbbDFWE';
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample word IDs to check
const SAMPLE_WORD_IDS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// Previous scores from your prior analysis (for comparison)
const PREVIOUS_SCORES = {
  10: { word: 'congener', score: 0.61, level: 'intermediate' },
  20: { word: 'biont', score: 0.74, level: 'advanced' },
  30: { word: 'soul', score: 0.32, level: 'beginner' },
  40: { word: 'native', score: 0.38, level: 'beginner' },
  50: { word: 'cognition', score: 0.49, level: 'intermediate' },
  60: { word: 'shape', score: 0.38, level: 'beginner' },
  70: { word: 'act', score: 0.31, level: 'beginner' },
  80: { word: 'measure', score: 0.42, level: 'intermediate' },
  90: { word: 'abort', score: 0.46, level: 'intermediate' },
  100: { word: 'effort', score: 0.34, level: 'beginner' }
};

async function compareScores() {
  try {
    // Get current weights
    const { data: weights, error: weightsError } = await supabase
      .from('difficulty_configuration')
      .select('parameter_name, weight')
      .eq('enabled', true);
      
    if (weightsError) {
      throw new Error(`Error fetching weights: ${weightsError.message}`);
    }
    
    // Display current weights
    console.log('Current difficulty weights:');
    weights.forEach(w => console.log(`- ${w.parameter_name}: ${w.weight}`));
    console.log();
    
    // Get current scores
    const { data: words, error: wordsError } = await supabase
      .from('words')
      .select('id, word, frequency, difficulty_score, difficulty_level')
      .in('id', SAMPLE_WORD_IDS)
      .order('id');
      
    if (wordsError) {
      throw new Error(`Error fetching words: ${wordsError.message}`);
    }
    
    // Compare and display
    console.log('Score Comparison (Higher frequency weight vs. Previous):');
    console.log('--------------------------------------------------------------------------------');
    console.log('ID | Word       | Frequency | New Score | New Level     | Old Score | Old Level');
    console.log('--------------------------------------------------------------------------------');
    
    let levelChanges = { 
      harder: 0, 
      easier: 0, 
      same: 0,
      toDifficult: 0,
      toEasy: 0
    };
    
    words.forEach(word => {
      const previous = PREVIOUS_SCORES[word.id];
      if (!previous) return;
      
      // Compare levels
      let levelChangeSign = '';
      if (word.difficulty_level === previous.level) {
        levelChanges.same++;
      } else if (
        (word.difficulty_level === 'beginner' && previous.level === 'intermediate') ||
        (word.difficulty_level === 'intermediate' && previous.level === 'advanced')
      ) {
        levelChanges.easier++;
        levelChangeSign = '↓';
        levelChanges.toEasy++;
      } else if (
        (word.difficulty_level === 'intermediate' && previous.level === 'beginner') ||
        (word.difficulty_level === 'advanced' && previous.level === 'intermediate')
      ) {
        levelChanges.harder++;
        levelChangeSign = '↑';
        levelChanges.toDifficult++;
      }
      
      // Format for display
      const wordPad = word.word.padEnd(11);
      const freqPad = (word.frequency ? word.frequency.toString() : 'N/A').padEnd(9);
      const newScorePad = (word.difficulty_score?.toFixed(2) || 'N/A').padEnd(9);
      const newLevelPad = `${word.difficulty_level || 'N/A'} ${levelChangeSign}`.padEnd(13);
      const oldScorePad = (previous.score?.toFixed(2) || 'N/A').padEnd(9);
      const oldLevelPad = previous.level || 'N/A';
      
      console.log(`${word.id.toString().padEnd(2)} | ${wordPad} | ${freqPad} | ${newScorePad} | ${newLevelPad} | ${oldScorePad} | ${oldLevelPad}`);
    });
    
    console.log('--------------------------------------------------------------------------------');
    console.log('\nLevel Changes Summary:');
    console.log(`- Words that became easier: ${levelChanges.easier}`);
    console.log(`- Words that became harder: ${levelChanges.harder}`);
    console.log(`- Words with unchanged level: ${levelChanges.same}`);
    
    console.log('\nThe increased frequency weight tends to:');
    if (levelChanges.toEasy > levelChanges.toDifficult) {
      console.log('- Make words EASIER overall (more words moved to easier levels)');
      console.log('- This makes sense since we\'re giving more weight to frequency, which helps common words score as easier');
    } else if (levelChanges.toDifficult > levelChanges.toEasy) {
      console.log('- Make words HARDER overall (more words moved to harder levels)');
    } else {
      console.log('- The effect is balanced between making words easier and harder');
    }
  } catch (error) {
    console.error('Error comparing scores:', error.message);
  }
}

// Run the comparison
compareScores(); 