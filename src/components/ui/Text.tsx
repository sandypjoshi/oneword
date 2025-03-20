import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { FontCategory } from '../../theme/typography';

// Use all the typography variants that are now defined
type TypographyVariant = 
  | 'displayLarge' 
  | 'displayMedium' 
  | 'displaySmall' 
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
  serif,
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
  
  // Build the style object in the correct order of specificity
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
  
  // Set italic text if specified
  if (italic) {
    // Use the proper italic font family instead of just fontStyle
    if (serif) {
      if (variant.startsWith('display')) {
        baseStyle.fontFamily = theme.typography.fonts.serifDisplayItalic;
      } else {
        baseStyle.fontFamily = theme.typography.fonts.serifItalic;
      }
    } else {
      // Handle different weights for sans-serif
      if (weight === 'bold' || weight === '700') {
        baseStyle.fontFamily = theme.typography.fonts.systemBoldItalic;
      } else if (weight === '500') {
        baseStyle.fontFamily = theme.typography.fonts.systemMediumItalic;
      } else {
        baseStyle.fontFamily = theme.typography.fonts.systemItalic;
      }
    }
  } else {
    // Add serif font when requested
    // We'll use the appropriate serif variant based on text size
    if (serif) {
      // Add the serif font to the text based on text size
      if (variant.startsWith('display')) {
        baseStyle.fontFamily = theme.typography.fonts.serifDisplay;
      } else {
        baseStyle.fontFamily = theme.typography.fonts.serif;
      }
    } else {
      // Handle different weights for sans-serif
      if (weight === 'bold' || weight === '700') {
        baseStyle.fontFamily = theme.typography.fonts.systemBold;
      } else if (weight === '500') {
        baseStyle.fontFamily = theme.typography.fonts.systemMedium;
      } else {
        // Regular weight
        baseStyle.fontFamily = theme.typography.fonts.system;
      }
    }
  }

  // Force a style array to help React Native properly apply all styles
  const finalStyle: StyleProp<TextStyle> = [baseStyle];
  
  // Add any custom styles with higher priority
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