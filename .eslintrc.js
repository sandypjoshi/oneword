module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'react-native',
    'prettier',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
    'prettier', // Uses eslint-config-prettier to disable ESLint rules that would conflict with prettier
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect', // Automatically detect the React version
    },
  },
  env: {
    browser: true,
    node: true,
    es6: true,
    'react-native/react-native': true,
  },
  rules: {
    'prettier/prettier': 'warn', // Show Prettier errors as warnings
    'react/prop-types': 'off', // Disable prop-types as we use TypeScript for type checking
    'react/react-in-jsx-scope': 'off', // No need to import React when using React 17+ JSX transform
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Allows inferring return types
    'react-native/no-raw-text': ['warn', { skip: ['CustomText', 'Text'] }], // Allow raw text only inside custom Text components
    'react-native/no-inline-styles': 'warn', // Warn about inline styles
    // Add any project-specific rule overrides here
  },
};
