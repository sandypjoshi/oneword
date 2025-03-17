import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

// Use all the typography variants that are now defined
type TypographyVariant = 
  | 'display1' 
  | 'display2' 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'h4' 
  | 'body1' 
  | 'body2'
  | 'bodyLarge'
  | 'bodyEmphasis'
  | 'button'
  | 'buttonSmall'
  | 'caption'
  | 'label'
  | 'overline'
  | 'subtitle';

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  weight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
}

/**
 * Safe style creator that prevents undefined values
 * Ensures we never pass undefined to React Native style system
 */
const createSafeStyles = (
  props: {
    typography: any;
    colors: any;
    variant: TypographyVariant;
    color?: string;
    align?: TextProps['align'];
    weight?: TextProps['weight'];
  }
) => {
  // Create an empty style object that's safe to spread
  const safeStyle: Record<string, any> = {};
  
  try {
    // Safely extract base typography style
    const typographyStyle = props.typography?.styles || {};
    const variantStyle = typographyStyle[props.variant] || {};
    
    // Safely extract font size
    if (typeof variantStyle.fontSize === 'number') {
      safeStyle.fontSize = variantStyle.fontSize;
    }
    
    // Safely extract font weight
    if (variantStyle.fontWeight) {
      safeStyle.fontWeight = variantStyle.fontWeight;
    }
    
    // Safely extract line height
    if (typeof variantStyle.lineHeight === 'number') {
      safeStyle.lineHeight = variantStyle.lineHeight;
    }
    
    // Safely extract letter spacing
    if (typeof variantStyle.letterSpacing === 'number') {
      safeStyle.letterSpacing = variantStyle.letterSpacing;
    }
    
    // Safely extract font family
    if (variantStyle.fontFamily) {
      safeStyle.fontFamily = variantStyle.fontFamily;
    }
    
    // Safely extract text transform
    if (variantStyle.textTransform) {
      safeStyle.textTransform = variantStyle.textTransform;
    }
    
    // Safely extract font style
    if (variantStyle.fontStyle) {
      safeStyle.fontStyle = variantStyle.fontStyle;
    }
    
    // Apply color override or default
    if (props.color) {
      safeStyle.color = props.color;
    } else if (props.colors?.text?.primary) {
      safeStyle.color = props.colors.text.primary;
    }
    
    // Apply text alignment if specified
    if (props.align) {
      safeStyle.textAlign = props.align;
    }
    
    // Apply font weight override if specified
    if (props.weight) {
      safeStyle.fontWeight = props.weight;
    }
  } catch (error) {
    // Fallback to defaults if anything goes wrong
    console.warn('Error creating text styles:', error);
    
    // Apply minimal safe defaults
    safeStyle.fontSize = 16;
    safeStyle.color = '#000000';
  }
  
  return StyleSheet.create({ text: safeStyle }).text;
};

const Text: React.FC<TextProps> = ({
  children,
  style,
  variant = 'body1',
  color,
  align,
  weight,
  ...rest
}) => {
  // Get theme safely with defaults
  const theme = useTheme();
  const typography = theme?.typography || {};
  const colors = theme?.colors || {};
  
  // Create styles with maximum safety
  const safeTextStyle = React.useMemo(() => {
    return createSafeStyles({
      typography,
      colors,
      variant,
      color,
      align,
      weight,
    });
  }, [typography, colors, variant, color, align, weight]);

  return (
    <RNText 
      style={[safeTextStyle, style]} 
      {...rest}
    >
      {children}
    </RNText>
  );
};

export default Text; 