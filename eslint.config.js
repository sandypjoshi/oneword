// eslint.config.js
const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const reactNativePlugin = require('eslint-plugin-react-native');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'android/**',
      'ios/**',
      '.expo/**',
      'web-build/**',
      '*.lock',
      '*.log',
      '.DS_Store',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Common Browser Globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Common Node.js Globals
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        // ESNext Globals (adjust as needed)
        Promise: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        Symbol: 'readonly',
        // React Native specific (often injected by plugin, but can add explicitly if needed)
        // e.g., __DEV__: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-native': reactNativePlugin,
      prettier: prettierPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Base ESLint recommended rules (using the new import)
      ...js.configs.recommended.rules,
      // TypeScript recommended rules
      ...tseslint.configs.recommended.rules,
      // React recommended rules
      ...reactPlugin.configs.recommended.rules,
      // React Hooks recommended rules
      ...reactHooksPlugin.configs.recommended.rules,
      // React Native recommended rules (using 'all' might be too strict, adjust as needed)
      ...reactNativePlugin.configs.all.rules,
      // Prettier recommended rules (disables conflicting rules)
      ...prettierConfig.rules, // Apply eslint-config-prettier
      ...prettierPlugin.configs.recommended.rules, // Apply eslint-plugin-prettier

      // Custom Overrides
      'prettier/prettier': 'warn',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'react-native/no-raw-text': ['warn', { skip: ['CustomText', 'Text'] }],
      'react-native/no-inline-styles': 'warn',
      // Add any other project-specific rule overrides here
      // Consider disabling or adjusting very strict rules from 'react-native/all' if needed
      'react-native/sort-styles': 'off', // Often subjective
      'react-native/split-platform-components': 'off', // Can be overly restrictive
    },
  },
];
