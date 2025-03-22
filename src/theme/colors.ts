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
  
  // Deep Blues - Further desaturated and inspired by moonlit ocean waters for minimal eye strain
  deepBlue: {
    10: '#edf0f5',
    25: '#dce2ec',
    50: '#c5ceda',
    100: '#a7b6c7',
    200: '#8a99b3',
    300: '#6c7d9c',
    400: '#536785',
    500: '#3d506f',
    600: '#2b3c59',
    700: '#1e2c44',
    800: '#151e30',
    900: '#0c121f',
    1000: '#060a12',
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
  
  // Light mode neutrals - Warm undertones for more natural progression
  neutralLight: {
    0: '#ffffff',
    10: '#fafaf8',
    25: '#f7f7f5',
    50: '#f0f0ee',
    100: '#e6e6e4',
    200: '#d5d5d3',
    300: '#c1c1bf',
    400: '#a3a3a1',
    500: '#8a8a88',
    600: '#737371',
    700: '#525250',
    800: '#3d3d3b',
    900: '#252523',
    1000: '#141412',
  },
  
  // Dark mode neutrals - Cool blue undertones for depth in dark interfaces
  neutralDark: {
    0: '#0c1014', // Deep blue-black that appears richer than pure black
    10: '#111519',
    25: '#15181d',
    50: '#1b1e23',
    100: '#24272c',
    200: '#31343a',
    300: '#43464c',
    400: '#5a5c62',
    500: '#75777d',
    600: '#9e9fa4',
    700: '#bcbdc2',
    800: '#dddee3',
    900: '#eff0f5',
    1000: '#ffffff',
  },
  
  // True neutrals with rich deep near-black with subtle brown undertones
  neutral: {
    white: '#ffffff',
    10: '#fafaf9',
    25: '#f7f7f6',
    50: '#f0f0ef',
    100: '#e6e6e5',
    200: '#d5d5d4',
    300: '#c1c1c0',
    400: '#a3a3a2',
    500: '#737372',
    600: '#525251',
    700: '#3f3e3d',
    800: '#2a2928',
    900: '#18171a',
    1000: '#0e0d10',
    black: '#0a0a0c', // Rich deep near-black with subtle undertones that looks natural
  },
  
  // Warm neutrals - True sandy hues with golden amber undertones
  sand: {
    10: '#fffdf7',
    25: '#fcf8ed',
    50: '#f9f1dd',
    100: '#f5e7c7',
    200: '#edd8ae',
    300: '#e4c794',
    400: '#d8b47b',
    500: '#c9a062',
    600: '#b68a4c',
    700: '#9d743b',
    800: '#7d5c2f',
    900: '#5a4121',
    1000: '#382815',
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
  
  // Oranges - Vibrant amber tones with natural warmth
  orange: {
    10: '#fff9f5',
    25: '#fff3ea',
    50: '#ffe9d8',
    100: '#ffd9b8',
    200: '#ffc592',
    300: '#ffad6d',
    400: '#f99547',
    500: '#ee7d28',
    600: '#dd6a19',
    700: '#b85615',
    800: '#8f4211',
    900: '#612d0e',
    1000: '#3d1c09',
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
      tertiary: palettes.neutralLight[25],
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
      active: palettes.blue[25],
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
      primary: palettes.neutralDark[10],
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
      card: palettes.sand[25],
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
      hover: palettes.sand[50],
      active: palettes.sand[100],
      selected: palettes.orange[50],
      disabled: palettes.sand[50],
    },
    
    // Semantic colors - Text - Enhanced contrast
    text: {
      primary: palettes.neutral[900],
      secondary: palettes.sand[800],
      tertiary: palettes.sand[700],
      hint: palettes.sand[600],
      inverse: palettes.sand[10],
      
      // Status text - Improved readability
      success: palettes.teal[700],
      error: palettes.red[700],
      warning: palettes.orange[800],
      info: palettes.deepBlue[700],
      discovery: palettes.purple[700],
      
      // Interactive text - Better contrast
      disabled: palettes.sand[500],
      link: palettes.orange[700],
      linkHover: palettes.orange[800],
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

// Export all themes
const themes = {
  default: defaultTheme,
  quill: quillTheme,
};

export default themes;
export { palettes, opacity, statusColors }; 