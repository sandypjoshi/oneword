/**
 * Difficulty calculation state tracking module
 * Tracks which words have been processed for difficulty calculation
 */

const fs = require('fs');
const path = require('path');

// State file path
const STATE_FILE_PATH = path.join(__dirname, 'difficulty-state.json');

// Default state
const DEFAULT_STATE = {
  lastProcessedId: 0,
  totalProcessed: 0,
  totalSuccessful: 0,
  totalFailed: 0,
  totalSkipped: 0,
  processedRanges: [],
  processingStartTime: new Date().toISOString(),
  lastRunTime: new Date().toISOString()
};

/**
 * Load the current state from file or create a new one
 * @returns {Object} The current state
 */
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const state = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf8'));
      console.log('Loaded existing difficulty calculation state');
      return state;
    }
  } catch (error) {
    console.error('Error loading difficulty state file:', error);
  }

  // Create new state file if it doesn't exist
  console.log('Creating new difficulty calculation state');
  saveState(DEFAULT_STATE);
  return DEFAULT_STATE;
}

/**
 * Save the current state to file
 * @param {Object} state The state to save
 */
function saveState(state) {
  try {
    fs.writeFileSync(
      STATE_FILE_PATH,
      JSON.stringify({
        ...state,
        lastRunTime: new Date().toISOString()
      }, null, 2)
    );
  } catch (error) {
    console.error('Error saving difficulty state file:', error);
  }
}

/**
 * Check if a word ID has already been processed
 * @param {number} wordId The word ID to check
 * @param {Object} state The current state
 * @returns {boolean} True if processed, false otherwise
 */
function isWordProcessed(wordId, state) {
  if (!state.processedRanges || !state.processedRanges.length) return false;
  
  // Check if ID is in any of the processed ranges
  return state.processedRanges.some(range => 
    wordId >= range.start && wordId <= range.end
  );
}

/**
 * Add a processed word ID range to the state
 * @param {number} startId The start ID of the range
 * @param {number} endId The end ID of the range
 * @param {Object} state The current state
 * @returns {Object} The updated state
 */
function addProcessedRange(startId, endId, state) {
  const newState = { ...state };
  
  if (!newState.processedRanges) {
    newState.processedRanges = [];
  }
  
  // Add the new range
  newState.processedRanges.push({
    start: startId,
    end: endId,
    timestamp: new Date().toISOString()
  });
  
  // Merge overlapping ranges
  newState.processedRanges = mergeRanges(newState.processedRanges);
  
  return newState;
}

/**
 * Merge overlapping ranges
 * @param {Array} ranges The ranges to merge
 * @returns {Array} The merged ranges
 */
function mergeRanges(ranges) {
  if (!ranges || ranges.length <= 1) return ranges;
  
  // Sort ranges by start ID
  const sortedRanges = [...ranges].sort((a, b) => a.start - b.start);
  
  const mergedRanges = [sortedRanges[0]];
  
  for (let i = 1; i < sortedRanges.length; i++) {
    const currentRange = sortedRanges[i];
    const lastMerged = mergedRanges[mergedRanges.length - 1];
    
    // Check if ranges overlap
    if (currentRange.start <= lastMerged.end + 1) {
      // Merge ranges
      lastMerged.end = Math.max(lastMerged.end, currentRange.end);
      lastMerged.timestamp = new Date().toISOString();
    } else {
      // Add as new range
      mergedRanges.push(currentRange);
    }
  }
  
  return mergedRanges;
}

/**
 * Update state with newly processed words
 * @param {Object} state The current state
 * @param {Object} update The update data
 * @returns {Object} The updated state
 */
function updateState(state, update) {
  const newState = { 
    ...state,
    totalProcessed: (state.totalProcessed || 0) + (update.processed || 0),
    totalSuccessful: (state.totalSuccessful || 0) + (update.successful || 0),
    totalFailed: (state.totalFailed || 0) + (update.failed || 0),
    totalSkipped: (state.totalSkipped || 0) + (update.skipped || 0),
    lastProcessedId: Math.max(state.lastProcessedId || 0, update.lastProcessedId || 0),
    lastRunTime: new Date().toISOString()
  };
  
  // Add processed range if IDs are provided
  if (update.startId !== undefined && update.endId !== undefined) {
    return addProcessedRange(update.startId, update.endId, newState);
  }
  
  return newState;
}

/**
 * Get SQL query for finding unprocessed enriched words
 * @param {number} limit Maximum number of words to return
 * @returns {string} SQL query
 */
function getUnprocessedEnrichedWordsQuery(limit = 100) {
  return `
    SELECT id, word, frequency, syllable_count, pos, enrichment_eligible
    FROM words
    WHERE 
      enrichment_eligible = 'eligible-word'
      AND frequency IS NOT NULL
      AND difficulty_score IS NULL
    ORDER BY id
    LIMIT ${limit};
  `;
}

module.exports = {
  loadState,
  saveState,
  isWordProcessed,
  addProcessedRange,
  updateState,
  getUnprocessedEnrichedWordsQuery
}; 