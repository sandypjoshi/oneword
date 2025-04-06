import React, { useMemo } from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleProp, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { TypographyVariant, FONT_FAMILIES } from '../../theme/typography';

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  weight?: TextStyle['fontWeight']; // Use RN fontWeight type
  serif?: boolean;
  italic?: boolean;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
}

// Helper to map weight input to standardized weights used for font family selection
const getResolvedWeight = (weight?: TextStyle['fontWeight']): '400' | '500' | '700' => {
  // Map various inputs to standard weights
  if (
    weight === 'bold' ||
    weight === '700' ||
    weight === '800' ||
    weight === '900' ||
    weight === 700 ||
    weight === 800 ||
    weight === 900
  ) return '700';

  if (
    weight === '500' ||
    weight === '600' || // Treat 600 as medium for simplicity if no specific font
    weight === 500 ||
    weight === 600 ||
    weight === 'medium' || // Expo font might use this string
    weight === 'semibold' // Treat semibold as medium
  ) return '500';

  // Default to normal/400 for 'normal', '400', '100', '200', '300', etc.
  return '400';
};

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
  const { styles: typographyStyles } = typography || {};
  const fonts = FONT_FAMILIES;

  const composedStyle = useMemo(() => {
    const flatStyle = style ? StyleSheet.flatten(style) : {};
    const variantStyle = typographyStyles?.[variant] || {};

    // Determine final weight & italic style
    const finalWeightProp: TextStyle['fontWeight'] = flatStyle.fontWeight || weight || variantStyle.fontWeight;
    const resolvedWeight = getResolvedWeight(finalWeightProp);
    const finalItalic = flatStyle.fontStyle === 'italic' || italic || variantStyle.fontStyle === 'italic';

    // Select Font Family
    let selectedFontFamily: string | undefined;
    if (fonts) {
      if (serif) {
         selectedFontFamily = finalItalic ? fonts.serifItalic : fonts.serif;
      } else { // Sans-serif
        if (resolvedWeight === '700') {
          selectedFontFamily = finalItalic ? fonts.systemBoldItalic : fonts.systemBold;
        } else if (resolvedWeight === '500') {
          selectedFontFamily = finalItalic ? fonts.systemMediumItalic : fonts.systemMedium;
        } else { // 400
          selectedFontFamily = finalItalic ? fonts.systemItalic : fonts.system;
        }
      }
    }
    selectedFontFamily = selectedFontFamily ?? (serif ? 'serif' : 'sans-serif');

    // **Streamlined Style Combination**
    const combinedStyle: TextStyle = {
      // 1. Start with base variant styles
      ...variantStyle,

      // 2. Apply flattened styles (excluding font-related ones)
      ...(({ fontWeight: _fw, fontStyle: _fs, fontFamily: _ff, ...restFlatStyle }) => restFlatStyle)(flatStyle),

      // 3. Apply calculated font properties (will override variant/flatStyle)
      fontFamily: selectedFontFamily,
      fontWeight: resolvedWeight !== '400' ? resolvedWeight : undefined,
      fontStyle: finalItalic ? 'italic' : 'normal',

      // 4. Apply specific prop overrides if they exist (will override everything before)
      ...(color !== undefined && { color }),
      ...(align !== undefined && { textAlign: align }),
      ...(textTransform !== undefined && { textTransform }),
    };

    return combinedStyle;

  }, [variant, typographyStyles, color, align, weight, serif, italic, textTransform, colors, fonts, style]);

  // Filter out undefined/null values before passing to RNText
  const finalStyle = Object.entries(composedStyle).reduce((acc, [key, value]) => {
     if (value !== undefined && value !== null) {
       acc[key as keyof TextStyle] = value;
     }
     return acc;
   }, {} as TextStyle);

  return (
    <RNText
      style={finalStyle}
      allowFontScaling={rest.allowFontScaling ?? false}
      {...rest}
    />
  );
};

export default Text;