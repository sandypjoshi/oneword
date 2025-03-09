/**
 * Word Difficulty Calculator
 * 
 * This script calculates difficulty scores for words using a multi-factor approach
 * with domain-based complexity as a key component.
 * 
 * Usage:
 * - Single word: node calculate-difficulty.js --word "example"
 * - Batch mode: node calculate-difficulty.js --batch --start 1 --limit 100
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://ipljgsggnbdwaomjfuok.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbGpnc2dnbmJkd2FvbWpmdW9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTA4MDEwNiwiZXhwIjoyMDU2NjU2MTA2fQ.qkwn-imaZVnK6IGFgG75eFcFEQySgzIN_gvUJbbDFWE';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const DEFAULT_BATCH_SIZE = 50;
const DELAY_BETWEEN_BATCHES_MS = 1000;

// Load the difficulty state tracker
const difficultyState = require('./difficulty-state');

/**
 * Calculate difficulty score for a single word
 * @param {Object} wordData - Word data from database
 * @param {Object} config - Difficulty configuration
 * @param {Object} domainValues - Domain difficulty values
 * @returns {Object} Difficulty score and details
 */
async function calculateWordDifficulty(wordData, config, domainValues) {
  // Default to medium difficulty if no data
  if (!wordData) {
    console.warn('No word data provided, returning default difficulty');
    return { score: 0.5, level: 'intermediate' };
  }

  // Skip phrases (words with spaces)
  if (wordData.word && wordData.word.includes(' ')) {
    console.log(`Skipping phrase: "${wordData.word}"`);
    return { 
      score: null, 
      level: null, 
      skipped: true, 
      reason: 'Phrase not scored'
    };
  }
  
  try {
    // Calculate component scores
    let frequencyScore;
    let usesFallback = false;
    
    // Handle words without frequency data using fallback logic
    if (!wordData.frequency) {
      usesFallback = true;
      console.log(`Using fallback calculation for word without frequency: "${wordData.word}"`);
      
      // Fallback based on word length and syllables
      // Longer words and more syllables typically correlate with lower frequency
      const wordLength = wordData.word?.length || 0;
      const syllables = wordData.syllable_count || wordData.syllables || estimateSyllables(wordData.word);
      
      // Estimate frequency score based on length and syllables
      // Higher values indicate less frequent (more difficult) words
      frequencyScore = Math.min(0.7, (wordLength / 20) + (syllables / 10));
    } else {
      frequencyScore = calculateFrequencyScore(wordData.frequency);
    }
    
    const lengthScore = calculateLengthScore(wordData.word?.length || 0);
    const syllableScore = calculateSyllableScore(wordData.syllable_count || wordData.syllables || estimateSyllables(wordData.word));
    const polysemyScore = calculatePolysemyScore(wordData.polysemy || 0);
    const domainScore = await calculateDomainScore(wordData, domainValues);

    // Apply weights from configuration
    const weightedScore = 
      (config.frequency * frequencyScore) +
      (config.word_length * lengthScore) +
      (config.syllable_count * syllableScore) +
      (config.polysemy * polysemyScore) +
      (config.domain_complexity * domainScore);

    // Determine difficulty level based on bands
    const level = getDifficultyLevel(weightedScore);

    return {
      score: roundToTwoDecimals(weightedScore),
      level,
      usesFallback,
      components: {
        frequency: roundToTwoDecimals(frequencyScore),
        length: roundToTwoDecimals(lengthScore),
        syllables: roundToTwoDecimals(syllableScore),
        polysemy: roundToTwoDecimals(polysemyScore),
        domain: roundToTwoDecimals(domainScore)
      }
    };
  } catch (error) {
    console.error('Error calculating difficulty:', error);
    return { score: 0.5, level: 'intermediate', error: error.message };
  }
}

/**
 * Calculate frequency score
 * Lower frequency words are more difficult (higher score)
 * @param {Number} frequency - Word frequency value
 * @returns {Number} Score from 0-1
 */
function calculateFrequencyScore(frequency) {
  if (!frequency || isNaN(frequency)) {
    return 0.5; // Default to medium difficulty
  }

  // Normalize frequency using logarithmic scale
  // Max reasonable frequency observed: ~500,000
  const MAX_LOG_FREQ = Math.log(500000);
  
  // Apply log scale to smooth out extremely high frequencies
  const logFreq = Math.log(Math.max(frequency, 1)); // Avoid log(0)
  
  // Invert so higher score = more difficult (rarer words)
  const score = 1 - (logFreq / MAX_LOG_FREQ);
  
  // Ensure score is in 0-1 range
  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate length score
 * Longer words are more difficult
 * @param {Number} length - Word length in characters
 * @returns {Number} Score from 0-1
 */
function calculateLengthScore(length) {
  if (!length || isNaN(length)) {
    return 0.5; // Default to medium difficulty
  }

  // Consider reasonable length range: 1-20 characters
  // Beyond 15 chars, difficulty maxes out
  const normalizedLength = Math.min(length, 15) / 15;
  
  // Apply non-linear scaling to better represent difficulty perception
  return Math.pow(normalizedLength, 0.8);
}

/**
 * Calculate syllable score
 * More syllables = more difficult
 * @param {Number} syllables - Number of syllables
 * @returns {Number} Score from 0-1
 */
function calculateSyllableScore(syllables) {
  if (!syllables || isNaN(syllables)) {
    return 0.5; // Default to medium difficulty
  }

  // Consider reasonable syllable range: 1-8 syllables
  // Beyond 6 syllables, difficulty maxes out
  const normalizedSyllables = Math.min(syllables, 6) / 6;
  
  // Apply scaling
  return normalizedSyllables;
}

/**
 * Calculate polysemy score
 * Words with more meanings have mixed difficulty impact
 * @param {Number} polysemy - Number of meanings
 * @returns {Number} Score from 0-1
 */
function calculatePolysemyScore(polysemy) {
  if (!polysemy || isNaN(polysemy)) {
    return 0.5; // Default to medium difficulty
  }

  // Words with very few meanings (1-2) or many meanings (7+) are typically harder
  // Words with medium polysemy (3-4) tend to be more common and easier to learn
  
  if (polysemy <= 1) {
    return 0.7; // Single-meaning words can be specialized/difficult
  } else if (polysemy >= 7) {
    return 0.8; // Many-meaning words are complex
  } else {
    // U-shaped curve: 3-4 meanings is easiest, 1 or 7+ is hardest
    return 0.7 - 0.2 * Math.sin(Math.PI * (polysemy - 1) / 6);
  }
}

/**
 * Determine difficulty level based on score
 * @param {Number} score - Difficulty score (0-1)
 * @returns {String} Difficulty level
 */
function getDifficultyLevel(score) {
  if (score < 0.4) {
    return 'beginner';
  } else if (score < 0.7) {
    return 'intermediate';
  } else {
    return 'advanced';
  }
}

/**
 * Round number to two decimal places
 * @param {Number} num - Number to round
 * @returns {Number} Rounded number
 */
function roundToTwoDecimals(num) {
  return Math.round(num * 100) / 100;
}

/**
 * Process a single word (fetch data and calculate difficulty)
 * @param {String} word - Word to process
 * @returns {Object} Word data with difficulty score
 */
async function processWord(word) {
  try {
    console.log(`Processing word: ${word}`);

    // Load configuration
    const config = await loadConfiguration();
    const domainValues = await loadDomainValues();

    // Fetch word data
    const { data: wordData, error } = await supabase
      .from('words')
      .select(`
        *,
        word_synsets (
          *,
          synsets (
            *
          )
        )
      `)
      .eq('word', word.toLowerCase())
      .limit(1)
      .single();

    if (error) {
      console.error(`Error fetching word data for ${word}:`, error);
      return { word, error: error.message };
    }

    // Calculate difficulty
    const difficultyResult = await calculateWordDifficulty(wordData, config, domainValues);

    // Return combined result
    return {
      id: wordData.id,
      word: wordData.word,
      pos: wordData.pos,
      frequency: wordData.frequency,
      syllables: wordData.syllable_count || wordData.syllables,
      polysemy: wordData.polysemy,
      domains: wordData.word_synsets?.map(ws => ws.synsets?.domain).filter(Boolean),
      difficulty: difficultyResult
    };
  } catch (error) {
    console.error(`Error processing word ${word}:`, error);
    return { word, error: error.message };
  }
}

/**
 * Process words in batch mode
 * @param {Number} startId - Starting word ID
 * @param {Number} limit - Maximum number of words to process
 * @param {Boolean} updateDatabase - Whether to update the database
 * @returns {Object} Processing results
 */
async function processBatch(startId = 1, limit = DEFAULT_BATCH_SIZE, updateDatabase = true) {
  try {
    console.log(`Processing batch starting from ID ${startId}, limit ${limit}`);

    // Load configuration once for the batch
    const config = await loadConfiguration();
    const domainValues = await loadDomainValues();

    // Fetch batch of words
    const { data: words, error } = await supabase
      .from('words')
      .select(`
        *,
        word_synsets (
          *,
          synsets (
            *
          )
        )
      `)
      .gt('id', startId)
      .order('id', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching words batch:', error);
      return { success: false, error: error.message };
    }

    console.log(`Fetched ${words.length} words`);
    console.log('Always overwriting existing difficulty values');

    // Process each word
    const results = [];
    let successful = 0;
    let skipped = 0;
    let errors = 0;
    let fallbackCount = 0;
    
    for (const wordData of words) {
      try {
        // Calculate difficulty - always calculate fresh values
        const difficultyResult = await calculateWordDifficulty(wordData, config, domainValues);
        
        // Save result
        results.push({
          id: wordData.id,
          word: wordData.word,
          difficulty: difficultyResult
        });
        
        // Handle skipped words (phrases)
        if (difficultyResult.skipped) {
          console.log(`Skipping word "${wordData.word}" - Reason: ${difficultyResult.reason}`);
          skipped++;
          
          // If updating database, mark skipped words
          if (updateDatabase) {
            const { error: updateError } = await supabase
              .from('words')
              .update({
                difficulty_score: null,
                difficulty_level: null,
                updated_at: new Date().toISOString()
              })
              .eq('id', wordData.id);
              
            if (updateError) {
              console.error(`Error updating skipped word ID ${wordData.id}:`, updateError);
              errors++;
            }
          }
          continue;
        }
        
        // Track if fallback logic was used
        if (difficultyResult.usesFallback) {
          fallbackCount++;
        }
        
        // Update database if needed for normal calculation
        // Always overwrite existing values without checking if they exist
        if (updateDatabase) {
          const { error: updateError } = await supabase
            .from('words')
            .update({
              difficulty_score: difficultyResult.score,
              difficulty_level: difficultyResult.level,
              updated_at: new Date().toISOString()
            })
            .eq('id', wordData.id);

          if (updateError) {
            console.error(`Error updating word ID ${wordData.id}:`, updateError);
            errors++;
          } else {
            // Indicate if we're overwriting an existing value
            const hadExistingScore = wordData.difficulty_score !== null;
            console.log(`Updated word ID ${wordData.id} (${wordData.word}) with difficulty score ${difficultyResult.score} (${difficultyResult.level})${difficultyResult.usesFallback ? ' [FALLBACK]' : ''}${hadExistingScore ? ' [OVERWRITTEN]' : ''}`);
            successful++;
          }
        } else {
          successful++;
        }
      } catch (error) {
        console.error(`Error processing word ID ${wordData.id} (${wordData.word}):`, error);
        errors++;
      }
    }

    // Return the last processed ID for continuation
    const lastId = words.length > 0 ? words[words.length - 1].id : startId;
    
    console.log(`Batch summary: ${successful} successful (${fallbackCount} using fallback), ${skipped} skipped, ${errors} errors`);
    
    return {
      success: true,
      processed: words.length,
      successful,
      fallbackCount,
      skipped,
      errors,
      lastId,
      results
    };
  } catch (error) {
    console.error('Error processing batch:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Load difficulty configuration from database
 * @returns {Object} Configuration with weights
 */
async function loadConfiguration() {
  try {
    const { data, error } = await supabase
      .from('difficulty_configuration')
      .select('*')
      .eq('enabled', true);

    if (error) {
      console.error('Error loading difficulty configuration:', error);
      // Provide default configuration with increased frequency weight
      return {
        word_length: 0.12,
        frequency: 0.55, // Increased from 0.45 to 0.55
        polysemy: 0.08, // Reduced from 0.10
        syllable_count: 0.10, // Reduced from 0.15
        domain_complexity: 0.15
      };
    }

    // Convert to dictionary for easier access
    const config = {};
    for (const item of data) {
      config[item.parameter_name] = item.weight;
    }

    // If frequency weight is in the database, increase it to 0.55
    if (config.frequency) {
      // Calculate how much to increase frequency by (to reach 0.55)
      const targetFrequency = 0.55;
      const increaseAmount = targetFrequency - config.frequency;
      
      if (increaseAmount > 0) {
        // Reduce other weights proportionally
        const otherKeys = Object.keys(config).filter(k => k !== 'frequency');
        const totalOtherWeight = otherKeys.reduce((sum, key) => sum + config[key], 0);
        
        // Distribute the decrease across other parameters
        for (const key of otherKeys) {
          const proportionalDecrease = (config[key] / totalOtherWeight) * increaseAmount;
          config[key] = Math.max(0.05, config[key] - proportionalDecrease);
          config[key] = Math.round(config[key] * 100) / 100; // Round to 2 decimal places
        }
        
        // Set frequency weight to target
        config.frequency = targetFrequency;
      }
      
      console.log('Adjusted configuration weights:');
      console.log(config);
    }

    return config;
  } catch (error) {
    console.error('Error in loadConfiguration:', error);
    // Fallback to default with increased frequency weight
    return {
      word_length: 0.12,
      frequency: 0.55, // Increased from 0.45 to 0.55
      polysemy: 0.08, // Reduced from 0.10
      syllable_count: 0.10, // Reduced from 0.15
      domain_complexity: 0.15
    };
  }
}

/**
 * Load domain difficulty values from database
 * @returns {Object} Domain difficulty values
 */
async function loadDomainValues() {
  try {
    const { data, error } = await supabase
      .from('domain_difficulty_values')
      .select('*');

    if (error) {
      console.error('Error loading domain difficulty values:', error);
      return {}; // Return empty object as fallback
    }

    // Convert to dictionary for easier access
    const values = {};
    for (const item of data) {
      values[item.domain_name] = item.difficulty_value;
    }

    return values;
  } catch (error) {
    console.error('Error in loadDomainValues:', error);
    return {}; // Return empty object as fallback
  }
}

/**
 * Calculate domain complexity score
 * Different domains have different difficulty levels
 * @param {Object} wordData - Word data with synsets
 * @param {Object} domainValues - Domain difficulty values from database
 * @returns {Number} Score from 0-1
 */
async function calculateDomainScore(wordData, domainValues) {
  // Default domain score
  let defaultScore = 0.5;

  // If no word data or no synsets, return default
  if (!wordData || !wordData.word_synsets) {
    return defaultScore;
  }

  try {
    // Extract domains from synsets
    const domains = [];
    
    // Handle different data structures based on how the data was fetched
    if (Array.isArray(wordData.word_synsets)) {
      for (const ws of wordData.word_synsets) {
        // Check if synset data is nested or directly accessible
        const domain = ws.synsets?.domain || ws.domain;
        if (domain) {
          domains.push(domain);
        }
      }
    }

    // If no domains found, get from synset IDs
    if (domains.length === 0 && wordData.synsets) {
      for (const synset of wordData.synsets) {
        if (synset.domain) {
          domains.push(synset.domain);
        }
      }
    }

    // If still no domains, try to extract from definitions
    if (domains.length === 0 && wordData.definitions) {
      // Look for domain markers like "(Medicine)" or "(Biology)" in definitions
      const domainRegex = /\(([^)]+)\)/g;
      for (const def of wordData.definitions) {
        if (!def) continue;
        
        const matches = [...def.matchAll(domainRegex)];
        for (const match of matches) {
          const potentialDomain = match[1].toLowerCase();
          // Check if this might be a domain
          if (!potentialDomain.includes(' ') && potentialDomain.length > 2) {
            domains.push(potentialDomain);
          }
        }
      }
    }

    // If still no domains, return default score
    if (domains.length === 0) {
      return defaultScore;
    }

    // Calculate average domain difficulty
    let totalDifficulty = 0;
    let matchedDomains = 0;

    for (const domain of domains) {
      const domainValue = domainValues[domain];
      if (domainValue !== undefined) {
        totalDifficulty += domainValue;
        matchedDomains++;
      }
    }

    // If no matched domains, return default
    if (matchedDomains === 0) {
      return defaultScore;
    }

    return totalDifficulty / matchedDomains;
  } catch (error) {
    console.error('Error calculating domain score:', error);
    return defaultScore;
  }
}

/**
 * Estimate number of syllables in a word
 * Simple algorithm: count vowel clusters
 * @param {String} word - Word to estimate syllables for
 * @returns {Number} Estimated syllable count
 */
function estimateSyllables(word) {
  if (!word) return 1;
  
  // Convert to lowercase
  word = word.toLowerCase();
  
  // Count vowel clusters
  const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
  let syllableCount = 0;
  let inVowelGroup = false;
  
  for (let i = 0; i < word.length; i++) {
    if (vowels.includes(word[i])) {
      if (!inVowelGroup) {
        syllableCount++;
        inVowelGroup = true;
      }
    } else {
      inVowelGroup = false;
    }
  }
  
  // Handle special cases
  // Words ending in 'e' often don't pronounce it as a syllable unless it's the only vowel
  if (word.endsWith('e') && syllableCount > 1) {
    syllableCount--;
  }
  
  // Words can't have zero syllables
  return Math.max(1, syllableCount);
}

/**
 * Main function to parse command line arguments and run the script
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const argDict = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = i + 1 < args.length && !args[i + 1].startsWith('--') 
        ? args[i + 1] 
        : true;
      argDict[key] = value;
      if (value !== true) i++; // Skip the value in the next iteration
    }
  }

  // Load current state
  const currentState = difficultyState.loadState();
  console.log('Current difficulty calculation state:');
  console.log(`- Last processed ID: ${currentState.lastProcessedId}`);
  console.log(`- Total processed: ${currentState.totalProcessed}`);
  console.log(`- Words with frequency: ${currentState.totalWithFrequency}`);
  console.log(`- Words without frequency: ${currentState.totalWithoutFrequency}`);
  
  // Check mode
  if (argDict.word) {
    // Single word mode
    const word = argDict.word;
    console.log(`Processing single word: "${word}" (will overwrite existing difficulty value if present)`);
    const result = await processWord(word);
    console.log(JSON.stringify(result, null, 2));
  } else if (argDict.batch) {
    // Batch mode
    let startId = parseInt(argDict.start || '0', 10);
    const endId = parseInt(argDict.end || '1000', 10); // Default end to 1000
    const batchSize = parseInt(argDict.limit || String(DEFAULT_BATCH_SIZE), 10);
    const updateDb = argDict.update !== 'false'; // Default to true
    const skipProcessed = argDict.skipProcessed !== 'false'; // Default to true
    
    console.log(`Target processing range: ${startId} to ${endId}`);
    
    if (skipProcessed) {
      // Get ranges that haven't been processed yet
      const unprocessedRanges = difficultyState.getUnprocessedRanges(startId, endId);
      
      console.log(`Found ${unprocessedRanges.length} unprocessed ranges:`);
      for (const range of unprocessedRanges) {
        console.log(`- IDs ${range.start} to ${range.end} (${range.end - range.start + 1} words)`);
      }
      
      if (unprocessedRanges.length === 0) {
        console.log('All words in this range have already been processed. Nothing to do.');
        return;
      }
      
      // Process each unprocessed range
      for (const range of unprocessedRanges) {
        console.log(`\nProcessing unprocessed range: ${range.start} to ${range.end}`);
        
        let rangeStartId = range.start;
        let totalProcessed = 0;
        let totalWithFrequency = 0;
        let totalWithoutFrequency = 0;
        let batchNum = 1;
        
        while (rangeStartId <= range.end) {
          console.log(`Processing batch #${batchNum} in range, starting from ID ${rangeStartId}`);
          
          // Calculate effective limit for this batch
          const effectiveLimit = Math.min(batchSize, range.end - rangeStartId + 1);
          
          const result = await processBatch(rangeStartId, effectiveLimit, updateDb);
          
          if (!result.success) {
            console.error(`Batch processing failed: ${result.error}`);
            break;
          }
          
          // Track stats for this range
          totalProcessed += result.processed;
          totalWithFrequency += (result.successful || 0);
          totalWithoutFrequency += (result.skipped || 0) + (result.errors || 0);
          
          console.log(`Batch #${batchNum} complete, processed ${result.processed} words. Total in this range: ${totalProcessed}`);
          
          // If no words processed or reached the end of range, stop
          if (result.processed === 0 || rangeStartId >= range.end) {
            break;
          }
          
          // Update for next batch
          rangeStartId = result.lastId + 1; // Start from next ID
          batchNum++;
          
          // Add delay between batches
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
        }
        
        // Update state for this range
        console.log(`Completed range ${range.start} to ${range.end}. Processed ${totalProcessed} words (${totalWithFrequency} with frequency data).`);
        difficultyState.updateState(range.start, range.end, totalWithFrequency, totalWithoutFrequency);
      }
      
      // Final summary
      const finalState = difficultyState.loadState();
      console.log(`\nProcessing complete for all unprocessed ranges.`);
      console.log(`Updated state: Total processed: ${finalState.totalProcessed}, Last ID: ${finalState.lastProcessedId}`);
    } else {
      // Standard batch processing (process everything in range)
      console.log(`\nProcessing entire range: ${startId} to ${endId} (ignoring previous processing state)`);
      console.log('NOTE: This will overwrite any existing difficulty values in the database');
      
      let totalProcessed = 0;
      let totalSuccessful = 0;
      let totalSkipped = 0;
      let totalErrors = 0;
      let totalFallback = 0;
      let batchNum = 1;
      
      while (startId <= endId) {
        console.log(`Processing batch #${batchNum}, starting from ID ${startId}`);
        
        // Calculate effective limit for this batch
        const effectiveLimit = Math.min(batchSize, endId - startId + 1);
        
        const result = await processBatch(startId, effectiveLimit, updateDb);
        
        if (!result.success) {
          console.error(`Batch processing failed: ${result.error}`);
          break;
        }
        
        totalProcessed += result.processed;
        totalSuccessful += result.successful || 0;
        totalSkipped += result.skipped || 0;
        totalErrors += result.errors || 0;
        totalFallback += result.fallbackCount || 0;
        
        console.log(`Batch #${batchNum} complete, processed ${result.processed} words. Total: ${totalProcessed}`);
        
        // If no words processed or reached the end, stop
        if (result.processed === 0 || startId >= endId) {
          break;
        }
        
        // Update for next batch
        startId = result.lastId + 1; // Start from next ID
        batchNum++;
        
        // Add delay between batches
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
      }
      
      // Update state for full range
      difficultyState.updateState(parseInt(argDict.start || '0', 10), endId, totalSuccessful, totalSkipped + totalErrors);
      
      console.log(`Batch processing complete. Total processed: ${totalProcessed} words`);
      console.log(`Final results: ${totalSuccessful} successful (${totalFallback} using fallback), ${totalSkipped} skipped, ${totalErrors} errors`);
    }
  } else {
    // Show usage
    console.log('Usage:');
    console.log('  Single word: node calculate-difficulty.js --word "example"');
    console.log('  Batch mode: node calculate-difficulty.js --batch --start 1 --end 1000 [--limit 50] [--update false] [--skipProcessed false]');
    console.log('    --start: Starting word ID (default: 0)');
    console.log('    --end: Ending word ID (default: 1000)');
    console.log('    --limit: Number of words per batch (default: 50)');
    console.log('    --update: Whether to update the database (default: true)');
    console.log('    --skipProcessed: Whether to skip already processed words (default: true)');
    console.log('\nNote: The script will always overwrite existing difficulty values in the database');
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });
}

// Export functions for testing or importing
module.exports = {
  calculateWordDifficulty,
  processWord,
  processBatch
}; 