/**
 * Typography styles for the OneWord app
 */

import { TextStyle, Platform } from 'react-native';

type FontWeight = TextStyle['fontWeight'];
type ThemeName = 'default' | 'quill' | 'aura';
export type FontCategory = 'display' | 'heading' | 'body' | 'utility';

// Platform-specific font families - Keep it simple and stable
const FONT_FAMILIES = {
  // Sans-serif options
  system: Platform.select({
    ios: 'System',  // System font (San Francisco) on iOS
    android: 'Roboto',
    default: undefined, // Using undefined allows React Native to pick platform default
  }),
  // Serif options
  serif: Platform.select({
    // Proper naming for New York font on iOS with scaling support
    ios: 'New York Medium',  // Medium weight for primary content
    android: 'Noto Serif, serif', // Try Noto Serif first, fall back to generic serif
    default: 'serif',
  }),
  // Serif display (for larger headlines)
  serifDisplay: Platform.select({
    ios: 'New York Large', // Optimized for display sizes
    android: 'Noto Serif, serif',
    default: 'serif',
  }),
  // Serif small (for smaller text)
  serifSmall: Platform.select({
    ios: 'New York Small', // Optimized for smaller sizes
    android: 'Noto Serif, serif',
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
    category: 'display' as FontCategory,
  },
  displayMedium: {
    fontSize: FONT_SIZES.display, 
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES.display * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.tighter,
    category: 'display' as FontCategory,
  },
  displaySmall: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES.xxxl * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.tight,
    category: 'display' as FontCategory,
  },
  
  // Heading styles - Enhanced with more distinction
  headingLarge: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES.xxxl * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.tight,
    category: 'heading' as FontCategory,
  },
  headingMedium: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES.xxl * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.tight,
    category: 'heading' as FontCategory,
  },
  headingSmall: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.xl * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.normal,
    category: 'heading' as FontCategory,
  },
  subheading: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.normal,
    category: 'heading' as FontCategory,
  },
  
  // Body text styles - With semantic naming
  bodyLarge: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
    category: 'body' as FontCategory,
  },
  bodyMedium: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
    category: 'body' as FontCategory,
  },
  bodySmall: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
    category: 'body' as FontCategory,
  },
  bodyEmphasized: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
    category: 'body' as FontCategory,
  },
  
  // Utility text styles with semantic names
  button: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.wide,
    category: 'utility' as FontCategory,
  },
  buttonSmall: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.wide,
    category: 'utility' as FontCategory,
  },
  caption: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.xs * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
    category: 'utility' as FontCategory,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
    category: 'utility' as FontCategory,
  },
  overline: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: FONT_SIZES.xs * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.wider,
    textTransform: 'uppercase' as const,
    category: 'utility' as FontCategory,
  },
  note: {
    fontSize: FONT_SIZES.xxs,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.xxs * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
    category: 'utility' as FontCategory,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
    fontStyle: 'italic' as const,
    category: 'body' as FontCategory,
  },
};

// This is a type-safe way to create text styles for each theme
interface FontPairing {
  display: string | undefined;
  heading: string | undefined;
  body: string | undefined;
  utility: string | undefined;
}

// Define font pairings for each theme
const THEME_FONTS: Record<ThemeName, FontPairing> = {
  default: {
    display: FONT_FAMILIES.system,
    heading: FONT_FAMILIES.system,
    body: FONT_FAMILIES.system,
    utility: FONT_FAMILIES.system,
  },
  quill: {
    display: FONT_FAMILIES.serifDisplay, // Large variant for display text
    heading: FONT_FAMILIES.serif,        // Medium variant for headings
    body: FONT_FAMILIES.system,
    utility: FONT_FAMILIES.system,
  },
  aura: {
    display: FONT_FAMILIES.serifDisplay, // Large variant for display text
    heading: FONT_FAMILIES.system,
    body: FONT_FAMILIES.system,
    utility: FONT_FAMILIES.system,
  },
};

// Create a derived style with font family based on category
function addFontFamily<T extends Record<string, any>>(
  style: T, 
  fontPairing: FontPairing
): T {
  // If no category or no font defined, return style as is
  if (!style.category || !fontPairing[style.category as FontCategory]) {
    return { ...style };
  }
  
  // Create a new style object without the category
  const { category, ...styleWithoutCategory } = style;
  
  // Return final style with font family based on the style's category
  return {
    ...styleWithoutCategory,
    fontFamily: fontPairing[category as FontCategory],
  } as unknown as T;
}

// Create the final text styles for a specific theme
function createTextStyles(themeName: ThemeName = 'default'): Record<string, TextStyle> {
  // Get the appropriate font pairing for this theme
  const fontPairing = THEME_FONTS[themeName] || THEME_FONTS.default;
  
  // Create styles with theme-specific fonts
  const styles = Object.entries(BASE_TEXT_STYLES).reduce((acc, [name, style]) => {
    acc[name] = addFontFamily(style, fontPairing);
    return acc;
  }, {} as Record<string, TextStyle>);
  
  // Apply theme-specific overrides
  if (themeName === 'quill') {
    // Serif fonts often need different letter spacing
    styles.displayLarge = { 
      ...styles.displayLarge, 
      letterSpacing: LETTER_SPACING.tighter 
    };
    styles.displayMedium = { 
      ...styles.displayMedium, 
      letterSpacing: LETTER_SPACING.tighter 
    };
    styles.headingLarge = { 
      ...styles.headingLarge, 
      letterSpacing: LETTER_SPACING.tighter 
    };
    styles.headingMedium = { 
      ...styles.headingMedium, 
      letterSpacing: LETTER_SPACING.tighter 
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
  fonts: FONT_FAMILIES,
  createTextStyles,
  styles: createTextStyles('default'),
};

export default typography; 