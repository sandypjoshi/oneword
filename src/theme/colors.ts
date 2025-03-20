/**
 * Color palette for the OneWord app
 * Each theme has a completely different style and feel, not just different primary colors
 * Supports multiple themes with light and dark variants
 */

// Common base palettes
const palettes = {
  // Blues
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
  
  // Purples
  purple: {
    50: '#f3e5f5',
    100: '#e1bee7',
    200: '#ce93d8',
    300: '#ba68c8',
    400: '#ab47bc',
    500: '#9c27b0',
    600: '#8e24aa',
    700: '#7b1fa2',
    800: '#6a1b9a',
    900: '#4a148c',
  },
  
  // Greens
  green: {
    50: '#e8f5e9',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50',
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
  },
  
  // Neutrals (Gray)
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
  
  // Warm neutrals
  sand: {
    50: '#fdf8f1',
    100: '#f8eee0',
    200: '#f3e3cc',
    300: '#e8d0ae',
    400: '#dabb90',
    500: '#c9aa7c',
    600: '#b29368',
    700: '#9a7c55',
    800: '#7d6546',
    900: '#5f4d36',
  },
  
  // Cool neutrals
  slate: {
    50: '#f2f7fa',
    100: '#e6f0f5',
    200: '#d0e1eb',
    300: '#b2ccd9',
    400: '#92b1c2',
    500: '#7497ab',
    600: '#5d7c91',
    700: '#486273',
    800: '#38505e',
    900: '#2b3e4a',
  },
  
  // Accents
  orange: {
    500: '#ff9800',
    600: '#fb8c00',
    700: '#f57c00',
  },
  
  pink: {
    500: '#ec407a',
    600: '#d81b60',
    700: '#c2185b',
  },
  
  teal: {
    500: '#009688',
    600: '#00897b',
    700: '#00796b',
  },
  
  // Status colors
  status: {
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
  }
};

// Theme Definitions
// Each theme has both light and dark variants

// 1. Default Theme - Modern and clean with blue accents
const defaultTheme = {
  light: {
    // Semantic colors
    background: {
      primary: palettes.gray[50],
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      card: '#ffffff',
    },
    text: {
      primary: palettes.gray[900],
      secondary: palettes.gray[700],
      hint: palettes.gray[500],
      inverse: '#ffffff',
    },
    border: {
      light: palettes.gray[200],
      medium: palettes.gray[300],
      dark: palettes.gray[400],
    },
    
    // Brand colors
    primary: palettes.blue[500],
    primaryLight: palettes.blue[300],
    primaryDark: palettes.blue[700],
    
    // Status colors
    success: palettes.status.success,
    error: palettes.status.error,
    warning: palettes.status.warning,
    info: palettes.status.info,
  },
  dark: {
    // Semantic colors
    background: {
      primary: palettes.gray[900],
      secondary: '#303030',
      tertiary: '#383838',
      card: palettes.gray[800],
    },
    text: {
      primary: '#ffffff',
      secondary: palettes.gray[300],
      hint: palettes.gray[500],
      inverse: palettes.gray[900],
    },
    border: {
      light: palettes.gray[700],
      medium: palettes.gray[600],
      dark: palettes.gray[500],
    },
    
    // Brand colors
    primary: palettes.blue[400],
    primaryLight: palettes.blue[300],
    primaryDark: palettes.blue[600],
    
    // Status colors
    success: palettes.status.success,
    error: palettes.status.error,
    warning: palettes.status.warning,
    info: palettes.status.info,
  }
};

// 2. Quill Theme - Sophisticated and warm with orange accents
const quillTheme = {
  light: {
    // Semantic colors
    background: {
      primary: '#fff8ea',
      secondary: '#fffaf0',
      tertiary: '#fff5e6',
      card: '#ffffff',
    },
    text: {
      primary: '#010D25',
      secondary: '#5f4d36',
      hint: '#9a7c55',
      inverse: '#ffffff',
    },
    border: {
      light: '#f3e3cc',
      medium: '#e8d0ae',
      dark: '#c9aa7c',
    },
    
    // Brand colors
    primary: palettes.orange[600],
    primaryLight: palettes.orange[500],
    primaryDark: palettes.orange[700],
    
    // Status colors
    success: palettes.teal[600],
    error: '#e53935',
    warning: palettes.orange[600],
    info: '#2196f3',
  },
  dark: {
    // Semantic colors
    background: {
      primary: '#010D25',
      secondary: '#071a45',
      tertiary: '#0d2456',
      card: '#031334',
    },
    text: {
      primary: '#fff8ea',
      secondary: '#B3B3B3',
      hint: '#81858F',
      inverse: '#121212',
    },
    border: {
      light: '#192D55',
      medium: '#424242',
      dark: '#616161',
    },
    
    // Brand colors
    primary: palettes.orange[600],
    primaryLight: palettes.orange[500],
    primaryDark: palettes.orange[700],
    
    // Status colors
    success: palettes.teal[500],
    error: '#ef5350',
    warning: palettes.orange[500],
    info: '#2196f3',
  }
};

// 3. Aura Theme - Fresh and natural with green accents
const auraTheme = {
  light: {
    // Semantic colors
    background: {
      primary: '#f5f9f7',
      secondary: '#f0f5f1',
      tertiary: '#e6f0e8',
      card: '#ffffff',
    },
    text: {
      primary: '#2c3e2e',
      secondary: '#4a6b4d',
      hint: '#739175',
      inverse: '#ffffff',
    },
    border: {
      light: '#e0ece4',
      medium: '#cde3d0',
      dark: '#a0c8a2',
    },
    
    // Brand colors
    primary: palettes.green[600],
    primaryLight: palettes.green[400],
    primaryDark: palettes.green[800],
    
    // Status colors
    success: palettes.green[600],
    error: '#e53935',
    warning: palettes.orange[600],
    info: palettes.teal[600],
  },
  dark: {
    // Semantic colors
    background: {
      primary: '#1e2b1e',
      secondary: '#243024',
      tertiary: '#2c3c2c',
      card: '#283828',
    },
    text: {
      primary: '#f1f9f1',
      secondary: '#c7e0c8',
      hint: '#8eb590',
      inverse: '#283828',
    },
    border: {
      light: '#3c4f3c',
      medium: '#4d634e',
      dark: '#5e775f',
    },
    
    // Brand colors
    primary: palettes.green[400],
    primaryLight: palettes.green[300],
    primaryDark: palettes.green[600],
    
    // Status colors
    success: palettes.green[400],
    error: '#ef5350',
    warning: palettes.orange[500],
    info: palettes.teal[500],
  }
};

// Export all themes
const themes = {
  default: defaultTheme,
  quill: quillTheme,
  aura: auraTheme,
};

export default themes; 