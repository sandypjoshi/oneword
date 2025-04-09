/**
 * Global polyfills and shims for React Native compatibility
 * These are loaded before any other code in the application
 */

// Symbol.toStringTag polyfill if needed
if (typeof Symbol !== 'undefined' && Symbol.toStringTag === undefined) {
  Symbol.toStringTag = Symbol('toStringTag');
}

export {};
