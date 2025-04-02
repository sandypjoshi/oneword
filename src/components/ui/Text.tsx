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
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
}

const Text: React.FC<TextProps> = ({
  variant = 'bodyMedium', 
  color,
  align,
  weight,
  serif = false,
  italic,
  textTransform,
  style, 
  ...rest
}) => {
  const { colors, typography } = useTheme();
  const { fonts, styles: typographyStyles } = typography || {};

  const composedStyle = useMemo(() => {
    const variantStyle = typographyStyles?.[variant];
    
    const baseStyle: TextStyle = {
      ...(variantStyle || {}),
      textTransform: textTransform,
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
    } else if (variantStyle?.fontWeight) {
      baseStyle.fontWeight = variantStyle.fontWeight;
    }

    // Set font family: Prioritize variantStyle, then use serif prop as fallback decision
    if (!baseStyle.fontFamily) { // Only set if variantStyle didn't provide one
      baseStyle.fontFamily = serif 
        ? (fonts?.serif ?? 'serif') 
        : (fonts?.system ?? 'sans-serif');
    }

    // Set font style based on italic prop
    if (italic) {
      baseStyle.fontStyle = 'italic';
    }
    
    // Return the style array with custom styles at the end for higher priority
    return [baseStyle, style] as StyleProp<TextStyle>;
  }, [variant, typographyStyles, color, align, weight, serif, italic, textTransform, colors, fonts, style]);

  return (
    <RNText 
      style={composedStyle} 
      {...rest}
    />
  );
};

export default Text;