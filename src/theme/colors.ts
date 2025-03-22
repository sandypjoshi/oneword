/**
 * Color palette for the OneWord app
 * Each theme has a completely different style and feel, not just different primary colors
 * Supports multiple themes with light and dark variants
 * Follows Atlassian Design System structure with extended values from 10 to 1000
 */

// Alpha opacity values to be used with colors
const opacity = {
  ultraLight: '10',
  lightest: '20',
  lighter: '30',
  light: '40',
  medium: '60',
  heavy: '80',
  ultraheavy: '90',
  opaque: 'FF',
};

// Common base palettes - Comprehensive color system
const palettes = {
  // Blues
  blue: {
    10: '#f5f9ff',
    25: '#eaf4ff',
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
    1000: '#072c6c',
  },
  
  // Deep Blues
  deepBlue: {
    10: '#f0f4fa',
    25: '#e1eaf7',
    50: '#d0e1f5',
    100: '#a8c5ea',
    200: '#80a9df',
    300: '#588dd4',
    400: '#3071c9',
    500: '#0855be',
    600: '#0747a6',
    700: '#063a8e',
    800: '#042c76',
    900: '#021d5d',
    1000: '#01103f',
  },
  
  // Purples
  purple: {
    10: '#faf6fd',
    25: '#f6edfc',
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
    1000: '#33006b',
  },
  
  // Greens
  green: {
    10: '#f4fbf4',
    25: '#e8f7e8',
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
    1000: '#0e3e11',
  },
  
  // Reds
  red: {
    10: '#fff5f5',
    25: '#ffebeb',
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336',
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
    1000: '#891010',
  },
  
  // Light mode neutrals
  neutralLight: {
    0: '#ffffff',
    10: '#fafafa',
    25: '#f8f8f8',
    50: '#f5f5f5',
    100: '#eeeeee',
    200: '#e0e0e0',
    300: '#d6d6d6',
    400: '#c2c2c2',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    1000: '#000000',
  },
  
  // Dark mode neutrals
  neutralDark: {
    0: '#000000', 
    10: '#121212',
    25: '#1e1e1e',
    50: '#2c2c2c',
    100: '#323232',
    200: '#3e3e3e',
    300: '#525252',
    400: '#686868',
    500: '#858585',
    600: '#a3a3a3',
    700: '#c4c4c4',
    800: '#e0e0e0',
    900: '#f5f5f5',
    1000: '#ffffff',
  },
  
  // True neutrals (black/white variants)
  neutral: {
    white: '#ffffff',
    10: '#fafafa',
    25: '#f8f8f8',
    50: '#f5f5f5',
    100: '#f0f0f0',
    200: '#e9e9e9',
    300: '#d9d9d9',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    1000: '#0a0a0a',
    black: '#000000',
  },
  
  // Warm neutrals
  sand: {
    10: '#fffcf8',
    25: '#fffaf3',
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
    1000: '#3e311f',
  },
  
  // Cool neutrals
  slate: {
    10: '#f8fafc',
    25: '#f5f8fb',
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
    1000: '#1a272f',
  },
  
  // Oranges
  orange: {
    10: '#fffaf5',
    25: '#fff5eb',
    50: '#fff3e0',
    100: '#ffe0b2',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ff9800',
    600: '#fb8c00',
    700: '#f57c00',
    800: '#ef6c00',
    900: '#e65100',
    1000: '#bf4400',
  },
  
  // Pinks
  pink: {
    10: '#fef5f8',
    25: '#feeef3',
    50: '#fce4ec',
    100: '#f8bbd0',
    200: '#f48fb1',
    300: '#f06292',
    400: '#ec407a',
    500: '#e91e63',
    600: '#d81b60',
    700: '#c2185b',
    800: '#ad1457',
    900: '#880e4f',
    1000: '#5f0937',
  },
  
  // Teals
  teal: {
    10: '#f0faf9',
    25: '#e5f5f4',
    50: '#e0f2f1',
    100: '#b2dfdb',
    200: '#80cbc4',
    300: '#4db6ac',
    400: '#26a69a',
    500: '#009688',
    600: '#00897b',
    700: '#00796b',
    800: '#00695c',
    900: '#004d40',
    1000: '#00332b',
  },
  
  // Yellows
  yellow: {
    10: '#fffef7',
    25: '#fffef0',
    50: '#fffde7',
    100: '#fff9c4',
    200: '#fff59d',
    300: '#fff176',
    400: '#ffee58',
    500: '#ffeb3b',
    600: '#fdd835',
    700: '#fbc02d',
    800: '#f9a825',
    900: '#f57f17',
    1000: '#c45e00',
  },
  
  // Cyan
  cyan: {
    10: '#f1fbfd',
    25: '#e7f7fa',
    50: '#e0f7fa',
    100: '#b2ebf2',
    200: '#80deea',
    300: '#4dd0e1',
    400: '#26c6da',
    500: '#00bcd4',
    600: '#00acc1',
    700: '#0097a7',
    800: '#00838f',
    900: '#006064',
    1000: '#003c40',
  },
};

// Status colors derived from the common palette
const statusColors = {
  // Success states
  success: palettes.green[500],
  successLight: palettes.green[300],
  successDark: palettes.green[700],
  
  // Error states
  error: palettes.red[500],
  errorLight: palettes.red[300],
  errorDark: palettes.red[700],
  
  // Warning states
  warning: palettes.orange[500],
  warningLight: palettes.orange[300],
  warningDark: palettes.orange[700],
  
  // Info states
  info: palettes.blue[500],
  infoLight: palettes.blue[300],
  infoDark: palettes.blue[700],
  
  // Neutral states
  neutral: palettes.neutral[500],
  neutralLight: palettes.neutral[300],
  neutralDark: palettes.neutral[700],
  
  // Discovery states
  discovery: palettes.deepBlue[500],
  discoveryLight: palettes.deepBlue[300],
  discoveryDark: palettes.deepBlue[700],
};

// Theme Definitions
// Each theme has both light and dark variants with enhanced semantic colors

// 1. Default Theme - Modern and clean with blue accents
const defaultTheme = {
  light: {
    // Semantic colors - Background
    background: {
      primary: palettes.neutralLight[10],
      secondary: palettes.neutralLight[50],
      tertiary: palettes.neutralLight[100],
      card: palettes.neutralLight[0],
      overlay: `${palettes.neutral.black}${opacity.medium}`,
      
      // Status backgrounds
      success: palettes.green[50],
      successHeavy: palettes.green[100],
      error: palettes.red[50],
      errorHeavy: palettes.red[100],
      warning: palettes.orange[50],
      warningHeavy: palettes.orange[100],
      info: palettes.blue[50],
      infoHeavy: palettes.blue[100],
      discovery: palettes.deepBlue[50],
      discoveryHeavy: palettes.deepBlue[100],
      
      // Interactive backgrounds
      hover: palettes.neutralLight[50],
      active: palettes.neutralLight[100],
      selected: palettes.blue[50],
      disabled: palettes.neutralLight[100],
    },
    
    // Semantic colors - Text
    text: {
      primary: palettes.neutralLight[1000],
      secondary: palettes.neutralLight[800],
      tertiary: palettes.neutralLight[600],
      hint: palettes.neutralLight[500],
      inverse: palettes.neutralLight[0],
      
      // Status text
      success: palettes.green[700],
      error: palettes.red[700],
      warning: palettes.orange[700],
      info: palettes.blue[700],
      discovery: palettes.deepBlue[700],
      
      // Interactive text
      disabled: palettes.neutralLight[400],
      link: palettes.blue[600],
      linkHover: palettes.blue[700],
    },
    
    // Semantic colors - Border
    border: {
      light: palettes.neutralLight[200],
      medium: palettes.neutralLight[300],
      dark: palettes.neutralLight[400],
      focus: palettes.blue[500],
      
      // Status borders
      success: palettes.green[500],
      error: palettes.red[500],
      warning: palettes.orange[500],
      info: palettes.blue[500],
      discovery: palettes.deepBlue[500],
      
      // Interactive borders
      disabled: palettes.neutralLight[300],
    },
    
    // Brand colors
    primary: palettes.blue[500],
    primaryLight: palettes.blue[300],
    primaryDark: palettes.blue[700],
    
    // Status colors
    success: statusColors.success,
    successLight: statusColors.successLight,
    successDark: statusColors.successDark,
    
    error: statusColors.error,
    errorLight: statusColors.errorLight,
    errorDark: statusColors.errorDark,
    
    warning: statusColors.warning,
    warningLight: statusColors.warningLight,
    warningDark: statusColors.warningDark,
    
    info: statusColors.info,
    infoLight: statusColors.infoLight,
    infoDark: statusColors.infoDark,
    
    discovery: statusColors.discovery,
    discoveryLight: statusColors.discoveryLight,
    discoveryDark: statusColors.discoveryDark,
  },
  
  dark: {
    // Semantic colors - Background
    background: {
      primary: palettes.neutralDark[25],
      secondary: palettes.neutralDark[50],
      tertiary: palettes.neutralDark[100],
      card: palettes.neutralDark[50],
      overlay: `${palettes.neutral.black}${opacity.heavy}`,
      
      // Status backgrounds
      success: palettes.green[900],
      successHeavy: palettes.green[800],
      error: palettes.red[900],
      errorHeavy: palettes.red[800],
      warning: palettes.orange[900],
      warningHeavy: palettes.orange[800],
      info: palettes.blue[900],
      infoHeavy: palettes.blue[800],
      discovery: palettes.deepBlue[900],
      discoveryHeavy: palettes.deepBlue[800],
      
      // Interactive backgrounds
      hover: palettes.neutralDark[100],
      active: palettes.neutralDark[200],
      selected: palettes.blue[900],
      disabled: palettes.neutralDark[100],
    },
    
    // Semantic colors - Text
    text: {
      primary: palettes.neutralDark[1000],
      secondary: palettes.neutralDark[800],
      tertiary: palettes.neutralDark[600],
      hint: palettes.neutralDark[500],
      inverse: palettes.neutralDark[0],
      
      // Status text
      success: palettes.green[300],
      error: palettes.red[300],
      warning: palettes.orange[300],
      info: palettes.blue[300],
      discovery: palettes.deepBlue[300],
      
      // Interactive text
      disabled: palettes.neutralDark[400],
      link: palettes.blue[400],
      linkHover: palettes.blue[300],
    },
    
    // Semantic colors - Border
    border: {
      light: palettes.neutralDark[200],
      medium: palettes.neutralDark[300],
      dark: palettes.neutralDark[400],
      focus: palettes.blue[500],
      
      // Status borders
      success: palettes.green[500],
      error: palettes.red[500],
      warning: palettes.orange[500],
      info: palettes.blue[500],
      discovery: palettes.deepBlue[500],
      
      // Interactive borders
      disabled: palettes.neutralDark[300],
    },
    
    // Brand colors
    primary: palettes.blue[400],
    primaryLight: palettes.blue[300],
    primaryDark: palettes.blue[600],
    
    // Status colors
    success: statusColors.success,
    successLight: statusColors.successLight,
    successDark: statusColors.successDark,
    
    error: statusColors.error,
    errorLight: statusColors.errorLight,
    errorDark: statusColors.errorDark,
    
    warning: statusColors.warning,
    warningLight: statusColors.warningLight,
    warningDark: statusColors.warningDark,
    
    info: statusColors.info,
    infoLight: statusColors.infoLight,
    infoDark: statusColors.infoDark,
    
    discovery: statusColors.discovery,
    discoveryLight: statusColors.discoveryLight,
    discoveryDark: statusColors.discoveryDark,
  }
};

// 2. Quill Theme - Sophisticated and warm with orange accents
const quillTheme = {
  light: {
    // Semantic colors - Background
    background: {
      primary: palettes.sand[10],
      secondary: palettes.sand[50],
      tertiary: palettes.sand[100],
      card: palettes.neutralLight[0],
      overlay: `${palettes.neutral.black}${opacity.medium}`,
      
      // Status backgrounds
      success: palettes.teal[50],
      successHeavy: palettes.teal[100],
      error: palettes.red[50],
      errorHeavy: palettes.red[100],
      warning: palettes.orange[50],
      warningHeavy: palettes.orange[100],
      info: palettes.deepBlue[50],
      infoHeavy: palettes.deepBlue[100],
      discovery: palettes.purple[50],
      discoveryHeavy: palettes.purple[100],
      
      // Interactive backgrounds
      hover: palettes.sand[50],
      active: palettes.sand[100],
      selected: palettes.orange[50],
      disabled: palettes.sand[100],
    },
    
    // Semantic colors - Text
    text: {
      primary: palettes.neutral[900],
      secondary: palettes.sand[900],
      tertiary: palettes.sand[800],
      hint: palettes.sand[700],
      inverse: palettes.neutral.white,
      
      // Status text
      success: palettes.teal[700],
      error: palettes.red[700],
      warning: palettes.orange[700],
      info: palettes.deepBlue[700],
      discovery: palettes.purple[700],
      
      // Interactive text
      disabled: palettes.sand[400],
      link: palettes.orange[600],
      linkHover: palettes.orange[700],
    },
    
    // Semantic colors - Border
    border: {
      light: palettes.sand[200],
      medium: palettes.sand[300],
      dark: palettes.sand[500],
      focus: palettes.orange[500],
      
      // Status borders
      success: palettes.teal[500],
      error: palettes.red[500],
      warning: palettes.orange[500],
      info: palettes.deepBlue[500],
      discovery: palettes.purple[500],
      
      // Interactive borders
      disabled: palettes.sand[300],
    },
    
    // Brand colors
    primary: palettes.orange[600],
    primaryLight: palettes.orange[500],
    primaryDark: palettes.orange[700],
    
    // Status colors
    success: palettes.teal[600],
    successLight: palettes.teal[400],
    successDark: palettes.teal[800],
    
    error: palettes.red[600],
    errorLight: palettes.red[400],
    errorDark: palettes.red[800],
    
    warning: palettes.orange[600],
    warningLight: palettes.orange[400],
    warningDark: palettes.orange[800],
    
    info: palettes.deepBlue[600],
    infoLight: palettes.deepBlue[400],
    infoDark: palettes.deepBlue[800],
    
    discovery: palettes.purple[600],
    discoveryLight: palettes.purple[400],
    discoveryDark: palettes.purple[800],
  },
  
  dark: {
    // Semantic colors - Background
    background: {
      primary: palettes.deepBlue[900],
      secondary: palettes.deepBlue[800],
      tertiary: palettes.deepBlue[700],
      card: palettes.deepBlue[800],
      overlay: `${palettes.neutral.black}${opacity.heavy}`,
      
      // Status backgrounds
      success: palettes.teal[900],
      successHeavy: palettes.teal[800],
      error: palettes.red[900],
      errorHeavy: palettes.red[800],
      warning: palettes.orange[900],
      warningHeavy: palettes.orange[800],
      info: palettes.deepBlue[900],
      infoHeavy: palettes.deepBlue[800],
      discovery: palettes.purple[900],
      discoveryHeavy: palettes.purple[800],
      
      // Interactive backgrounds
      hover: palettes.deepBlue[800],
      active: palettes.deepBlue[700],
      selected: palettes.orange[800],
      disabled: palettes.deepBlue[800],
    },
    
    // Semantic colors - Text
    text: {
      primary: palettes.sand[50],
      secondary: palettes.sand[100],
      tertiary: palettes.sand[200],
      hint: palettes.sand[300],
      inverse: palettes.deepBlue[900],
      
      // Status text
      success: palettes.teal[300],
      error: palettes.red[300],
      warning: palettes.orange[300],
      info: palettes.blue[300],
      discovery: palettes.purple[300],
      
      // Interactive text
      disabled: palettes.neutralDark[400],
      link: palettes.orange[400],
      linkHover: palettes.orange[300],
    },
    
    // Semantic colors - Border
    border: {
      light: palettes.deepBlue[700],
      medium: palettes.deepBlue[600],
      dark: palettes.deepBlue[500],
      focus: palettes.orange[500],
      
      // Status borders
      success: palettes.teal[500],
      error: palettes.red[500],
      warning: palettes.orange[500],
      info: palettes.blue[500],
      discovery: palettes.purple[500],
      
      // Interactive borders
      disabled: palettes.deepBlue[600],
    },
    
    // Brand colors
    primary: palettes.orange[500],
    primaryLight: palettes.orange[400],
    primaryDark: palettes.orange[600],
    
    // Status colors
    success: palettes.teal[500],
    successLight: palettes.teal[400],
    successDark: palettes.teal[600],
    
    error: palettes.red[500],
    errorLight: palettes.red[400],
    errorDark: palettes.red[600],
    
    warning: palettes.orange[500],
    warningLight: palettes.orange[400],
    warningDark: palettes.orange[600],
    
    info: palettes.blue[500],
    infoLight: palettes.blue[400],
    infoDark: palettes.blue[600],
    
    discovery: palettes.purple[500],
    discoveryLight: palettes.purple[400],
    discoveryDark: palettes.purple[600],
  }
};

// 3. Aura Theme - Fresh and natural with green accents
const auraTheme = {
  light: {
    // Semantic colors - Background
    background: {
      primary: palettes.green[10],
      secondary: palettes.green[25],
      tertiary: palettes.green[50],
      card: palettes.neutralLight[0],
      overlay: `${palettes.neutral.black}${opacity.medium}`,
      
      // Status backgrounds
      success: palettes.green[50],
      successHeavy: palettes.green[100],
      error: palettes.red[50],
      errorHeavy: palettes.red[100],
      warning: palettes.orange[50],
      warningHeavy: palettes.orange[100],
      info: palettes.cyan[50],
      infoHeavy: palettes.cyan[100],
      discovery: palettes.teal[50],
      discoveryHeavy: palettes.teal[100],
      
      // Interactive backgrounds
      hover: palettes.green[25],
      active: palettes.green[50],
      selected: palettes.green[100],
      disabled: palettes.neutralLight[100],
    },
    
    // Semantic colors - Text
    text: {
      primary: palettes.green[900],
      secondary: palettes.green[800],
      tertiary: palettes.green[700],
      hint: palettes.green[600],
      inverse: palettes.neutralLight[0],
      
      // Status text
      success: palettes.green[700],
      error: palettes.red[700],
      warning: palettes.orange[700],
      info: palettes.cyan[700],
      discovery: palettes.teal[700],
      
      // Interactive text
      disabled: palettes.neutralLight[400],
      link: palettes.green[600],
      linkHover: palettes.green[700],
    },
    
    // Semantic colors - Border
    border: {
      light: palettes.green[100],
      medium: palettes.green[200],
      dark: palettes.green[300],
      focus: palettes.green[500],
      
      // Status borders
      success: palettes.green[500],
      error: palettes.red[500],
      warning: palettes.orange[500],
      info: palettes.cyan[500],
      discovery: palettes.teal[500],
      
      // Interactive borders
      disabled: palettes.neutralLight[300],
    },
    
    // Brand colors
    primary: palettes.green[600],
    primaryLight: palettes.green[400],
    primaryDark: palettes.green[800],
    
    // Status colors
    success: palettes.green[600],
    successLight: palettes.green[400],
    successDark: palettes.green[800],
    
    error: palettes.red[600],
    errorLight: palettes.red[400],
    errorDark: palettes.red[800],
    
    warning: palettes.orange[600],
    warningLight: palettes.orange[400],
    warningDark: palettes.orange[800],
    
    info: palettes.cyan[600],
    infoLight: palettes.cyan[400],
    infoDark: palettes.cyan[800],
    
    discovery: palettes.teal[600],
    discoveryLight: palettes.teal[400],
    discoveryDark: palettes.teal[800],
  },
  
  dark: {
    // Semantic colors - Background
    background: {
      primary: palettes.green[900],
      secondary: palettes.green[800],
      tertiary: palettes.green[700],
      card: palettes.green[800],
      overlay: `${palettes.neutral.black}${opacity.heavy}`,
      
      // Status backgrounds
      success: palettes.green[900],
      successHeavy: palettes.green[800],
      error: palettes.red[900],
      errorHeavy: palettes.red[800],
      warning: palettes.orange[900],
      warningHeavy: palettes.orange[800],
      info: palettes.cyan[900],
      infoHeavy: palettes.cyan[800],
      discovery: palettes.teal[900],
      discoveryHeavy: palettes.teal[800],
      
      // Interactive backgrounds
      hover: palettes.green[800],
      active: palettes.green[700],
      selected: palettes.green[600],
      disabled: palettes.neutralDark[200],
    },
    
    // Semantic colors - Text
    text: {
      primary: palettes.green[100],
      secondary: palettes.green[200],
      tertiary: palettes.green[300],
      hint: palettes.green[400],
      inverse: palettes.green[900],
      
      // Status text
      success: palettes.green[300],
      error: palettes.red[300],
      warning: palettes.orange[300],
      info: palettes.cyan[300],
      discovery: palettes.teal[300],
      
      // Interactive text
      disabled: palettes.neutralDark[400],
      link: palettes.green[400],
      linkHover: palettes.green[300],
    },
    
    // Semantic colors - Border
    border: {
      light: palettes.green[700],
      medium: palettes.green[600],
      dark: palettes.green[500],
      focus: palettes.green[500],
      
      // Status borders
      success: palettes.green[500],
      error: palettes.red[500],
      warning: palettes.orange[500],
      info: palettes.cyan[500],
      discovery: palettes.teal[500],
      
      // Interactive borders
      disabled: palettes.neutralDark[300],
    },
    
    // Brand colors
    primary: palettes.green[400],
    primaryLight: palettes.green[300],
    primaryDark: palettes.green[600],
    
    // Status colors
    success: palettes.green[400],
    successLight: palettes.green[300],
    successDark: palettes.green[600],
    
    error: palettes.red[400],
    errorLight: palettes.red[300],
    errorDark: palettes.red[600],
    
    warning: palettes.orange[400],
    warningLight: palettes.orange[300],
    warningDark: palettes.orange[600],
    
    info: palettes.cyan[400],
    infoLight: palettes.cyan[300],
    infoDark: palettes.cyan[600],
    
    discovery: palettes.teal[400],
    discoveryLight: palettes.teal[300],
    discoveryDark: palettes.teal[600],
  }
};

// Export all themes
const themes = {
  default: defaultTheme,
  quill: quillTheme,
  aura: auraTheme,
};

export default themes;
export { palettes, opacity, statusColors }; 