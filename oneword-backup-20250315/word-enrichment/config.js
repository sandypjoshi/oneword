require('dotenv').config();

// IMPORTANT: These are placeholder keys - actual keys should be stored in .env file
// and loaded through environment variables
const GEMINI_API_KEYS = process.env.GEMINI_API_KEYS ? 
  process.env.GEMINI_API_KEYS.split(',') : 
  [
    'AIzaSy****************UFvM', // Masked key 1
    'AIzaSy****************yMPs', // Masked key 2
    'AIzaSy****************GDm4', // Masked key 3
    'AIzaSy****************dHDo', // Masked key 4
    'AIzaSy****************vOb8'  // Masked key 5
  ];

// Default to the first key for backward compatibility
const GEMINI_API_KEY = GEMINI_API_KEYS[0];
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.0-flash'; // Using the latest 2.0 Flash model for better results

// Supabase configuration - Use environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbG********************************************';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbG********************************************';

// Batch processing configuration
const BATCH_SIZE = 40; // Restore safer batch size to avoid parsing errors
const WORDS_PER_API_REQUEST = 25; // Reduce max words per API request for reliability
const TEST_BATCH_LIMIT = 100; // Maximum words to process in test mode
const MAX_RETRIES = 3; // Number of retries for failed requests
const RETRY_DELAY = 5000; // Delay between retries in milliseconds (5 seconds)
const RATE_LIMIT_PAUSE = 120000; // Pause when rate limit is hit (2 minutes)
const BATCH_PROCESSING_DELAY = 1000; // Reduce from 2000ms to 1000ms

// API usage limits - Updated to match actual Gemini limits
const REQUESTS_PER_MINUTE = 16; // Increase from 13 to 16 requests per minute per key
const HOURLY_QUOTA = 900; // Increase from 750 to 900 per hour per key
const DAILY_QUOTA = 1800; // Increase from 1400 to 1800 per day per key

// Key rotation settings
const ENABLE_KEY_ROTATION = true; // Whether to rotate between multiple API keys
const KEYS_COUNT = GEMINI_API_KEYS.length; // Number of available keys

// File paths
const LOG_DIR = './word-enrichment/logs';
const TEMP_DIR = './word-enrichment/temp';

// Export all configuration
module.exports = {
  GEMINI_API_KEY,
  GEMINI_API_KEYS,
  GEMINI_API_URL,
  GEMINI_MODEL,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY,
  BATCH_SIZE,
  WORDS_PER_API_REQUEST,
  TEST_BATCH_LIMIT,
  MAX_RETRIES,
  RETRY_DELAY,
  RATE_LIMIT_PAUSE,
  BATCH_PROCESSING_DELAY,
  HOURLY_QUOTA,
  REQUESTS_PER_MINUTE,
  DAILY_QUOTA,
  ENABLE_KEY_ROTATION,
  KEYS_COUNT,
  LOG_DIR,
  TEMP_DIR
}; 