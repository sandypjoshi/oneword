/**
 * Supabase client configuration
 * This file sets up and exports the Supabase client for use throughout the app
 * It handles authentication, storage, and provides utilities for device identification
 * 
 * We use anonymous sessions for the MVP with device ID-based tracking
 * The client is configured to persist sessions in AsyncStorage
 */

// Polyfills must be imported first
import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase project credentials
const supabaseUrl = 'https://ipljgsggnbdwaomjfuok.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbGpnc2dnbmJkd2FvbWpmdW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwODAxMDYsImV4cCI6MjA1NjY1NjEwNn0.Tpqr0Btu0AolHltIv2qa4dLNxd7_wr3eC8NF2oLbGRI';

// Create a custom storage adapter using AsyncStorage
const AsyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

// Wrap client creation in a try-catch to prevent crashes
let supabase: any;
try {
  // Initialize the Supabase client with custom storage
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
} catch (error) {
  console.error('Supabase client initialization error:', error);
  // Provide a mock client to prevent app crashes
  supabase = {
    auth: {
      onAuthStateChange: () => ({ data: null, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    },
    // Add other API methods as needed
  };
}

/**
 * Helper function to generate a unique device ID
 * This is used for anonymous sessions tracking without requiring formal authentication
 * @returns Promise<string> A unique device identifier
 */
export const getDeviceId = async (): Promise<string> => {
  let deviceId = await AsyncStorage.getItem('@oneword_device_id');
  
  if (!deviceId) {
    // Generate a random device ID if none exists
    deviceId = `device_${Math.random().toString(36).substring(2, 15)}`;
    await AsyncStorage.setItem('@oneword_device_id', deviceId);
  }
  
  return deviceId;
};

export { supabase };
export default supabase; 