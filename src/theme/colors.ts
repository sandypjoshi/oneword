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
  // Blues - Enhanced for better contrast across modes
  blue: {
    10: '#f0f7ff',
    25: '#e6f1ff',
    50: '#dbeafe',
    100: '#bfdbfe',
    200: '#93c5fd',
    300: '#60a5fa',
    400: '#3b82f6',
    500: '#2563eb',
    600: '#1d4ed8',
    700: '#1e40af',
    800: '#1e3a8a',
    900: '#172554',
    1000: '#0f172a',
  },
  
  // Deep Blues - Shifted toward darker spectrum with richer depth
  deepBlue: {
    10: '#f2f7ff',
    25: '#e5eef9',
    50: '#d1e0f2',
    100: '#b0cae8',
    200: '#8ab0dd',
    300: '#6389cb',
    400: '#4a68bc',
    500: '#263a94',
    600: '#1a2b7d',
    700: '#111c60',
    800: '#091143',
    900: '#040828',
    1000: '#020418',
  },
  
  // Purples - Enhanced for better vibrancy and transitions
  purple: {
    10: '#fcf9ff',
    25: '#f7f0fe',
    50: '#f0e7fd',
    100: '#e4d3fb',
    200: '#d0b6f9',
    300: '#b795f6',
    400: '#9e73f3',
    500: '#8450ea',
    600: '#6c35d2',
    700: '#5829ae',
    800: '#44208a',
    900: '#301664',
    1000: '#1e0c40',
  },
  
  // Greens - Improved for better natural feel and contrast
  green: {
    10: '#f0fdf4',
    25: '#e2fbeb',
    50: '#dcfce7',
    100: '#bbf7d0',
    200: '#86efac',
    300: '#4ade80',
    400: '#22c55e',
    500: '#16a34a',
    600: '#15803d',
    700: '#166534',
    800: '#14532d',
    900: '#052e16',
    1000: '#011b0d',
  },
  
  // Reds - Enhanced for clearer warnings and errors
  red: {
    10: '#fff5f5',
    25: '#ffeaea',
    50: '#fee2e2',
    100: '#fecaca',
    200: '#fca5a5',
    300: '#f87171',
    400: '#ef4444',
    500: '#dc2626',
    600: '#b91c1c',
    700: '#991b1b',
    800: '#7f1d1d',
    900: '#450a0a',
    1000: '#240505',
  },
  
  // Light mode neutrals - Smoother progression
  neutralLight: {
    0: '#ffffff',
    10: '#fafafa',
    25: '#f5f5f5',
    50: '#f0f0f0',
    100: '#e5e5e5',
    200: '#d4d4d4',
    300: '#c0c0c0',
    400: '#a3a3a3',
    500: '#8a8a8a',
    600: '#737373',
    700: '#525252',
    800: '#404040',
    900: '#262626',
    1000: '#171717',
  },
  
  // Dark mode neutrals - Improved for better dark surfaces
  neutralDark: {
    0: '#000000', 
    10: '#0a0a0a',
    25: '#121212',
    50: '#1c1c1c',
    100: '#262626',
    200: '#333333',
    300: '#454545',
    400: '#5a5a5a',
    500: '#757575',
    600: '#9e9e9e',
    700: '#bdbdbd',
    800: '#dedede',
    900: '#f0f0f0',
    1000: '#ffffff',
  },
  
  // True neutrals (black/white variants)
  neutral: {
    white: '#ffffff',
    10: '#fafafa',
    25: '#f8f8f8',
    50: '#f2f2f2',
    100: '#e6e6e6',
    200: '#d6d6d6',
    300: '#c2c2c2',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#2e2e2e',
    900: '#1a1a1a',
    1000: '#0a0a0a',
    black: '#000000',
  },
  
  // Warm neutrals - Refined for more sophistication and professional look
  sand: {
    10: '#fffcf8',
    25: '#fcf9f2',
    50: '#f9f1e7',
    100: '#f5e6d3',
    200: '#ead4b7',
    300: '#dfc199',
    400: '#d2ab7c',
    500: '#c19560',
    600: '#ae7f48',
    700: '#8e6434',
    800: '#6d4a23',
    900: '#483015',
    1000: '#2a1c0d',
  },
  
  // Cool neutrals - Refined for subtlety
  slate: {
    10: '#f8fafc',
    25: '#f1f5f9',
    50: '#eef4fa',
    100: '#e2edf7',
    200: '#cbd5e1',
    300: '#94a3b8',
    400: '#64748b',
    500: '#475569',
    600: '#334155',
    700: '#1e293b',
    800: '#0f172a',
    900: '#0a101f',
    1000: '#06080f',
  },
  
  // Oranges - Enhanced for more elegant warmth and professional tone
  orange: {
    10: '#fff8f4',
    25: '#fff2e9',
    50: '#ffebd8',
    100: '#ffdab3',
    200: '#ffc78a',
    300: '#ffb161',
    400: '#fa9638',
    500: '#e67f1f',
    600: '#cc6a12',
    700: '#a55411',
    800: '#7e3f10',
    900: '#522a0c',
    1000: '#301705',
  },
  
  // Pinks - Improved for richer contrast and softer hues
  pink: {
    10: '#fef6fa',
    25: '#fee6f3',
    50: '#fdd5ea',
    100: '#fbadd4',
    200: '#f985bf',
    300: '#f45d9e',
    400: '#e13b7e',
    500: '#ca1b62',
    600: '#a01a52',
    700: '#861b50',
    800: '#5d1436',
    900: '#3b0c22',
    1000: '#25091a',
  },
  
  // Teals - More sophisticated for success states in quill theme
  teal: {
    10: '#f0fdfa',
    25: '#e0fcf6',
    50: '#ccfbef',
    100: '#a1f4e0',
    200: '#73edd0',
    300: '#40e0bd',
    400: '#22c9a7',
    500: '#13ab8d',
    600: '#108a72',
    700: '#0e6b59',
    800: '#0b524a',
    900: '#053732',
    1000: '#022721',
  },
  
  // Yellows - Enhanced for better warnings and highlights
  yellow: {
    10: '#fefef9',
    25: '#fefde7',
    50: '#fef9c3',
    100: '#fef08a',
    200: '#fde047',
    300: '#facc15',
    400: '#eab308',
    500: '#ca8a04',
    600: '#a16207',
    700: '#854d0e',
    800: '#713f12',
    900: '#422006',
    1000: '#2c1803',
  },
  
  // Cyan - Improved for richer aqua tones
  cyan: {
    10: '#ecfdff',
    25: '#d8faff',
    50: '#baf8ff',
    100: '#9aecfd',
    200: '#67e3fd',
    300: '#22d3ee',
    400: '#06b6d4',
    500: '#0891b2',
    600: '#0e7490',
    700: '#155e75',
    800: '#164e63',
    900: '#082f39',
    1000: '#041d24',
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

// 2. Quill Theme - Sophisticated and warm with orange accents - Enhanced for professional aesthetics
const quillTheme = {
  light: {
    // Semantic colors - Background
    background: {
      primary: palettes.sand[10],
      secondary: palettes.sand[25],
      tertiary: palettes.sand[50],
      card: palettes.neutralLight[0],
      overlay: `${palettes.neutral.black}${opacity.medium}`,
      
      // Status backgrounds
      success: palettes.teal[25],
      successHeavy: palettes.teal[50],
      error: palettes.red[25],
      errorHeavy: palettes.red[50],
      warning: palettes.orange[25],
      warningHeavy: palettes.orange[50],
      info: palettes.deepBlue[25],
      infoHeavy: palettes.deepBlue[50],
      discovery: palettes.purple[25],
      discoveryHeavy: palettes.purple[50],
      
      // Interactive backgrounds
      hover: palettes.sand[25],
      active: palettes.sand[50],
      selected: palettes.orange[25],
      disabled: palettes.sand[50],
    },
    
    // Semantic colors - Text - Enhanced contrast
    text: {
      primary: palettes.neutral[900],
      secondary: palettes.sand[800],
      tertiary: palettes.sand[700],
      hint: palettes.sand[600],
      inverse: palettes.neutral.white,
      
      // Status text - Improved readability
      success: palettes.teal[700],
      error: palettes.red[700],
      warning: palettes.orange[700],
      info: palettes.deepBlue[700],
      discovery: palettes.purple[700],
      
      // Interactive text - Better contrast
      disabled: palettes.sand[500],
      link: palettes.orange[600],
      linkHover: palettes.orange[700],
    },
    
    // Semantic colors - Border - More refined edges
    border: {
      light: palettes.sand[100],
      medium: palettes.sand[200],
      dark: palettes.sand[400],
      focus: palettes.orange[500],
      
      // Status borders - Enhanced professional look
      success: palettes.teal[500],
      error: palettes.red[500],
      warning: palettes.orange[500],
      info: palettes.deepBlue[500],
      discovery: palettes.purple[500],
      
      // Interactive borders
      disabled: palettes.sand[200],
    },
    
    // Brand colors - More elegant orange
    primary: palettes.orange[600],
    primaryLight: palettes.orange[400],
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