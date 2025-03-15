require('dotenv').config();
const fs = require('fs-extra');
const { createClient } = require('@supabase/supabase-js');

// Config
const COMBINED_DATA_FILE = 'combined-words.json';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper for word format categorization
function categorizeWordFormat(word) {
  if (!word) return 'empty';
  
  const hasUnderscore = word.includes('_');
  const hasHyphen = word.includes('-');
  const hasSpace = word.includes(' ');
  const hasSpecialChars = /[^a-zA-Z0-9\s_-]/.test(word);
  
  if (hasUnderscore && hasHyphen) return 'mixed_separators';
  if (hasUnderscore) return 'underscore';
  if (hasHyphen) return 'hyphen';
  if (hasSpace) return 'space';
  if (hasSpecialChars) return 'special_chars';
  return 'simple_word';
}

// Function to analyze formats in a word list
function analyzeWordFormats(words, source) {
  const formatStats = {
    total: words.length,
    byFormat: {
      empty: 0,
      simple_word: 0,
      underscore: 0,
      hyphen: 0,
      space: 0,
      mixed_separators: 0,
      special_chars: 0
    },
    examples: {
      empty: [],
      simple_word: [],
      underscore: [],
      hyphen: [],
      space: [],
      mixed_separators: [],
      special_chars: []
    }
  };
  
  // Count each format
  words.forEach(word => {
    const format = categorizeWordFormat(word);
    formatStats.byFormat[format]++;
    
    // Store example if we don't have enough yet
    if (formatStats.examples[format].length < 10) {
      formatStats.examples[format].push(word);
    }
  });
  
  // Calculate percentages
  Object.keys(formatStats.byFormat).forEach(format => {
    const count = formatStats.byFormat[format];
    const percentage = (count / formatStats.total * 100).toFixed(2);
    formatStats.byFormat[format] = {
      count,
      percentage: `${percentage}%`
    };
  });
  
  console.log(`\n--- FORMAT ANALYSIS FOR ${source.toUpperCase()} ---`);
  console.log(`Total words: ${formatStats.total}`);
  
  // Print statistics by format
  console.log('\nFormat Statistics:');
  Object.keys(formatStats.byFormat).forEach(format => {
    const stats = formatStats.byFormat[format];
    console.log(`${format}: ${stats.count} (${stats.percentage})`);
  });
  
  // Print examples
  console.log('\nFormat Examples:');
  Object.keys(formatStats.examples).forEach(format => {
    const examples = formatStats.examples[format];
    if (examples.length > 0) {
      console.log(`\n${format}:`);
      console.log(examples);
    }
  });
  
  console.log(`\n--- END FORMAT ANALYSIS FOR ${source.toUpperCase()} ---\n`);
  
  return formatStats;
}

// Main analysis function
async function auditWordFormats() {
  console.log('Starting word format audit...');
  
  try {
    // 1. Load dataset words
    console.log('Loading dataset words...');
    const combinedData = await fs.readJson(COMBINED_DATA_FILE);
    const datasetWords = Object.values(combinedData).map(entry => entry.word);
    console.log(`Loaded ${datasetWords.length} words from dataset`);
    
    // 2. Fetch database words
    console.log('Fetching database words...');
    const { data: dbWords, error } = await supabase
      .from('words')
      .select('word')
      .limit(100000);
      
    if (error) {
      throw new Error(`Error fetching database words: ${error.message}`);
    }
    
    const databaseWords = dbWords.map(entry => entry.word);
    console.log(`Fetched ${databaseWords.length} words from database`);
    
    // 3. Analyze both sources
    const datasetStats = analyzeWordFormats(datasetWords, 'dataset');
    const databaseStats = analyzeWordFormats(databaseWords, 'database');
    
    // 4. Find common formatting differences
    console.log('\n--- COMPARATIVE ANALYSIS ---');
    console.log('Format differences between dataset and database:');
    
    Object.keys(datasetStats.byFormat).forEach(format => {
      const datasetPct = parseFloat(datasetStats.byFormat[format].percentage);
      const dbPct = parseFloat(databaseStats.byFormat[format].percentage);
      
      if (Math.abs(datasetPct - dbPct) > 5) {
        console.log(`${format}: ${datasetPct.toFixed(2)}% in dataset vs ${dbPct.toFixed(2)}% in database`);
      }
    });
    
    // 5. Save the full analysis to a file
    const fullAnalysis = {
      dataset: datasetStats,
      database: databaseStats
    };
    
    await fs.writeJson('word-format-analysis.json', fullAnalysis, { spaces: 2 });
    console.log('\nDetailed analysis saved to word-format-analysis.json');
    
    // 6. Look for specific match issues
    console.log('\nLooking for potential match issues...');
    
    // Sample some dataset words with formatting that differs from database norm
    const potentialMismatchSamples = {};
    
    // If dataset has more underscore words but database has more spaces
    if (datasetStats.byFormat.underscore.count > databaseStats.byFormat.underscore.count && 
        databaseStats.byFormat.space.count > datasetStats.byFormat.space.count) {
      potentialMismatchSamples.underscore_vs_space = datasetStats.examples.underscore;
    }
    
    // If dataset has more hyphenated words but database doesn't
    if (datasetStats.byFormat.hyphen.count > databaseStats.byFormat.hyphen.count) {
      potentialMismatchSamples.hyphen_issues = datasetStats.examples.hyphen;
    }
    
    console.log('\nPotential mismatch samples:');
    console.log(potentialMismatchSamples);
    
    console.log('\nAudit completed successfully.');
  } catch (err) {
    console.error('Error during word format audit:', err);
  }
}

// Run the audit
auditWordFormats()
  .then(() => console.log('Audit process completed.'))
  .catch(err => console.error('Error in audit process:', err)); 