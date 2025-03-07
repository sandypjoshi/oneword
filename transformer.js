const { transform } = require('metro-transform-worker');

module.exports.transform = async (source, options) => {
  // Make sure source is a string
  const sourceString = typeof source === 'string' 
    ? source 
    : Buffer.isBuffer(source) 
      ? source.toString() 
      : String(source);
  
  // Add polyfill for FinalizationRegistry before transforming
  let transformedSource = sourceString;
  
  if (sourceString.indexOf('FinalizationRegistry') !== -1 && 
      sourceString.indexOf('global.FinalizationRegistry') === -1) {
    transformedSource = `
      if (typeof global.FinalizationRegistry === 'undefined') {
        global.FinalizationRegistry = class FinalizationRegistry {
          constructor(callback) {
            this.callback = callback;
          }
          register() {}
          unregister() {}
        };
      }
    ` + sourceString;
  }

  // Continue with the regular transform
  return transform(transformedSource, options);
}; 