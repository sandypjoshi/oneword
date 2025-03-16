const axios = require('axios');
const config = require('./config');
const logger = require('./utils/logger');

class GeminiClient {
  constructor(apiKey = null, model = config.GEMINI_MODEL) {
    // Use provided API key or initialize with the first key
    this.apiKey = apiKey || config.GEMINI_API_KEY;
    this.model = model;
    this.baseUrl = config.GEMINI_API_URL;
    
    // Key rotation properties
    this.enableKeyRotation = config.ENABLE_KEY_ROTATION;
    this.apiKeys = config.GEMINI_API_KEYS;
    this.currentKeyIndex = 0;
    
    // Rate limiting properties - track per key
    this.keyStats = {};
    this.initializeKeyStats();
    
    // General tracking
    this.totalRequests = 0;
    this.hourlyResetTimer = null;
    this.dailyResetTimer = null;

    // Start reset timers
    this._startTimers();
  }
  
  /**
   * Initialize statistics tracking for each API key
   */
  initializeKeyStats() {
    config.GEMINI_API_KEYS.forEach(key => {
      this.keyStats[key] = {
        lastRequestTime: 0,
        rateLimitHit: false,
        requestCount: 0,
        hourlyCount: 0,
        dailyCount: 0
      };
    });
  }

  /**
   * Generate content using Gemini API
   * @param {string} prompt - The text prompt to send to Gemini
   * @param {number} temperature - Temperature for generation (0.0 to 1.0)
   * @param {number} maxTokens - Maximum tokens to generate
   * @returns {Promise<object>} - Response from Gemini API
   */
  async generateContent(prompt, temperature = 0.7, maxTokens = 1024) {
    // Select best API key with key rotation if enabled
    if (this.enableKeyRotation) {
      this.apiKey = this._selectBestApiKey();
    }
    
    // Add rate limiting to prevent exceeding free tier limits
    await this._enforceRateLimit(this.apiKey);
    
    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    
    try {
      const response = await axios.post(url, {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          topP: 0.95,
          topK: 40
        }
      });
      
      // Update stats for this key
      const keyStats = this.keyStats[this.apiKey];
      keyStats.lastRequestTime = Date.now();
      keyStats.rateLimitHit = false;
      keyStats.requestCount++;
      keyStats.hourlyCount++;
      keyStats.dailyCount++;
      
      // Update total requests
      this.totalRequests++;
      
      // Gradually decrease request count for this key
      setTimeout(() => {
        keyStats.requestCount = Math.max(0, keyStats.requestCount - 1);
      }, 10000);
      
      logger.info(`API Request successful using key ${this._maskApiKey(this.apiKey)}. Total requests: ${this.totalRequests}`);
      
      // Extract the generated text from the response
      return this._extractGeneratedText(response.data);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        // Mark this key as rate limited
        this.keyStats[this.apiKey].rateLimitHit = true;
        logger.error(`Rate limit exceeded for key ${this._maskApiKey(this.apiKey)}. Status: 429. Switching keys.`);
        
        // If we're rotating keys, try again with a different key
        if (this.enableKeyRotation && this.apiKeys.length > 1) {
          logger.info(`Retrying with a different API key...`);
          // Force selection of a different key next time
          const currentKey = this.apiKey;
          this.apiKey = this._selectBestApiKey(currentKey);
          return this.generateContent(prompt, temperature, maxTokens);
        } else {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      }
      
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }
  
  /**
   * Generate content for multiple words in a single batch to maximize efficiency
   * This should be used when generating the same type of content for multiple words
   * @param {Array} words - Array of word objects
   * @param {Function} promptBuilder - Function that builds a prompt for the given words
   * @param {number} temperature - Temperature for generation
   * @param {number} maxTokens - Maximum tokens to generate
   * @returns {Promise<string>} - Generated content
   */
  async generateBatchContent(words, promptBuilder, temperature = 0.7, maxTokens = 2048) {
    // Build the prompt for all words
    const prompt = promptBuilder(words);
    
    // Generate content
    return this.generateContent(prompt, temperature, maxTokens);
  }
  
  /**
   * Start the hourly and daily reset timers
   * @private
   */
  _startTimers() {
    // Clear any existing timers
    if (this.hourlyResetTimer) {
      clearInterval(this.hourlyResetTimer);
    }
    
    if (this.dailyResetTimer) {
      clearInterval(this.dailyResetTimer);
    }
    
    // Reset hourly counts every hour
    this.hourlyResetTimer = setInterval(() => {
      Object.keys(this.keyStats).forEach(key => {
        const previousCount = this.keyStats[key].hourlyCount;
        this.keyStats[key].hourlyCount = 0;
        logger.info(`Hourly quota reset for key ${this._maskApiKey(key)}. Previous hour used: ${previousCount}/${config.HOURLY_QUOTA} requests`);
      });
    }, 3600000); // 1 hour
    
    // Reset daily counts every 24 hours
    this.dailyResetTimer = setInterval(() => {
      Object.keys(this.keyStats).forEach(key => {
        const previousCount = this.keyStats[key].dailyCount;
        this.keyStats[key].dailyCount = 0;
        logger.info(`Daily quota reset for key ${this._maskApiKey(key)}. Previous day used: ${previousCount}/${config.DAILY_QUOTA} requests`);
      });
    }, 86400000); // 24 hours
  }
  
  /**
   * Extract generated text from Gemini API response
   * @param {object} responseData - Raw response data from Gemini API
   * @returns {string} - Extracted text
   */
  _extractGeneratedText(responseData) {
    try {
      if (responseData.candidates && 
          responseData.candidates[0] && 
          responseData.candidates[0].content && 
          responseData.candidates[0].content.parts && 
          responseData.candidates[0].content.parts[0] &&
          responseData.candidates[0].content.parts[0].text) {
        return responseData.candidates[0].content.parts[0].text;
      }
      
      throw new Error('Unexpected response structure from Gemini API');
    } catch (error) {
      throw new Error(`Failed to extract generated text: ${error.message}`);
    }
  }
  
  /**
   * Parse JSON from generated text
   * @param {string} text - Text containing JSON
   * @returns {object|array} - Parsed JSON
   */
  parseJsonFromText(text) {
    try {
      // Find JSON in the text (between [ and ] or { and })
      const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      
      if (jsonMatch && jsonMatch[0]) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('No valid JSON found in the response');
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }
  
  /**
   * Select the best API key to use for the next request
   * Prioritizes keys that haven't hit rate limits and have the lowest request counts
   * @param {string} keyToAvoid - Optional key to avoid using (e.g., after a rate limit)
   * @returns {string} - Selected API key
   * @private
   */
  _selectBestApiKey(keyToAvoid = null) {
    // If only one key is available, return it
    if (this.apiKeys.length === 1) {
      return this.apiKeys[0];
    }
    
    // Create array of keys with their stats for sorting
    const keyScores = this.apiKeys
      .filter(key => key !== keyToAvoid) // Skip the key to avoid if specified
      .map(key => {
        const stats = this.keyStats[key];
        
        // Calculate a score for this key (lower is better)
        // Heavily penalize keys that hit rate limits
        const rateLimitPenalty = stats.rateLimitHit ? 1000 : 0;
        
        // Penalize keys that are close to rate limits
        const requestsPenalty = stats.requestCount * 10;
        const hourlyPenalty = (stats.hourlyCount / config.HOURLY_QUOTA) * 100;
        const dailyPenalty = (stats.dailyCount / config.DAILY_QUOTA) * 100;
        
        // Calculate time since last request (higher is better)
        const timeSinceLastRequest = Date.now() - stats.lastRequestTime;
        const timeBonus = Math.min(timeSinceLastRequest / 1000, 60); // Cap at 60 seconds
        
        // Calculate final score (lower is better)
        const score = rateLimitPenalty + requestsPenalty + hourlyPenalty + dailyPenalty - timeBonus;
        
        return { key, score };
      });
    
    // Sort by score (lower is better)
    keyScores.sort((a, b) => a.score - b.score);
    
    // If all keys are rate limited, reset the least-recently used one
    if (keyScores.length > 0 && keyScores[0].score > 1000) {
      const leastRecentlyUsedKey = this.apiKeys
        .filter(key => key !== keyToAvoid)
        .sort((a, b) => this.keyStats[a].lastRequestTime - this.keyStats[b].lastRequestTime)[0];
      
      // Reset rate limit status for this key
      this.keyStats[leastRecentlyUsedKey].rateLimitHit = false;
      logger.info(`All keys were rate limited. Resetting status for key ${this._maskApiKey(leastRecentlyUsedKey)}.`);
      return leastRecentlyUsedKey;
    }
    
    // Return the key with the lowest score
    return keyScores.length > 0 ? keyScores[0].key : this.apiKeys[0];
  }
  
  /**
   * Mask API key for logging purposes
   * @param {string} key - API key to mask
   * @returns {string} - Masked API key
   * @private
   */
  _maskApiKey(key) {
    if (!key) return 'unknown';
    return key.substring(0, 6) + '...' + key.substring(key.length - 4);
  }
  
  /**
   * Enforce rate limiting to stay within free tier limits
   * @param {string} key - API key to check
   * @returns {Promise<void>}
   * @private
   */
  async _enforceRateLimit(key) {
    if (!this.keyStats[key]) {
      // Initialize stats for this key if not already done
      this.keyStats[key] = {
        lastRequestTime: 0,
        rateLimitHit: false,
        requestCount: 0,
        hourlyCount: 0,
        dailyCount: 0
      };
    }
    
    const stats = this.keyStats[key];
    const now = Date.now();
    const elapsedSinceLastRequest = now - stats.lastRequestTime;
    
    // If we've hit a rate limit before, wait longer
    if (stats.rateLimitHit) {
      const waitTime = config.RATE_LIMIT_PAUSE;
      logger.warn(`Rate limit was hit previously for key ${this._maskApiKey(key)}. Waiting ${waitTime/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      stats.rateLimitHit = false; // Reset after waiting
      stats.requestCount = 0; // Reset the counter after waiting
      return;
    }
    
    // If we're approaching the daily limit (>80%), add substantial delay
    if (stats.dailyCount >= config.DAILY_QUOTA * 0.8) {
      const waitTime = 300000; // 5 minutes
      logger.warn(`Approaching daily quota for key ${this._maskApiKey(key)} (${stats.dailyCount}/${config.DAILY_QUOTA}). Adding delay of ${waitTime/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    // Otherwise if we're approaching the hourly limit (>80%), add substantial delay
    else if (stats.hourlyCount >= config.HOURLY_QUOTA * 0.8) {
      const waitTime = 60000; // 1 minute
      logger.warn(`Approaching hourly quota for key ${this._maskApiKey(key)} (${stats.hourlyCount}/${config.HOURLY_QUOTA}). Adding delay of ${waitTime/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    // Otherwise if we're approaching the rate limit (>80%), add a longer delay
    else if (stats.requestCount >= config.REQUESTS_PER_MINUTE * 0.8) {
      const waitTime = 5000; // 5 seconds
      logger.warn(`Approaching rate limit for key ${this._maskApiKey(key)} (${stats.requestCount}/${config.REQUESTS_PER_MINUTE}). Adding delay of ${waitTime/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Always add at least a small delay between requests from the same key
    if (elapsedSinceLastRequest < 1000) {
      const waitTime = 1000 - elapsedSinceLastRequest; // Target minimum 1 second between requests
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

module.exports = GeminiClient; 