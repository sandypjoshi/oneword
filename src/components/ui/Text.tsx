import React, { useMemo } from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { TypographyVariant } from '../../theme/typography';

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  weight?: 'normal' | 'bold' | '400' | '500' | '700';
  serif?: boolean; 
  italic?: boolean;
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
  serif = false,
  italic,
  ...rest
}) => {
  // Get theme colors, fonts and responsive typography
  const { colors, typography: { fonts }, responsiveTypography } = useTheme();
  
  // Get the base variant style from responsive typography
  const variantStyle = responsiveTypography[variant];
  
  // Memoize the composed style to prevent unnecessary style object creation
  const composedStyle = useMemo(() => {
    const baseStyle: TextStyle = {
      ...(variantStyle || {}),
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
    
    // Return the style array with custom styles at the end for higher priority
    return [baseStyle, style] as StyleProp<TextStyle>;
  }, [variant, variantStyle, color, align, weight, serif, italic, colors, fonts, style]);

  return (
    <RNText 
      style={composedStyle}
      {...rest}
    >
      {children}
    </RNText>
  );
};

export default Text; 