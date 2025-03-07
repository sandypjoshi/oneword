// Polyfill for FinalizationRegistry
if (typeof global.FinalizationRegistry === 'undefined') {
  global.FinalizationRegistry = class FinalizationRegistry {
    constructor(callback) {
      this.callback = callback;
    }
    register() {}
    unregister() {}
  };
}

export {}; 