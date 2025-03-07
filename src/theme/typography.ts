/**
 * Typography styles for the OneWord app
 */

import { TextStyle } from 'react-native';

type FontWeight = TextStyle['fontWeight'];

// Font weights
const fontWeights: Record<string, FontWeight> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Font sizes
const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Line heights (multiplier based on font size)
const lineHeights = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};

// Predefined text styles
const createTextStyles = () => {
  return {
    // Heading styles
    h1: {
      fontSize: fontSizes.xxxl,
      fontWeight: fontWeights.bold,
      lineHeight: fontSizes.xxxl * lineHeights.tight,
      letterSpacing: 0.2,
    },
    h2: {
      fontSize: fontSizes.xxl,
      fontWeight: fontWeights.bold,
      lineHeight: fontSizes.xxl * lineHeights.tight,
      letterSpacing: 0.2,
    },
    h3: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.semibold,
      lineHeight: fontSizes.xl * lineHeights.tight,
      letterSpacing: 0.2,
    },
    h4: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.semibold,
      lineHeight: fontSizes.lg * lineHeights.tight,
      letterSpacing: 0.2,
    },
    
    // Body text styles
    body1: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.md * lineHeights.normal,
    },
    body2: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
    
    // Utility text styles
    button: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.medium,
      lineHeight: fontSizes.md * lineHeights.tight,
      letterSpacing: 0.5,
    },
    caption: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.xs * lineHeights.normal,
    },
    label: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.medium,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
  };
};

const typography = {
  fontWeights,
  fontSizes,
  lineHeights,
  styles: createTextStyles(),
};

export default typography; 