/**
 * Color primitives for the OneWord app
 * Defines base color palettes that can be used to build semantic color themes
 */

// Alpha opacity values to be used with colors
export const opacity = {
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
export const palettes = {
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
    100: '#f3e4c1',
    200: '#e6d2a3',
    300: '#d8bf85',
    400: '#caa96a',
    500: '#b8904e',
    600: '#9e7335',
    700: '#7f5928',
    800: '#5f401b',
    900: '#3f2a10',
    1000: '#241607',
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
