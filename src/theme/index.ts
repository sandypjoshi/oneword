/**
 * Theme exports for the OneWord app
 */

import colors from './colors';
import spacing from './spacing';
import typography from './typography';
import { palettes, opacity } from './primitives';

// Reexport the TypographyVariant as a type
export type { TypographyVariant } from './typography';

// Define the theme type
export type Theme = {
  colors: typeof colors.default.light;
  spacing: typeof spacing;
  typography: typeof typography;
};

// Export all theme components
export { ThemeProvider, useTheme } from './ThemeProvider';
export type { ThemeContextType } from './ThemeProvider';

// Export theme tokens
export { colors, spacing, typography };

// Export color primitives
export { palettes, opacity };

// Note: ThemeProvider and useTheme are exported directly from ThemeProvider.tsx
// to avoid circular dependencies 