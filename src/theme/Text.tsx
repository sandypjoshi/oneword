/**
 * Themed Text component for OneWord app
 * Applies typography styles and theme colors automatically
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';

// Available variants based on typography styles
type TextVariant = 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'h4' 
  | 'body1' 
  | 'body2' 
  | 'button' 
  | 'caption'
  | 'label';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body1',
  style,
  color,
  align,
  ...props
}) => {
  const { colors, typography } = useTheme();
  
  // Get typography style for the selected variant
  const variantStyle = typography.styles[variant];
  
  // Default to primary text color if no color specified
  const textColor = color || colors.text.primary;
  
  return (
    <RNText
      style={[
        variantStyle,
        { color: textColor },
        align && { textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

export default Text; 