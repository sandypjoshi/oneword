/**
 * Color palette for the OneWord app
 * These colors are used throughout the app for both light and dark modes
 */

// Base palette
const palette = {
  // Primary colors
  primary50: '#E4F2FF',
  primary100: '#C9E5FF',
  primary200: '#93CBFF',
  primary300: '#5DB1FF',
  primary400: '#2E96FF',
  primary500: '#007AFF', // Primary brand color
  primary600: '#0062CC',
  primary700: '#004A99',
  primary800: '#003166',
  primary900: '#001933',

  // Secondary accent colors
  secondary50: '#F5EDFF',
  secondary100: '#EBDAFF',
  secondary200: '#D6B6FF',
  secondary300: '#C292FF',
  secondary400: '#AD6DFF',
  secondary500: '#9949FF', // Secondary brand color
  secondary600: '#7A3ACC',
  secondary700: '#5C2B99',
  secondary800: '#3D1D66',
  secondary900: '#1F0E33',

  // Success colors
  success50: '#E7FAE7',
  success100: '#CFF5CF',
  success200: '#9FEB9F',
  success300: '#70E070',
  success400: '#40D640',
  success500: '#10CC10',
  success600: '#0CA30C',
  success700: '#097A09',
  success800: '#065206',
  success900: '#032903',

  // Warning colors
  warning50: '#FFF8E0',
  warning100: '#FFF1C2',
  warning200: '#FFE385',
  warning300: '#FFD647',
  warning400: '#FFC90A',
  warning500: '#FFBB00',
  warning600: '#CC9600',
  warning700: '#997000',
  warning800: '#664B00',
  warning900: '#332500',

  // Error colors
  error50: '#FFE9E6',
  error100: '#FFD3CD',
  error200: '#FFA79B',
  error300: '#FF7C69',
  error400: '#FF5037',
  error500: '#FF2511',
  error600: '#CC1E0E',
  error700: '#99160A',
  error800: '#660F07',
  error900: '#330703',

  // Neutrals
  neutral0: '#FFFFFF',
  neutral50: '#F9F9F9', 
  neutral100: '#F3F3F3',
  neutral200: '#E7E7E7',
  neutral300: '#D1D1D1',
  neutral400: '#ACACAC',
  neutral500: '#868686',
  neutral600: '#616161',
  neutral700: '#3B3B3B',
  neutral800: '#242424',
  neutral900: '#121212',
  neutral1000: '#000000',
};

// Light theme colors
export const lightColors = {
  // Semantic colors
  background: palette.neutral0,
  card: palette.neutral0,
  surface: palette.neutral50,
  surfaceHigh: palette.neutral100,
  divider: palette.neutral200,
  
  // Text colors
  textPrimary: palette.neutral900,
  textSecondary: palette.neutral700,
  textTertiary: palette.neutral500,
  textDisabled: palette.neutral400,
  textInverse: palette.neutral0,
  
  // Interactive element colors
  primary: palette.primary500,
  primaryLight: palette.primary100,
  primaryDark: palette.primary700,
  
  secondary: palette.secondary500,
  secondaryLight: palette.secondary100,
  secondaryDark: palette.secondary700,

  // State colors
  success: palette.success500,
  warning: palette.warning500,
  error: palette.error500,
  info: palette.primary500,

  // Other UI elements
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Provide direct access to palette if needed
  palette,
};

// Dark theme colors
export const darkColors = {
  // Semantic colors
  background: palette.neutral900,
  card: palette.neutral800,
  surface: palette.neutral800,
  surfaceHigh: palette.neutral700,
  divider: palette.neutral700,
  
  // Text colors
  textPrimary: palette.neutral50,
  textSecondary: palette.neutral200,
  textTertiary: palette.neutral400,
  textDisabled: palette.neutral600,
  textInverse: palette.neutral900,
  
  // Interactive element colors
  primary: palette.primary400, // Slightly brighter for dark mode
  primaryLight: palette.primary800,
  primaryDark: palette.primary300,
  
  secondary: palette.secondary400, // Slightly brighter for dark mode
  secondaryLight: palette.secondary800,
  secondaryDark: palette.secondary300,

  // State colors
  success: palette.success500,
  warning: palette.warning500,
  error: palette.error500,
  info: palette.primary400,

  // Other UI elements
  shadow: 'rgba(0, 0, 0, 0.2)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Provide direct access to palette if needed
  palette,
};

// Default to light theme
export default lightColors; 