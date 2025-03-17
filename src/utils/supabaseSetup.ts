/**
 * Supabase setup utility
 * Handles initialization of required polyfills for React Native
 */

import 'react-native-url-polyfill/auto';

// This ensures the URL polyfill is loaded before any Supabase imports
export const ensurePolyfills = () => {
  // You can add additional polyfill initialization here if needed
  
  // Return true to indicate successful initialization
  return true;
};

export default ensurePolyfills; 