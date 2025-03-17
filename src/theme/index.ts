/**
 * Theme exports for the OneWord app
 */

import themes from './colors';
import spacing from './spacing';
import typography from './typography';

export type Theme = {
  colors: typeof themes.default.light | typeof themes.default.dark;
  spacing: typeof spacing;
  typography: typeof typography;
};

export { themes, spacing, typography };

// Note: ThemeProvider and useTheme are exported directly from ThemeProvider.tsx
// to avoid circular dependencies 