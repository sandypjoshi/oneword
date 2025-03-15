const fs = require('fs-extra');
const csv = require('csv-parser');
const path = require('path');

// File paths - adjust these paths to where your CSV files are located
const DIFFICULTY_FILE = 'word_datasets/WordDifficulty.csv';  // Word Difficulty dataset
const PREVALENCE_FILE = 'word_datasets/word-prevalence.csv';  // Word Prevalence dataset
const FREQUENCY_FILE = 'word_datasets/ngram_freq_dict.csv';  // Dictionary Word Frequency dataset
const OUTPUT_FILE = 'combined-words.json';

// Tracking variables
const combinedData = {};
const stats = {
  difficulty: 0,
  prevalence: 0,
  frequency: 0,
  inAll: 0,
  inTwo: 0,
  inOne: 0,
  total: 0
};

// Main processing function
async function processDatasets() {
  console.log('Starting dataset processing');
  const startTime = Date.now();

  // Process each dataset sequentially to avoid memory issues
  await processDifficultyData();
  await processPrevalenceData();
  await processFrequencyData();
  await calculateScores();
  await saveResults();

  const duration = (Date.now() - startTime) / 1000;
  console.log(`Processing completed in ${duration.toFixed(2)} seconds`);
  logStats();
}

// Process Word Difficulty dataset
async function processDifficultyData() {
  console.log('Processing Word Difficulty dataset...');
  return new Promise((resolve, reject) => {
    fs.createReadStream(DIFFICULTY_FILE)
      .pipe(csv())
      .on('data', (row) => {
        if (row.Word && row.Word.trim()) {
          const word = row.Word.toLowerCase().trim();
          
          if (!combinedData[word]) {
            combinedData[word] = {
              word: word,
              sources: ['difficulty'],
              i_zscore: parseFloat(row.I_Zscore) || null,
              freq_hal: parseInt(row.Freq_HAL) || null,
              length: word.length,
              prevalence: null,
              freq_zipf: null,
              google_freq: null,
              score: null,
              level: null
            };
          } else {
            // Ensure sources array exists and add source if not already included
            if (!combinedData[word].sources) {
              combinedData[word].sources = [];
            }
            if (!combinedData[word].sources.includes('difficulty')) {
              combinedData[word].sources.push('difficulty');
            }
            combinedData[word].i_zscore = parseFloat(row.I_Zscore) || null;
            combinedData[word].freq_hal = parseInt(row.Freq_HAL) || null;
          }
          stats.difficulty++;
        }
      })
      .on('end', () => {
        console.log(`Word Difficulty processing complete. ${stats.difficulty} words processed.`);
        resolve();
      })
      .on('error', reject);
  });
}

// Process Word Prevalence dataset
async function processPrevalenceData() {
  console.log('Processing Word Prevalence dataset...');
  return new Promise((resolve, reject) => {
    fs.createReadStream(PREVALENCE_FILE)
      .pipe(csv())
      .on('data', (row) => {
        if (row.Word && row.Word.trim()) {
          const word = row.Word.toLowerCase().trim();
          
          if (!combinedData[word]) {
            combinedData[word] = {
              word: word,
              sources: ['prevalence'],
              i_zscore: null,
              freq_hal: null,
              length: word.length,
              prevalence: parseFloat(row.Prevalence) || null,
              freq_zipf: parseFloat(row.FreqZipfUS) || null,
              google_freq: null,
              score: null,
              level: null
            };
          } else {
            // Ensure sources array exists and add source if not already included
            if (!combinedData[word].sources) {
              combinedData[word].sources = [];
            }
            if (!combinedData[word].sources.includes('prevalence')) {
              combinedData[word].sources.push('prevalence');
            }
            combinedData[word].prevalence = parseFloat(row.Prevalence) || null;
            combinedData[word].freq_zipf = parseFloat(row.FreqZipfUS) || null;
          }
          stats.prevalence++;
        }
      })
      .on('end', () => {
        console.log(`Word Prevalence processing complete. ${stats.prevalence} words processed.`);
        resolve();
      })
      .on('error', reject);
  });
}

// Process Dictionary Word Frequency dataset
async function processFrequencyData() {
  console.log('Processing Dictionary Word Frequency dataset...');
  return new Promise((resolve, reject) => {
    fs.createReadStream(FREQUENCY_FILE)
      .pipe(csv())
      .on('data', (row) => {
        if (row.word && row.word.trim()) {
          const word = row.word.toLowerCase().trim();
          
          if (!combinedData[word]) {
            combinedData[word] = {
              word: word,
              sources: ['frequency'],
              i_zscore: null,
              freq_hal: null,
              length: word.length,
              prevalence: null,
              freq_zipf: null,
              google_freq: parseInt(row.count) || null,
              score: null,
              level: null
            };
          } else {
            // Ensure sources array exists and add source if not already included
            if (!combinedData[word].sources) {
              combinedData[word].sources = [];
            }
            if (!combinedData[word].sources.includes('frequency')) {
              combinedData[word].sources.push('frequency');
            }
            combinedData[word].google_freq = parseInt(row.count) || null;
          }
          stats.frequency++;
        }
      })
      .on('end', () => {
        console.log(`Dictionary Frequency processing complete. ${stats.frequency} words processed.`);
        resolve();
      })
      .on('error', reject);
  });
}

// Calculate composite difficulty scores
async function calculateScores() {
  console.log('Calculating composite difficulty scores...');
  
  let count = 0;
  for (const word in combinedData) {
    count++;
    if (count % 50000 === 0) {
      console.log(`Processed ${count} words...`);
    }
    
    combinedData[word].score = calculateCompositeScore(combinedData[word]);
    combinedData[word].level = getDifficultyLevel(combinedData[word].score);
    
    // Count stats
    const sourceCount = combinedData[word].sources.length;
    if (sourceCount === 3) stats.inAll++;
    else if (sourceCount === 2) stats.inTwo++;
    else if (sourceCount === 1) stats.inOne++;
  }
  
  stats.total = Object.keys(combinedData).length;
  console.log(`Score calculation complete for ${stats.total} words.`);
}

// Calculate composite difficulty score
function calculateCompositeScore(wordData) {
  let score = 0;
  let weightSum = 0;
  
  // Use I_Zscore if available (0-1 scale, higher = harder)
  if (wordData.i_zscore !== null) {
    score += wordData.i_zscore * 3;  // Weight of 3
    weightSum += 3;
  }
  
  // Use prevalence if available (-1 to 2.5 scale, higher = easier)
  if (wordData.prevalence !== null) {
    // Invert and normalize
    const prevalenceDifficulty = Math.max(0, Math.min(1, (2.5 - wordData.prevalence) / 3.5));
    score += prevalenceDifficulty * 2;  // Weight of 2
    weightSum += 2;
  }
  
  // Use Google frequency if available (higher = easier)
  if (wordData.google_freq !== null && wordData.google_freq > 0) {
    // Convert to log scale and normalize
    const logFreq = Math.log10(wordData.google_freq + 1);
    const maxLogFreq = 11; // log10 of highest frequency words
    const freqDifficulty = Math.max(0, Math.min(1, 1 - (logFreq / maxLogFreq)));
    score += freqDifficulty * 2;  // Weight of 2
    weightSum += 2;
  }
  
  // Use frequency from other sources if available
  if (weightSum === 0) {
    if (wordData.freq_zipf !== null) {
      // ZipF scale 1-7, convert to 0-1 difficulty
      const freqDifficulty = Math.max(0, Math.min(1, (7 - wordData.freq_zipf) / 6));
      score += freqDifficulty;
      weightSum += 1;
    } else if (wordData.freq_hal !== null) {
      // Log frequency normalization
      const freqDifficulty = Math.max(0, Math.min(1, 1 - (Math.log10(wordData.freq_hal + 1) / 10)));
      score += freqDifficulty;
      weightSum += 1;
    }
  }
  
  // Default to word length as proxy if no other data
  if (weightSum === 0) {
    return Math.min(0.9, wordData.length / 15);
  }
  
  return score / weightSum;  // Weighted average
}

// Map score to difficulty level
function getDifficultyLevel(score) {
  if (score < 0.33) return 'beginner';
  if (score < 0.67) return 'intermediate';
  return 'advanced';
}

// Save results to file
async function saveResults() {
  console.log('Saving combined dataset...');
  await fs.writeJson(OUTPUT_FILE, combinedData, { spaces: 2 });
  console.log(`Dataset saved to ${OUTPUT_FILE}`);
}

// Log statistics
function logStats() {
  console.log('\n=== Dataset Statistics ===');
  console.log(`Total unique words: ${stats.total}`);
  console.log(`Words from Difficulty dataset: ${stats.difficulty}`);
  console.log(`Words from Prevalence dataset: ${stats.prevalence}`);
  console.log(`Words from Frequency dataset: ${stats.frequency}`);
  console.log(`Words in all three datasets: ${stats.inAll}`);
  console.log(`Words in exactly two datasets: ${stats.inTwo}`);
  console.log(`Words in only one dataset: ${stats.inOne}`);
}

// Run the process
processDatasets()
  .then(() => console.log('Dataset processing completed successfully'))
  .catch(err => console.error('Error processing datasets:', err));
