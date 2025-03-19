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
  
  // Override font weight if specified
  if (weight) {
    baseStyle.fontWeight = weight;
  }
  
  // Add serif font when requested
  // We'll use the appropriate serif variant based on text size
  if (serif) {
    // Add the serif font to the text based on text size
    const typographyObj = theme.typography as any;
    
    if (typographyObj?.fonts) {
      // For display variants, use serif display
      if (variant.startsWith('display')) {
        baseStyle.fontFamily = typographyObj.fonts.serifDisplay;
      } 
      // For small text, use serif small
      else if (variant === 'caption' || variant === 'note' || variant === 'overline') {
        baseStyle.fontFamily = typographyObj.fonts.serifSmall;
      }
      // For everything else, use standard serif
      else {
        baseStyle.fontFamily = typographyObj.fonts.serif;
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