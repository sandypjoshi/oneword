/**
 * Theme export file for the OneWord app
 * This file aggregates and exports all theme-related constants
 */

import { lightColors, darkColors } from './colors';
import typography from './typography';
import spacing from './spacing';

// Export the full theme object with all theme properties
export const theme = {
  light: {
    colors: lightColors,
    typography,
    spacing,
  },
  dark: {
    colors: darkColors,
    typography,
    spacing,
  },
};

// Default export is the full theme
export default theme;

// Named exports for individual theme modules
export { lightColors, darkColors } from './colors';
export { default as typography } from './typography';
export { default as spacing } from './spacing'; 