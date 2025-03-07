/**
 * Color palette for the OneWord app
 * Organized by semantic usage rather than color names
 */

// Common palette (used in both light and dark)
const palette = {
  // Primary colors
  blue: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },
  
  // Neutrals
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Status colors
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196f3',
};

// Light theme colors
export const lightColors = {
  // Semantic colors
  background: {
    primary: palette.gray[50],
    secondary: '#ffffff',
    card: '#ffffff',
  },
  text: {
    primary: palette.gray[900],
    secondary: palette.gray[700],
    hint: palette.gray[500],
    inverse: '#ffffff',
  },
  border: {
    light: palette.gray[200],
    medium: palette.gray[300],
    dark: palette.gray[400],
  },
  
  // Brand colors
  primary: palette.blue[500],
  primaryLight: palette.blue[300],
  primaryDark: palette.blue[700],
  
  // Status colors
  success: palette.success,
  error: palette.error,
  warning: palette.warning,
  info: palette.info,
};

// Dark theme colors
export const darkColors = {
  // Semantic colors
  background: {
    primary: palette.gray[900],
    secondary: palette.gray[800],
    card: palette.gray[800],
  },
  text: {
    primary: '#ffffff',
    secondary: palette.gray[300],
    hint: palette.gray[500],
    inverse: palette.gray[900],
  },
  border: {
    light: palette.gray[700],
    medium: palette.gray[600],
    dark: palette.gray[500],
  },
  
  // Brand colors
  primary: palette.blue[400],
  primaryLight: palette.blue[300],
  primaryDark: palette.blue[600],
  
  // Status colors
  success: palette.success,
  error: palette.error,
  warning: palette.warning,
  info: palette.info,
};

export default { light: lightColors, dark: darkColors }; 