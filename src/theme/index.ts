/**
 * Theme exports for the OneWord app
 */

import colors from './colors';
import spacing from './spacing';
import typography from './typography';

export type Theme = {
  colors: typeof colors.light | typeof colors.dark;
  spacing: typeof spacing;
  typography: typeof typography;
};

export { colors, spacing, typography };

// Note: ThemeProvider and useTheme are exported directly from ThemeProvider.tsx
// to avoid circular dependencies 