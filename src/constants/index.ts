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
}; 