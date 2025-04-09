/**
 * Design tokens for OneWord app
 * Single source of truth for all design values
 */

import { Platform } from 'react-native';
import { palettes } from './colors';

// Spacing scale (in pixels)
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

// Border radius scale
export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 100,
  circular: 9999,
} as const;

// Border width scale
export const borderWidth = {
  none: 0,
  hairline: 0.25,
  thin: 0.5,
  base: 1,
  thick: 2,
} as const;

// Opacity values as hex strings
const opacityValues = {
  none: '00',
  lightest: '20', // 12.5% opacity
  light: '15', // 8% opacity
  medium: '40', // 25% opacity
  high: '50', // 31% opacity
  higher: '80', // 50% opacity
} as const;

// Opacity values for export
export const opacity = {
  ...opacityValues,
  disabled: 0.7, // 70% opacity for disabled elements
  subtle: {
    light: `${palettes.neutral.white}${opacityValues.lightest}`,
    dark: `${palettes.neutral.black}${opacityValues.lightest}`,
  },
} as const;

// Animation timing durations (in milliseconds)
export const animation = {
  duration: {
    shortest: 150,
    shorter: 200,
    short: 300,
    standard: 400,
    medium: 500,
    long: 700,
    longer: 800,
    longest: 1000,
  },
  easing: {
    // Common easing functions
    standard: [0.4, 0.0, 0.2, 1], // Material Design standard easing
    accelerate: [0.4, 0.0, 1, 1], // Quick acceleration, linear end
    decelerate: [0.0, 0.0, 0.2, 1], // Linear start, gentle stop
    sharp: [0.25, 0.1, 0.25, 1], // Quick start, quick end
    gentle: [0.25, 0.5, 0.5, 1], // Gentle in and out
  },
} as const;

// Blend modes for overlays and effects
export const blending = {
  // Basic blend modes
  normal: 'normal' as const,
  multiply: 'multiply' as const,
  screen: 'screen' as const,
  overlay: 'overlay' as const,

  // Light adjusting blend modes
  darken: 'darken' as const,
  lighten: 'lighten' as const,
  colorDodge: 'color-dodge' as const,
  colorBurn: 'color-burn' as const,

  // Contrast blend modes
  hardLight: 'hard-light' as const,
  softLight: 'soft-light' as const,

  // Component blend modes
  difference: 'difference' as const,
  exclusion: 'exclusion' as const,

  // Color composition modes
  hue: 'hue' as const,
  saturation: 'saturation' as const,
  color: 'color' as const,
  luminosity: 'luminosity' as const,
} as const;

// Elevation/Shadow styles - Enhanced to support theming
export type ElevationLevel = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Factory function to create elevation styles that respect theme
export const createElevation = (textColor = palettes.neutral.black) => ({
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: textColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: textColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: textColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: textColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: textColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
});

// Default elevation with neutral black color
export const elevation = createElevation();

// Helper for applying elevation with platform-specific adjustments
export const applyElevation = (
  level: ElevationLevel,
  textColor?: string
): object => {
  const elevationStyles = textColor ? createElevation(textColor) : elevation;

  return Platform.select({
    ios: elevationStyles[level],
    android: {
      ...elevationStyles[level],
      // Android specific adjustments if needed
    },
    default: elevationStyles[level],
  });
};

// Component-specific tokens
export const components = {
  button: {
    minWidth: {
      small: 120,
      medium: 200,
      large: 280,
    },
    height: {
      small: 36,
      medium: 56,
      large: 64,
    },
    padding: {
      small: {
        x: spacing.md,
        y: spacing.xs,
      },
      medium: {
        x: spacing.xl,
        y: spacing.sm,
      },
      large: {
        x: spacing.xl,
        y: spacing.md,
      },
    },
  },
} as const;
