// Polyfill for FinalizationRegistry - adding this before any imports
if (typeof global !== 'undefined') {
  if (typeof global.FinalizationRegistry === 'undefined') {
    global.FinalizationRegistry = class {
      constructor() {}
      register() {}
      unregister() {}
    };
  }
}

// Import the entry point
import 'expo-router/entry'; 