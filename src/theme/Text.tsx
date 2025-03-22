/**
 * @deprecated Use the main Text component from src/components/ui/Text.tsx instead
 * This component is kept for backward compatibility but will be removed in future versions.
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';
import { TypographyVariant } from './typography';

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

/**
 * @deprecated Use the Text component from src/components/ui/Text.tsx instead
 */
export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body1',
  style,
  color,
  align,
  ...props
}) => {
  const { colors, responsiveTypography } = useTheme();
  
  // Map old variant names to new ones
  const variantMap: Record<TextVariant, TypographyVariant> = {
    h1: 'headingLarge',
    h2: 'headingMedium',
    h3: 'headingSmall',
    h4: 'subheading',
    body1: 'bodyLarge',
    body2: 'bodyMedium',
    button: 'button',
    caption: 'caption',
    label: 'label'
  };
  
  // Get typography style for the selected variant
  const mappedVariant = variantMap[variant];
  const variantStyle = responsiveTypography[mappedVariant];
  
  // Default to primary text color if no color specified
  const textColor = color || colors.text.primary;
  
  console.warn(
    `Warning: You are using a deprecated Text component from theme/Text. 
     Please update to import { Text } from 'components/ui' instead.`
  );
  
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