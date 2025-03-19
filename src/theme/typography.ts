/**
 * Typography styles for the OneWord app
 */

import { TextStyle, Platform } from 'react-native';

type FontWeight = TextStyle['fontWeight'];
type ThemeName = 'default' | 'quill' | 'aura';

// Platform-specific font families - Keep it simple and stable
const FONT_FAMILIES = {
  system: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: undefined, // Using undefined allows React Native to pick platform default
  }),
  serif: Platform.select({
    ios: 'New York',
    android: 'Roboto Serif',
    default: 'serif',
  }),
};

// Font weights
const FONT_WEIGHTS: Record<string, FontWeight> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '900',
};

// Font sizes - Adjusted to avoid tiny text 
const FONT_SIZES = {
  xxs: 12,     // Very small text
  xs: 14,      // Small captions, footnotes
  sm: 16,      // Secondary text, labels
  md: 18,      // Body text
  lg: 21,      // Large body text, small headings
  xl: 24,      // Subheadings
  xxl: 28,     // Headings
  xxxl: 36,    // Large headings
  display: 44, // Display headings
  huge: 52,    // Huge display text
};

// Line heights (multiplier based on font size)
const LINE_HEIGHTS = {
  tight: 1.25,    // Tighter for headings
  normal: 1.5,    // Standard for body text
  relaxed: 1.75,  // More space for readability
  loose: 2.0,     // Very loose for emphasized text
};

// Letter spacing for different text types
const LETTER_SPACING = {
  tighter: -0.5,   // Tight for headings
  tight: -0.25,    // Slightly tighter
  normal: 0,       // Normal spacing
  wide: 0.25,      // Slightly wider  
  wider: 0.5,      // Wider for emphasis
};

// Base text styles that don't include the font family
// Using semantic naming conventions for better clarity
const BASE_TEXT_STYLES = {
  // Display headings for major features
  displayLarge: {
    fontSize: FONT_SIZES.huge,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES.huge * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.tighter,
  },
  displayMedium: {
    fontSize: FONT_SIZES.display, 
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES.display * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.tighter,
  },
  displaySmall: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES.xxxl * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.tight,
  },
  
  // Heading styles - Enhanced with more distinction
  headingLarge: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES.xxxl * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.tight,
  },
  headingMedium: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES.xxl * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.tight,
  },
  headingSmall: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.xl * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.normal,
  },
  subheading: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.normal,
  },
  
  // Body text styles - With semantic naming
  bodyLarge: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
  },
  bodyMedium: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
  },
  bodySmall: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
  },
  bodyEmphasized: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
  },
  
  // Utility text styles with semantic names
  button: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.wide,
  },
  buttonSmall: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.wide,
  },
  caption: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.xs * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
  },
  overline: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: FONT_SIZES.xs * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.wider,
    textTransform: 'uppercase' as const,
  },
  note: {
    fontSize: FONT_SIZES.xxs,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.xxs * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
    fontStyle: 'italic' as const,
  },
};

// This is a type-safe way to create text styles for each theme
interface ThemeSpecificFonts {
  primary: string | undefined;
  secondary: string | undefined;
}

// Define font families for each theme
const THEME_FONTS: Record<ThemeName, ThemeSpecificFonts> = {
  default: {
    primary: FONT_FAMILIES.system,
    secondary: FONT_FAMILIES.system,
  },
  quill: {
    primary: FONT_FAMILIES.serif,
    secondary: FONT_FAMILIES.system,
  },
  aura: {
    primary: FONT_FAMILIES.system,
    secondary: FONT_FAMILIES.system,
  },
};

// Create a derived style with font family - only if font is defined
function addFontFamily<T extends Record<string, any>>(
  style: T, 
  fontFamily: string | undefined
): T {
  if (!fontFamily) {
    return { ...style };
  }
  return { ...style, fontFamily };
}

// Create the final text styles for a specific theme
function createTextStyles(themeName: ThemeName = 'default'): Record<string, TextStyle> {
  // Get the appropriate fonts for this theme
  const themeFonts = THEME_FONTS[themeName] || THEME_FONTS.default;
  
  // Create styles with theme-specific fonts
  const styles = {
    // Display styles
    displayLarge: addFontFamily(BASE_TEXT_STYLES.displayLarge, themeFonts.primary),
    displayMedium: addFontFamily(BASE_TEXT_STYLES.displayMedium, themeFonts.primary),
    displaySmall: addFontFamily(BASE_TEXT_STYLES.displaySmall, themeFonts.primary),
    
    // Heading styles
    headingLarge: addFontFamily(BASE_TEXT_STYLES.headingLarge, themeFonts.primary),
    headingMedium: addFontFamily(BASE_TEXT_STYLES.headingMedium, themeFonts.primary),
    headingSmall: addFontFamily(BASE_TEXT_STYLES.headingSmall, themeFonts.primary),
    subheading: addFontFamily(BASE_TEXT_STYLES.subheading, themeFonts.primary),
    
    // Body styles
    bodyLarge: addFontFamily(BASE_TEXT_STYLES.bodyLarge, themeFonts.secondary),
    bodyMedium: addFontFamily(BASE_TEXT_STYLES.bodyMedium, themeFonts.secondary),
    bodySmall: addFontFamily(BASE_TEXT_STYLES.bodySmall, themeFonts.secondary),
    bodyEmphasized: addFontFamily(BASE_TEXT_STYLES.bodyEmphasized, themeFonts.secondary),
    
    // Utility styles
    button: addFontFamily(BASE_TEXT_STYLES.button, themeFonts.secondary),
    buttonSmall: addFontFamily(BASE_TEXT_STYLES.buttonSmall, themeFonts.secondary),
    caption: addFontFamily(BASE_TEXT_STYLES.caption, themeFonts.secondary),
    label: addFontFamily(BASE_TEXT_STYLES.label, themeFonts.secondary),
    overline: addFontFamily(BASE_TEXT_STYLES.overline, themeFonts.secondary),
    note: addFontFamily(BASE_TEXT_STYLES.note, themeFonts.secondary),
    subtitle: addFontFamily(BASE_TEXT_STYLES.subtitle, themeFonts.secondary),
  };
  
  // Apply theme-specific overrides
  if (themeName === 'quill') {
    return {
      ...styles,
      // Serif fonts often need different letter spacing
      headingLarge: addFontFamily({ ...BASE_TEXT_STYLES.headingLarge, letterSpacing: LETTER_SPACING.tighter }, themeFonts.primary),
      headingMedium: addFontFamily({ ...BASE_TEXT_STYLES.headingMedium, letterSpacing: LETTER_SPACING.tighter }, themeFonts.primary),
      displayLarge: addFontFamily({ ...BASE_TEXT_STYLES.displayLarge, letterSpacing: LETTER_SPACING.tighter }, themeFonts.primary),
      displayMedium: addFontFamily({ ...BASE_TEXT_STYLES.displayMedium, letterSpacing: LETTER_SPACING.tighter }, themeFonts.primary),
    };
  }
  
  return styles;
}

// Export a clean, consistent typography interface
const typography = {
  weights: FONT_WEIGHTS,
  sizes: FONT_SIZES,
  lineHeights: LINE_HEIGHTS,
  letterSpacing: LETTER_SPACING,
  createTextStyles,
  styles: createTextStyles('default'),
};

export default typography; 