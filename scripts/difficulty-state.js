/**
 * Difficulty Calculation State Tracker
 * 
 * This module helps track which words have already had their difficulty calculated,
 * allowing for efficient resumption of processing.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const STATE_FILE = path.join(__dirname, 'difficulty-state.json');

/**
 * Default state object
 */
const DEFAULT_STATE = {
  lastProcessedId: 0,
  totalProcessed: 0,
  totalWithFrequency: 0,
  totalWithoutFrequency: 0,
  processingStartTime: new Date().toISOString(),
  lastUpdateTime: new Date().toISOString(),
  processedRanges: [] // Tracks ranges of IDs that have been processed
};

/**
 * Load the difficulty calculation state from file
 * @returns {Object} The loaded state or default state if file doesn't exist
 */
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const stateData = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(stateData);
    }
  } catch (error) {
    console.error(`Error loading difficulty state: ${error.message}`);
  }
  
  // Return default state if loading fails
  return { ...DEFAULT_STATE };
}

/**
 * Save the difficulty calculation state to file
 * @param {Object} state - The state to save
 * @returns {Boolean} Whether the save was successful
 */
function saveState(state) {
  try {
    const updatedState = {
      ...state,
      lastUpdateTime: new Date().toISOString()
    };
    
    fs.writeFileSync(STATE_FILE, JSON.stringify(updatedState, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving difficulty state: ${error.message}`);
    return false;
  }
}

/**
 * Update the state with newly processed word IDs
 * @param {Number} startId - Starting ID of processed range
 * @param {Number} endId - Ending ID of processed range
 * @param {Number} withFrequency - Count of words with frequency data
 * @param {Number} withoutFrequency - Count of words without frequency data
 * @returns {Object} Updated state
 */
function updateState(startId, endId, withFrequency, withoutFrequency) {
  const state = loadState();
  
  // Update counts
  state.totalProcessed += (withFrequency + withoutFrequency);
  state.totalWithFrequency += withFrequency;
  state.totalWithoutFrequency += withoutFrequency;
  
  // Update last processed ID if this batch went further
  if (endId > state.lastProcessedId) {
    state.lastProcessedId = endId;
  }
  
  // Add or merge this range with existing ranges
  addProcessedRange(state, startId, endId);
  
  // Save the updated state
  saveState(state);
  
  return state;
}

/**
 * Add a processed range to the state, merging with existing ranges if possible
 * @param {Object} state - The state object
 * @param {Number} startId - Start of range
 * @param {Number} endId - End of range
 */
function addProcessedRange(state, startId, endId) {
  if (!state.processedRanges) {
    state.processedRanges = [];
  }
  
  // Add new range
  const newRange = { start: startId, end: endId };
  
  // Try to merge with existing ranges
  const mergedRanges = [];
  let merged = false;
  
  for (const range of state.processedRanges) {
    // Check if ranges overlap or are adjacent
    if (
      (range.start <= newRange.end + 1 && range.end + 1 >= newRange.start) ||
      (newRange.start <= range.end + 1 && newRange.end + 1 >= range.start)
    ) {
      // Merge ranges
      newRange.start = Math.min(newRange.start, range.start);
      newRange.end = Math.max(newRange.end, range.end);
      merged = true;
    } else {
      // Keep non-overlapping range
      mergedRanges.push(range);
    }
  }
  
  // Add the new/merged range
  mergedRanges.push(newRange);
  
  // Sort ranges
  state.processedRanges = mergedRanges.sort((a, b) => a.start - b.start);
}

/**
 * Check if a word ID has already been processed
 * @param {Number} wordId - The word ID to check
 * @returns {Boolean} Whether the ID has been processed
 */
function isWordProcessed(wordId) {
  const state = loadState();
  
  if (!state.processedRanges || state.processedRanges.length === 0) {
    return false;
  }
  
  // Check if the ID falls within any processed range
  return state.processedRanges.some(range => 
    wordId >= range.start && wordId <= range.end
  );
}

/**
 * Get unprocessed ranges within a specified range
 * @param {Number} startId - Start of target range
 * @param {Number} endId - End of target range
 * @returns {Array} Array of unprocessed ranges [{start, end}]
 */
function getUnprocessedRanges(startId, endId) {
  const state = loadState();
  
  if (!state.processedRanges || state.processedRanges.length === 0) {
    // If nothing has been processed, return the entire range
    return [{ start: startId, end: endId }];
  }
  
  // Sort ranges
  const sortedRanges = [...state.processedRanges].sort((a, b) => a.start - b.start);
  
  // Find gaps in the processed ranges
  const unprocessedRanges = [];
  let currentStart = startId;
  
  for (const range of sortedRanges) {
    // If there's a gap before this range, add it
    if (currentStart < range.start) {
      unprocessedRanges.push({
        start: currentStart,
        end: Math.min(range.start - 1, endId)
      });
    }
    
    // Move current start past this range
    currentStart = Math.max(currentStart, range.end + 1);
    
    // If we've moved past the end of our target range, break
    if (currentStart > endId) {
      break;
    }
  }
  
  // If there's a gap after the last range to the end, add it
  if (currentStart <= endId) {
    unprocessedRanges.push({
      start: currentStart,
      end: endId
    });
  }
  
  return unprocessedRanges;
}

// Export functions
module.exports = {
  loadState,
  saveState,
  updateState,
  isWordProcessed,
  getUnprocessedRanges
}; 