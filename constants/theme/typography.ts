/**
 * Typography definitions for the OneWord app
 * These type settings ensure consistent text styling throughout the app
 */

import { Platform } from 'react-native';

// Define font families
export const fontFamily = {
  // Primary font
  primary: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    semiBold: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
      default: 'System',
    }),
  },
  // Secondary font (for accents or highlights)
  secondary: {
    regular: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'Georgia',
    }),
    italic: Platform.select({
      ios: 'Georgia-Italic',
      android: 'serif-italic',
      default: 'Georgia-Italic',
    }),
  },
  // Monospace font (for code or special content)
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

// Font sizes for different elements
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 60,
};

// Line heights
export const lineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
  // Absolute values for specific font sizes
  xs: 18,
  sm: 20,
  base: 24,
  md: 28,
  lg: 28,
  xl: 32,
  '2xl': 36,
  '3xl': 40,
  '4xl': 48,
  '5xl': 60,
  '6xl': 72,
};

// Font weight
export const fontWeight = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

// Letter spacing
export const letterSpacing = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
  widest: 1.6,
};

// Predefined text styles for common use cases
export const textStyles = {
  // Display
  displayLarge: {
    fontFamily: fontFamily.primary.bold,
    fontSize: fontSize['6xl'],
    lineHeight: lineHeight['6xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  displayMedium: {
    fontFamily: fontFamily.primary.bold,
    fontSize: fontSize['5xl'],
    lineHeight: lineHeight['5xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  displaySmall: {
    fontFamily: fontFamily.primary.bold,
    fontSize: fontSize['4xl'],
    lineHeight: lineHeight['4xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },

  // Headings
  heading1: {
    fontFamily: fontFamily.primary.bold,
    fontSize: fontSize['3xl'],
    lineHeight: lineHeight['3xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  heading2: {
    fontFamily: fontFamily.primary.bold,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight['2xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  heading3: {
    fontFamily: fontFamily.primary.bold,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.normal,
  },
  heading4: {
    fontFamily: fontFamily.primary.bold,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.normal,
  },
  heading5: {
    fontFamily: fontFamily.primary.medium,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.normal,
  },
  heading6: {
    fontFamily: fontFamily.primary.medium,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.normal,
  },

  // Body text
  bodyLarge: {
    fontFamily: fontFamily.primary.regular,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodyMedium: {
    fontFamily: fontFamily.primary.regular,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontFamily: fontFamily.primary.regular,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodyXSmall: {
    fontFamily: fontFamily.primary.regular,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Labels
  labelLarge: {
    fontFamily: fontFamily.primary.medium,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.wide,
  },
  labelMedium: {
    fontFamily: fontFamily.primary.medium,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.wide,
  },
  labelSmall: {
    fontFamily: fontFamily.primary.medium,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.wide,
  },
  labelXSmall: {
    fontFamily: fontFamily.primary.medium,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.wide,
  },

  // Specialty text
  wordOfTheDay: {
    fontFamily: fontFamily.secondary.regular,
    fontSize: fontSize['4xl'],
    lineHeight: lineHeight['4xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  pronunciation: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.wide,
  },
};

export default {
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
  textStyles,
}; 