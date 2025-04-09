/**
 * Entry point for the OneWord application
 * Load polyfills before anything else
 */

// Load polyfills for FinalizationRegistry and WeakRef
// This must be done before importing any other modules
import './global';

// Import the main entry point for the app
import 'expo-router/entry';
