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
        x: spacing.lg,
        y: spacing.sm,
      },
      large: {
        x: spacing.xl,
        y: spacing.md,
      },
    },
  },
} as const; 