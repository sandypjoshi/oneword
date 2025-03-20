/**
 * Design tokens for OneWord app
 * Single source of truth for all design values
 */

import { Platform } from 'react-native';

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

// Opacity values
export const opacity = {
  none: '00',
  lightest: '20',  // 12.5% opacity
  light: '15',     // 8% opacity
  medium: '40',    // 25% opacity 
  high: '50',      // 31% opacity
  higher: '80',    // 50% opacity
  subtle: {
    light: 'rgba(255, 255, 255, 0.08)',
    dark: 'rgba(0, 0, 0, 0.08)'
  }
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
    longest: 1000
  },
  easing: {
    // Common easing functions
    standard: [0.4, 0.0, 0.2, 1], // Material Design standard easing
    accelerate: [0.4, 0.0, 1, 1],  // Quick acceleration, linear end
    decelerate: [0.0, 0.0, 0.2, 1], // Linear start, gentle stop
    sharp: [0.25, 0.1, 0.25, 1],    // Quick start, quick end
    gentle: [0.25, 0.5, 0.5, 1]     // Gentle in and out
  }
} as const;

// Elevation/Shadow styles
export const elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

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