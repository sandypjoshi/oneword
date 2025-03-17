// Import logger
const logger = require('../utils/logger');

/**
 * Parse response from Gemini API
 * @param {object} response - Fetch response object
 * @returns {Promise<object>} - Parsed JSON response
 */
async function parseResponse(response) {
  try {
    const text = await response.text();
    
    // Check if response status is not ok
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      
      // Try to parse error JSON if possible
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      } catch (e) {
        // If can't parse error JSON, use status text
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }
    
    // Handle empty response
    if (!text || text.trim() === '') {
      throw new Error('Empty response from API');
    }
    
    // Try to parse JSON with extra safety
    try {
      // Clean up response if needed (sometimes API returns extra content)
      let cleanedText = text;
      
      // Look for the proper JSON start and end
      const jsonStart = cleanedText.indexOf('{');
      const jsonEnd = cleanedText.lastIndexOf('}') + 1;
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd);
      }
      
      return JSON.parse(cleanedText);
    } catch (error) {
      logger.error(`JSON parsing error: ${error.message}`);
      logger.error(`Response text: ${text.substring(0, 200)}...`); // Log first 200 chars
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  } catch (error) {
    throw error;
  }
} 