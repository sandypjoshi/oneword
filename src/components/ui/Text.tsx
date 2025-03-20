import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleProp, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { FontCategory } from '../../theme/typography';

// Use all the typography variants that are now defined
type TypographyVariant = 
  | 'displayLarge' 
  | 'displayMedium' 
  | 'displaySmall' 
  | 'serifTextLarge'
  | 'serifTextMedium'
  | 'serifTextSmall'
  | 'headingLarge' 
  | 'headingMedium' 
  | 'headingSmall' 
  | 'subheading' 
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'bodyEmphasized'
  | 'button'
  | 'buttonSmall'
  | 'caption'
  | 'label'
  | 'overline'
  | 'note'
  | 'subtitle';

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  weight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontCategory?: FontCategory;
  serif?: boolean; // Shorthand for setting fontCategory to 'display' or 'heading'
  italic?: boolean; // Shorthand for setting fontStyle to 'italic'
}

/**
 * Text component that uses the typography system
 * All text in the app should use this component
 */
const Text: React.FC<TextProps> = ({
  children,
  style,
  variant = 'bodyMedium',
  color,
  align,
  weight,
  fontCategory,
  serif = false,
  italic,
  ...rest
}) => {
  // Get theme safely with defaults
  const theme = useTheme();
  const typographyStyles = theme?.typography?.styles || {};
  const colors = theme?.colors || {};
  const fonts = theme?.typography?.fonts || {};
  
  // Get the variant style
  const variantStyle = typographyStyles[variant] || {};
  
  // Build the style object with the correct font styles
  const baseStyle: TextStyle = {
    ...variantStyle,
  };
  
  // Set text color
  if (color) {
    baseStyle.color = color;
  } else if (colors?.text?.primary) {
    baseStyle.color = colors.text.primary;
  }
  
  // Set text alignment
  if (align) {
    baseStyle.textAlign = align;
  }
  
  // Set explicit weight if provided
  if (weight) {
    baseStyle.fontWeight = weight;
  }
  
  // Check if this is a display variant
  const isDisplayVariant = variant.startsWith('display');
  const isHeadingVariant = variant.startsWith('heading');
  const isSerifTextVariant = variant.startsWith('serifText');
  
  // Handle font family based on variant and serif prop
  if (isSerifTextVariant) {
    // Serif text variants use DM Serif Text font but at larger sizes
    baseStyle.fontFamily = italic ? fonts.serifItalic : fonts.serif;
  } else if (serif || isDisplayVariant || isHeadingVariant) {
    if (isDisplayVariant) {
      // Display variants should use DM Serif Display font
      baseStyle.fontFamily = italic ? fonts.serifDisplayItalic : fonts.serifDisplay;
      
      // Ensure display variants are bold
      baseStyle.fontWeight = '700';
    } else {
      // Heading variants or serif prop use DM Serif Text
      baseStyle.fontFamily = italic ? fonts.serifItalic : fonts.serif;
    }
  } else {
    // Handle different weights for sans-serif fonts
    const fontWeight = baseStyle.fontWeight;
    
    if (fontWeight === 'bold' || fontWeight === '700') {
      baseStyle.fontFamily = italic ? fonts.systemBoldItalic : fonts.systemBold;
    } else if (fontWeight === '500') {
      baseStyle.fontFamily = italic ? fonts.systemMediumItalic : fonts.systemMedium;
    } else {
      baseStyle.fontFamily = italic ? fonts.systemItalic : fonts.system;
    }
  }

  // Create final style array with proper specificity order
  const finalStyle: StyleProp<TextStyle> = [baseStyle];
  
  // Add custom styles with higher priority
  if (style) {
    finalStyle.push(style);
  }

  return (
    <RNText 
      style={finalStyle}
      {...rest}
    >
      {children}
    </RNText>
  );
};

export default Text; 