/**
 * Spacing constants for the OneWord app
 * These ensure consistent spacing and layout throughout the app
 */

// Basic spacing scale (in points)
export const spacing = {
  none: 0,
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
  '7xl': 96,
  '8xl': 128,
  '9xl': 160,
};

// Specific layout spacing
export const layout = {
  // Screen padding
  screenPaddingHorizontal: spacing.xl,
  screenPaddingVertical: spacing.xl,
  
  // Content sections
  sectionSpacing: spacing['4xl'],
  sectionPaddingVertical: spacing.xl,
  
  // Card components
  cardPadding: spacing.lg,
  cardGap: spacing.md,
  cardBorderRadius: spacing.base,
  
  // Form elements
  inputHeight: 56,
  inputPadding: spacing.md,
  inputBorderRadius: spacing.base,
  inputGap: spacing.lg,
  
  // Buttons
  buttonHeight: 48,
  buttonPadding: spacing.md,
  buttonBorderRadius: spacing.base,
  buttonGap: spacing.sm,
  
  // Lists
  listItemPadding: spacing.md,
  listItemSpacing: spacing.sm,
  
  // Navigation
  tabBarHeight: 56,
  navBarHeight: 56,
};

// Derive border radius values to maintain consistency
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
};

// Helper measurements for common UI elements
export const measurements = {
  // Avatar sizes
  avatarSizeSmall: 32,
  avatarSizeMedium: 48,
  avatarSizeLarge: 64,
  
  // Icon sizes
  iconSizeSmall: 16,
  iconSizeMedium: 24,
  iconSizeLarge: 32,
  
  // Touch targets (for accessibility)
  touchTargetMinimum: 44,
  
  // Max content width on larger screens
  contentMaxWidth: 768,
};

export default {
  spacing,
  layout,
  borderRadius,
  measurements,
}; 