/**
 * App-wide constants
 */

// App information
export const APP_NAME = 'OneWord';
export const APP_VERSION = '1.0.0';

// API endpoints and keys
export const API_BASE_URL = 'https://api.example.com';

// Feature flags
export const FEATURES = {
  ENABLE_NOTIFICATIONS: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_DARK_MODE: true,
};

// Navigation routes
export const ROUTES = {
  HOME: '/(tabs)',
  PRACTICE: '/(tabs)/practice',
  PROFILE: '/(tabs)/profile',
  ONBOARDING: '/onboarding',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
};

// Storage keys
export const STORAGE_KEYS = {
  USER_TOKEN: '@oneword_user_token',
  USER_PREFERENCES: '@oneword_user_preferences',
  DEVICE_ID: '@oneword_device_id',
  DIFFICULTY_LEVEL: '@oneword_difficulty_level',
};

// Difficulty levels
export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  ALL: 'all',
};

// Difficulty level descriptions
export const DIFFICULTY_DESCRIPTIONS = {
  [DIFFICULTY_LEVELS.BEGINNER]: 'Common everyday words that form the foundation of English vocabulary. Perfect for those building confidence with the language.',
  [DIFFICULTY_LEVELS.INTERMEDIATE]: 'Expand your vocabulary with moderately challenging words used in professional settings, literature, and educated conversation.',
  [DIFFICULTY_LEVELS.ADVANCED]: 'Sophisticated vocabulary for academic, literary, and specialized contexts. Challenge yourself with nuanced and precise language.',
  [DIFFICULTY_LEVELS.ALL]: 'Full range of vocabulary from basic to advanced, offering a comprehensive learning experience.',
}; 