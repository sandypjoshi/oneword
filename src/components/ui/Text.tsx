import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

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
  ...rest
}) => {
  // Get theme safely with defaults
  const theme = useTheme();
  const typographyStyles = theme?.typography || {};
  const colors = theme?.colors || {};
  
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