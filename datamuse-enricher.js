const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = 'https://ipljgsggnbdwaomjfuok.supabase.co';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/datamuse-enrichment`;
const REST_API_URL = `${SUPABASE_URL}/rest/v1`;
// Updated API keys
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbGpnc2dnbmJkd2FvbWpmdW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwODAxMDYsImV4cCI6MjA1NjY1NjEwNn0.Tpqr0Btu0AolHltIv2qa4dLNxd7_wr3eC8NF2oLbGRI';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbGpnc2dnbmJkd2FvbWpmdW9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTA4MDEwNiwiZXhwIjoyMDU2NjU2MTA2fQ.qkwn-imaZVnK6IGFgG75eFcFEQySgzIN_gvUJbbDFWE';
const SUPABASE_JWT = 'kldi+d+garOKZjohqVTw4dXjGHbdzAWzqapBmlii5cpaIBWwe943KeVIFjBcGR/9NRafh2O0/mSw/w0C5Pnibg==';
const BATCH_SIZE = 15; // Reduced from 30 to 15 to avoid overwhelming the edge function
const DELAY_BETWEEN_BATCHES_MS = 2000; // 2 seconds between batches
const STATE_FILE = path.join(__dirname, 'enrichment-state.json');
const LOG_FILE = path.join(__dirname, 'datamuse-enrichment.log');

// Initialize logging
const logger = {
  log: function(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] INFO: ${message}\n`;
    
    // Console output
    console.log(message);
    
    // File output
    fs.appendFileSync(LOG_FILE, logEntry);
  },
  
  error: function(message, error) {
    const timestamp = new Date().toISOString();
    let errorDetails = '';
    
    if (error) {
      if (error.response) {
        // API error with response
        errorDetails = `\n  Status: ${error.response.status}\n  Data: ${JSON.stringify(error.response.data)}`;
      } else if (error.message) {
        // Standard error object
        errorDetails = `\n  ${error.message}`;
        if (error.stack) {
          errorDetails += `\n  ${error.stack}`;
        }
      } else {
        // Unknown error format
        errorDetails = `\n  ${JSON.stringify(error)}`;
      }
    }
    
    const logEntry = `[${timestamp}] ERROR: ${message}${errorDetails}\n`;
    
    // Console output
    console.error(message, error);
    
    // File output
    fs.appendFileSync(LOG_FILE, logEntry);
  }
};

// Create a supabase REST client
const supabaseClient = {
  async updateWord(id, data) {
    try {
      logger.log(`Sending update for word ID ${id}: ${JSON.stringify(data)}`);
      
      const response = await axios.patch(`${REST_API_URL}/words?id=eq.${id}`, data, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }
      });
      
      logger.log(`Update successful for word ID ${id} with status ${response.status}`);
      return { success: true };
    } catch (error) {
      logger.log(`Error updating word ID ${id}: ${error.message}`);
      if (error.response) {
        logger.log(`Response status: ${error.response.status}`);
        logger.log(`Response data: ${JSON.stringify(error.response.data || {})}`);
        return { 
          success: false, 
          error: error.message, 
          status: error.response.status,
          details: error.response.data 
        };
      }
      return { success: false, error: error.message };
    }
  },
  
  async queryWords(queryUrl) {
    try {
      const response = await axios.get(queryUrl, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      logger.log(`Error querying words: ${error.message}`);
      if (error.response) {
        logger.log(JSON.stringify(error.response.data));
      }
      return { success: false, error: error.message, details: error.response ? error.response.data : null };
    }
  }
};

// Word filtering configuration
const WORD_FILTERS = {
  // Remove minimum word length constraint
  wordLengthMin: 1,
  wordLengthMax: 100, // Setting a very high value effectively removes the constraint
  // Only process words with these parts of speech
  validPOS: ['noun', 'verb', 'adjective', 'adverb'],
  
  // Skip words with these patterns
  skipPatterns: [
    /\d/, // Words with numbers
    /^[A-Z]{2,}$/, // Abbreviations (all caps)
    /[^a-zA-Z\s\-]/, // Special characters (except hyphens and spaces)
    /(.{2,})\1{2,}/, // Repetitive patterns 
  ],
  
  // Skip words with multiple hyphens
  maxHyphens: 1,
  
  // Skip common words in these categories (imported from wordFilters.ts)
  skipCommonWords: true,
  
  processingPriority: [
    // Process all words in ID order - simple and straightforward
    { 
      limit: null, 
      where: "ORDER BY id ASC", 
      urlFragment: "order=id.asc"
    }
  ]
};

// Define common words to skip (simplified from wordFilters.ts)
const COMMON_WORDS = new Set([
  // Articles
  'the', 'a', 'an',
  // Prepositions
  'in', 'on', 'at', 'by', 'for', 'to', 'of', 'with', 'under', 'over', 'through',
  'above', 'below', 'from', 'into', 'onto', 'upon', 'within', 'without',
  // Auxiliary verbs
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'can', 'could', 'will', 'would', 'shall', 'should',
  'may', 'might', 'must',
  // Conjunctions
  'and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'because', 'although', 'since',
  'unless', 'whether', 'while',
  // Pronouns
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which', 'what',
  // Determiners
  'each', 'every', 'either', 'neither', 'some', 'any', 'no', 'many', 'much', 'few', 'little',
  // Common adverbs
  'not', 'very', 'too', 'only', 'just', 'also', 'then', 'still', 'rather',
  // Numbers as words
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'first', 'second', 'third', 'fourth', 'fifth', 'hundred', 'thousand',
  // Basic emotions, descriptors, actions
  'happy', 'sad', 'angry', 'good', 'bad', 'nice', 'mean', 'big', 'small', 'hot', 'cold',
  'go', 'come', 'get', 'take', 'make', 'do', 'see', 'hear', 'eat', 'drink',
  // Time and place
  'now', 'then', 'today', 'tomorrow', 'yesterday', 'here', 'there', 'where',
  // Internet terms
  'lol', 'omg', 'btw', 'fyi', 'asap', 'brb', 'afk', 'ttyl', 'tbh', 'imo'
]);

// Rate limit tracking
const RATE_LIMIT = {
  dailyLimit: 100000 // Datamuse limit
};
const ESTIMATED_REQUESTS_PER_WORD = 5; // Base data + synonyms + sound-alike + related + antonyms
let dailyRequestCount = 0;
let processingStartTime = new Date().toISOString();
let lastRunTime = null;

// Tracking state
let startId = 0;
let totalProcessed = 0;
let totalSuccessful = 0;
let totalFailed = 0;
let totalSkipped = 0;
let totalMarkedEligible = 0;
let totalMarkedIneligible = 0;
let isRunning = false;

// Function to save state
const saveState = async (state) => {
  try {
    const stateToSave = {
      startId,
      totalProcessed,
      totalSuccessful,
      totalFailed,
      totalSkipped,
      totalMarkedEligible,
      totalMarkedIneligible,
      lastUpdated: new Date().toISOString(),
      dailyRequestCount,
      processingStartTime,
      lastRunTime: new Date().toISOString()
    };
    
    fs.writeFileSync(STATE_FILE, JSON.stringify(stateToSave, null, 2));
    logger.log('State saved successfully');
    return true;
  } catch (error) {
    logger.log(`Error saving state: ${error.message}`);
    return false;
  }
};

// Function to load previous state
const loadState = async () => {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      
      // Update state variables from loaded data
      startId = data.startId || 0;
      totalProcessed = data.totalProcessed || 0;
      totalSuccessful = data.totalSuccessful || 0;
      totalFailed = data.totalFailed || 0;
      totalSkipped = data.totalSkipped || 0;
      totalMarkedEligible = data.totalMarkedEligible || 0;
      totalMarkedIneligible = data.totalMarkedIneligible || 0;
      dailyRequestCount = data.dailyRequestCount || 0;
      processingStartTime = data.processingStartTime || new Date().toISOString();
      lastRunTime = data.lastRunTime;
      
      logger.log(`Loaded state from ${STATE_FILE}:`);
      logger.log(`  Last processed ID: ${startId}`);
      logger.log(`  Words processed: ${totalProcessed}`);
      logger.log(`  Successful: ${totalSuccessful}, Failed: ${totalFailed}, Skipped: ${totalSkipped}`);
      logger.log(`  Marked eligible: ${totalMarkedEligible}, Marked ineligible: ${totalMarkedIneligible}`);
      
      return true;
    }
  } catch (error) {
    logger.log(`Error loading state: ${error.message}`);
  }
  
  return false;
};

// Check if we're approaching the daily limit
const checkRateLimit = () => {
  const estimatedRequests = dailyRequestCount + (BATCH_SIZE * ESTIMATED_REQUESTS_PER_WORD);
  if (estimatedRequests >= RATE_LIMIT.dailyLimit) {
    logger.log(`⚠️ WARNING: Approaching daily limit of ${RATE_LIMIT.dailyLimit} requests.`);
    logger.log(`Current count: ${dailyRequestCount}, estimated after next batch: ${estimatedRequests}`);
    logger.log('Stopping to avoid hitting rate limit. Please try again tomorrow.');
    return false;
  }
  return true;
};

// Check if a word should be processed
const shouldProcessWord = async (wordObj) => {
  // If we've already checked this word, respect the stored status but with original reason
  if (wordObj.enrichment_eligible === 'eligible-word') {
    return { process: true, eligible: 'eligible-word', alreadyMarked: true };
  }
  
  if (wordObj.enrichment_eligible === 'eligible-phrase') {
    // We don't process phrases with the API, but they're eligible for the app
    return { 
      process: false, 
      eligible: 'eligible-phrase', 
      reason: 'Phrase (not processed with API)', 
      alreadyMarked: true 
    };
  }
  
  if (wordObj.enrichment_eligible === 'ineligible' || wordObj.enrichment_eligible === 'false') {
    // Use the original reason if available
    return { 
      process: false, 
      eligible: 'ineligible', 
      reason: wordObj.enrichment_ineligible_reason || 'Ineligible word', 
      alreadyMarked: true 
    };
  }
  
  // Continue with regular checks for words we haven't processed yet...
  const word = wordObj.word;
  const pos = wordObj.pos;
  
  // Check for phrases (words with spaces)
  if (word && word.includes(' ')) {
    // This is a phrase - check if it meets all other criteria
    // For now, we'll just mark it as eligible-phrase but not process through API
    return { 
      process: false, 
      eligible: 'eligible-phrase', 
      reason: 'Phrase (not processed with API)' 
    };
  }
  
  // Skip words that are too short
  if (!word || word.length < WORD_FILTERS.wordLengthMin) {
    return { process: false, eligible: 'ineligible', reason: 'Word too short' };
  }
  
  // Skip words with invalid parts of speech
  if (!pos || !WORD_FILTERS.validPOS.includes(pos.toLowerCase())) {
    return { process: false, eligible: 'ineligible', reason: 'Invalid part of speech' };
  }
  
  // Check all regex skip patterns
  for (const pattern of WORD_FILTERS.skipPatterns) {
    if (pattern.test(word)) {
      return { 
        process: false, 
        eligible: 'ineligible', 
        reason: `Matched skip pattern: ${pattern}` 
      };
    }
  }
  
  // Check for contractions with apostrophes
  if (word.includes("'")) {
    return { process: false, eligible: 'ineligible', reason: 'Contains contraction or apostrophe' };
  }
  
  // Check for hyphenation limits
  if (word.includes('-')) {
    const hyphenCount = (word.match(/-/g) || []).length;
    if (hyphenCount > WORD_FILTERS.maxHyphens) {
      return { process: false, eligible: 'ineligible', reason: 'Too many hyphens' };
    }
    
    // Check if hyphen parts are too short
    const parts = word.split('-');
    if (parts.some(part => part.length < 2)) {
      return { process: false, eligible: 'ineligible', reason: 'Hyphenated with very short components' };
    }
  }
  
  // Check if it's a common word to skip
  if (WORD_FILTERS.skipCommonWords && COMMON_WORDS.has(word.toLowerCase())) {
    return { process: false, eligible: 'ineligible', reason: 'Common/basic word' };
  }
  
  // All checks passed, word is eligible for processing
  return { process: true, eligible: 'eligible-word' };
};

// Update eligibility status for words in the database
const updateEligibility = async (wordIds, eligibilityData) => {
  if (!wordIds || wordIds.length === 0) return;
  
  try {
    for (const id of wordIds) {
      // Ensure eligible status is TEXT format
      const updateData = {
        enrichment_eligible: eligibilityData.eligible,
        updated_at: new Date().toISOString()
      };
      
      if (eligibilityData.eligible === 'ineligible' && eligibilityData.reason) {
        updateData.enrichment_ineligible_reason = eligibilityData.reason;
      } else {
        // Clear any previous ineligibility reason for eligible words
        updateData.enrichment_ineligible_reason = null;
      }
      
      logger.log(`Updating word ID ${id} with data: ${JSON.stringify(updateData)}`);
      
      const result = await supabaseClient.updateWord(id, updateData);
      if (!result.success) {
        logger.log(`Error updating word ID ${id}: ${result.error}`);
        if (result.details) {
          logger.log(`Error details: ${JSON.stringify(result.details)}`);
        }
      } else {
        logger.log(`Update successful for word ID ${id}`);
      }
    }
    
    return true;
  } catch (error) {
    logger.log(`Error updating eligibility status: ${error.message}`);
    if (error.response) {
      logger.log(`Response status: ${error.response.status}`);
      logger.log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
};

// Helper function to call the edge function
const callEdgeFunction = async (wordIds) => {
  // Implement retry logic
  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 60000; // Reduce timeout to 60 seconds
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.log(`Calling edge function, attempt ${attempt}/${MAX_RETRIES}`);
      
      const response = await axios.post(EDGE_FUNCTION_URL, {
        wordIds: wordIds
      }, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json'
        },
        timeout: TIMEOUT_MS
      });
      
      // Update our estimate of API requests made
      if (response.data && response.data.processed) {
        dailyRequestCount += (response.data.processed * ESTIMATED_REQUESTS_PER_WORD);
        logger.log(`Estimated API requests so far today: ${dailyRequestCount} of ${RATE_LIMIT.dailyLimit}`);
        logger.log(`Edge function response: ${JSON.stringify(response.data)}`);
      }
      
      return response.data;
    } catch (error) {
      // Log detailed information about the error
      let errorMsg = `Edge function call failed (attempt ${attempt}/${MAX_RETRIES})`;
      if (error.response) {
        errorMsg += `: Status ${error.response.status}`;
        if (error.response.data) {
          errorMsg += ` - ${JSON.stringify(error.response.data)}`;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMsg += `: Request timed out after ${TIMEOUT_MS}ms`;
      } else if (error.message) {
        errorMsg += `: ${error.message}`;
      }
      
      logger.log(errorMsg);
      
      // If this was the last retry, throw the error
      if (attempt === MAX_RETRIES) {
        throw new Error(errorMsg);
      }
      
      // Otherwise wait before retrying
      const retryDelay = 3000 * attempt; // Increasing delay with each retry
      logger.log(`Waiting ${retryDelay}ms before retry ${attempt + 1}...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

// Process a single batch
const processBatch = async (startId, batchSize) => {
  try {
    // Get the configuration for processing words in ID order
    const priorityConfig = WORD_FILTERS.processingPriority[0];
    
    logger.log(`Processing batch starting from ID ${startId}...`);
    
    if (!checkRateLimit()) {
      return { processed: 0, message: "Stopped due to approaching daily limit" };
    }
    
    // Get a batch of candidate words from Supabase in ID order
    const supabaseUrl = `${SUPABASE_URL}/rest/v1/words?select=id,word,pos,difficulty_level,frequency,enrichment_eligible,enrichment_ineligible_reason`;
    
    // Simple query URL with just ID ordering
    let queryUrl = `${supabaseUrl}&${priorityConfig.urlFragment}`;
    if (startId > 0) {
      queryUrl += `&id=gt.${startId}`;
    }
    queryUrl += `&limit=${batchSize}`;
    
    logger.log(`Querying database: ${queryUrl}`);
    const result = await supabaseClient.queryWords(queryUrl);
    
    if (!result.success) {
      throw new Error(`Database query failed: ${result.error}`);
    }
    
    const wordCandidates = result.data;
    
    if (!wordCandidates || wordCandidates.length === 0) {
      logger.log(`No more words to process.`);
      return { processed: 0, message: "Completed all words" };
    }
    
    // Log what we found for debugging
    logger.log(`Found ${wordCandidates.length} candidate words, filtering...`);
    
    // Filter candidates for those that are eligible for processing
    const eligibleCandidates = [];
    const skippedCandidates = [];
    
    // Process each word to determine eligibility
    for (const word of wordCandidates) {
      const eligibilityResult = await shouldProcessWord(word);
      
      // Skip words that are already marked
      if (eligibilityResult.alreadyMarked) {
        logger.log(`Skipping word ID ${word.id} - already marked as ${eligibilityResult.eligible}`);
        
        // Count already-marked words in our totals
        if (eligibilityResult.eligible === 'eligible-word') {
          eligibleCandidates.push(word);
        } else if (eligibilityResult.eligible === 'eligible-phrase') {
          totalSkipped++;
        } else {
          totalSkipped++;
        }
        continue;
      }
      
      // Only process eligible single words with the API
      if (eligibilityResult.process && eligibilityResult.eligible === 'eligible-word') {
        eligibleCandidates.push(word);
        try {
          const updateResult = await updateEligibility([word.id], { eligible: 'eligible-word' });
          if (updateResult) {
            logger.log(`Successfully marked word ID ${word.id} as eligible-word (will process via API)`);
          } else {
            logger.log(`Failed to mark word ID ${word.id} as eligible-word`);
          }
          totalMarkedEligible++;
        } catch (error) {
          logger.log(`Exception marking word ID ${word.id} as eligible-word: ${error.message}`);
        }
      } else if (eligibilityResult.eligible === 'eligible-phrase') {
        // Mark phrases as eligible-phrase but don't process with API
        try {
          const updateResult = await updateEligibility([word.id], { 
            eligible: 'eligible-phrase', 
            reason: 'Phrase (not processed with API)' 
          });
          if (updateResult) {
            logger.log(`Successfully marked word ID ${word.id} as eligible-phrase`);
          } else {
            logger.log(`Failed to mark word ID ${word.id} as eligible-phrase`);
          }
          totalMarkedEligible++;
          totalSkipped++;
        } catch (error) {
          logger.log(`Exception marking word ID ${word.id} as eligible-phrase: ${error.message}`);
        }
      } else {
        // Handle ineligible words
        try {
          const updateResult = await updateEligibility([word.id], { 
            eligible: 'ineligible', 
            reason: eligibilityResult.reason 
          });
          if (updateResult) {
            logger.log(`Successfully marked word ID ${word.id} as ineligible: ${eligibilityResult.reason}`);
          } else {
            logger.log(`Failed to mark word ID ${word.id} as ineligible`);
          }
          totalMarkedIneligible++;
          totalSkipped++;
        } catch (error) {
          logger.log(`Exception marking word ID ${word.id} as ineligible: ${error.message}`);
        }
      }
    }
    
    logger.log(`Filtering results: ${eligibleCandidates.length} words meet criteria, ${skippedCandidates.length} skipped`);
    
    // Process eligible words with Datamuse
    let enrichedCount = 0;
    if (eligibleCandidates.length > 0) {
      const MAX_WORDS_PER_CALL = 10; // Limit number of words per API call to prevent timeouts
      
      // Split into smaller batches if needed
      const batches = [];
      for (let i = 0; i < eligibleCandidates.length; i += MAX_WORDS_PER_CALL) {
        batches.push(eligibleCandidates.slice(i, i + MAX_WORDS_PER_CALL));
      }
      
      logger.log(`Split ${eligibleCandidates.length} eligible words into ${batches.length} batches of max ${MAX_WORDS_PER_CALL} words each`);
      
      // Process each batch
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const wordIdsToProcess = batch.map(w => w.id);
        
        logger.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${wordIdsToProcess.length} words...`);
        
        try {
          const enrichResult = await callEdgeFunction(wordIdsToProcess);
          
          if (enrichResult.successful > 0) {
            enrichedCount += enrichResult.successful;
            totalSuccessful += enrichResult.successful;
            logger.log(`Successfully enriched ${enrichResult.successful} words in batch ${batchIndex + 1}`);
          }
          
          if (enrichResult.failed > 0) {
            totalFailed += enrichResult.failed;
            logger.log(`Failed to enrich ${enrichResult.failed} words in batch ${batchIndex + 1}`);
          }
          
          // Make sure we update IDs appropriately based on the response
          if (enrichResult.lastProcessedId && enrichResult.lastProcessedId > startId) {
            startId = enrichResult.lastProcessedId;
            logger.log(`Updated startId to ${startId} based on lastProcessedId`);
          } else if (enrichResult.nextStartId && enrichResult.nextStartId > startId) {
            startId = enrichResult.nextStartId;
            logger.log(`Updated startId to ${startId} based on nextStartId`);
          }
          
          // Small delay between batches to prevent overwhelming the edge function
          if (batchIndex < batches.length - 1) {
            logger.log(`Waiting 3 seconds before processing next batch...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } catch (error) {
          // Log and continue processing - we'll retry in the next batch
          logger.log(`Error processing batch ${batchIndex + 1}: ${error.message}`);
          totalFailed += batch.length;
          
          // Wait slightly longer after an error
          if (batchIndex < batches.length - 1) {
            logger.log(`Waiting 5 seconds after error before processing next batch...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }
      
      // After all batches, update startId to the maximum ID from eligible candidates if not already higher
      const maxId = Math.max(...eligibleCandidates.map(w => w.id));
      if (maxId > startId) {
        startId = maxId;
        logger.log(`Updated startId to ${startId} after processing all batches`);
      }
    } else {
      // Even if no eligible words, update startId
      startId = Math.max(...wordCandidates.map(w => w.id));
      logger.log(`Updated startId to ${startId} (no eligible words)`);
    }
    
    // Total words processed in this batch
    const totalInBatch = eligibleCandidates.length + skippedCandidates.length;
    totalProcessed += totalInBatch;
    
    // Update state
    await saveState({
      startId,
      totalProcessed,
      totalSuccessful,
      totalFailed,
      totalSkipped,
      totalMarkedEligible,
      totalMarkedIneligible
    });
    
    return { processed: totalInBatch, enriched: enrichedCount, maxId: startId, message: "Batch processed successfully" };
  } catch (error) {
    logger.log(`Error processing batch: ${error.message}`);
    return { processed: 0, error: error.message, message: "Error processing batch" };
  }
};

// Create a new empty state file to start from the beginning
const createNewStateFile = () => {
  const initialState = {
    startId: 0,
    totalProcessed: 0,
    totalSuccessful: 0,
    totalFailed: 0,
    totalSkipped: 0,
    totalMarkedEligible: 0,
    totalMarkedIneligible: 0,
    lastUpdated: new Date().toISOString(),
    dailyRequestCount: 0,
    processingStartTime: new Date().toISOString(),
    lastRunTime: new Date().toISOString()
  };
  
  fs.writeFileSync(STATE_FILE, JSON.stringify(initialState, null, 2));
  logger.log(`Created new state file: ${STATE_FILE}`);
  logger.log(`Starting from ID: 0`);
  
  return initialState;
};

// Update main processWords function to load existing state file
const processWords = async () => {
  // Start logging
  logger.log('Starting Datamuse enrichment process with smart filtering and eligibility tracking...');
  logger.log(`Using ${BATCH_SIZE} words per batch with ${DELAY_BETWEEN_BATCHES_MS/1000}s delay between batches`);
  logger.log(`Processing words in ${WORD_FILTERS.processingPriority.length} priority groups`);
  logger.log(`Daily API request limit: ${RATE_LIMIT.dailyLimit}`);
  logger.log(`Eligibility categories: 'eligible-word' (processed with API), 'eligible-phrase' (not processed), 'ineligible'`);
  
  // Try to load existing state to resume from where we left off
  let stateLoaded = false;
  try {
    if (fs.existsSync(STATE_FILE)) {
      logger.log(`Found existing state file: ${STATE_FILE}`);
      stateLoaded = await loadState();
      if (stateLoaded) {
        logger.log(`Resuming processing from ID ${startId}`);
      }
    }
  } catch (error) {
    logger.log(`Error loading state file: ${error.message}`);
  }
  
  // Create a new state file if loading failed
  if (!stateLoaded) {
    logger.log('No valid state file found. Starting from the beginning (ID 0)');
    const initialState = createNewStateFile();
    
    // Set initial state variables
    startId = initialState.startId;
    totalProcessed = initialState.totalProcessed;
    totalSuccessful = initialState.totalSuccessful;
    totalFailed = initialState.totalFailed;
    totalSkipped = initialState.totalSkipped;
    totalMarkedEligible = initialState.totalMarkedEligible;
    totalMarkedIneligible = initialState.totalMarkedIneligible;
    dailyRequestCount = initialState.dailyRequestCount;
    processingStartTime = initialState.processingStartTime;
    lastRunTime = initialState.lastRunTime;
  }
  
  logger.log(`Starting processing from ID ${startId}`);
  logger.log(`Using API Keys - Anon: ${SUPABASE_ANON_KEY.substring(0, 15)}... Service: ${SUPABASE_SERVICE_KEY.substring(0, 15)}...`);
  
  // Main processing loop
  let continueProcessing = true;
  let consecutiveEmptyBatches = 0;
  let lastBatchSize = 0;
  
  while (continueProcessing) {
    try {
      // Check if we're approaching the limit before processing
      if (!checkRateLimit()) {
        logger.log('Approaching daily API rate limit. Stopping for today.');
        break;
      }
      
      // Process a batch
      const result = await processBatch(startId, BATCH_SIZE);
      
      if (result.processed > 0) {
        logger.log(`Batch complete: Processed ${result.processed} words total (${result.enriched || 0} enriched with Datamuse)`);
        // Update the startId with the highest ID we processed
        startId = result.maxId;
        consecutiveEmptyBatches = 0;
        lastBatchSize = result.processed;
      } else {
        consecutiveEmptyBatches++;
        logger.log(`No words processed in this batch. Empty batch count: ${consecutiveEmptyBatches}`);
        
        // Stop after 3 consecutive empty batches
        if (consecutiveEmptyBatches >= 3) {
          logger.log('Reached 3 consecutive empty batches. Stopping.');
          continueProcessing = false;
          break;
        }
      }
      
      // Save state after processing the batch
      await saveState({
        startId,
        totalProcessed,
        totalSuccessful, 
        totalFailed,
        totalSkipped,
        totalMarkedEligible,
        totalMarkedIneligible
      });
      
      // Add a delay between batches to avoid rate limiting
      logger.log(`Waiting ${DELAY_BETWEEN_BATCHES_MS/1000} seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
    } catch (error) {
      logger.log(`Error in processing loop: ${error.message}`);
      await saveState({ startId });
      logger.log(`Waiting 10 seconds after error before retrying...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  // Add footer to log file
  const footerLine = `\n\n===== DATAMUSE ENRICHMENT COMPLETED: ${new Date().toISOString()} =====\n\n`;
  fs.appendFileSync(LOG_FILE, footerLine);
  
  logger.log('Processing complete!');
  logger.log(`Final stats: ${totalProcessed} processed, ${totalSuccessful} successful, ${totalFailed} failed, ${totalSkipped} skipped`);
  logger.log(`Eligibility tracking: ${totalMarkedEligible} marked eligible, ${totalMarkedIneligible} marked ineligible`);
  logger.log(`Estimated Datamuse API requests made: ${dailyRequestCount}`);
  
  return { processed: totalProcessed, successful: totalSuccessful, failed: totalFailed, skipped: totalSkipped };
};

// Start processing
processWords().then(() => {
  logger.log('Processing complete or stopped');
}).catch(err => {
  logger.error('Unhandled error:', err);
}); 