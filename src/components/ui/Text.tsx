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
    // Prioritize italic prop/style over variant's default
    const finalItalic = flatStyle.fontStyle === 'italic' || italic || variantStyle.fontStyle === 'italic'; 

    // **Font Family Selection Logic V3**
    
    // 1. Determine base family type (sans or serif)
    let baseFamilyType: 'serif' | 'sans-serif' = 'sans-serif';
    if (variantStyle.fontFamily) {
      // Infer type from variant's resolved family name
      if (variantStyle.fontFamily.toLowerCase().includes('serif')) {
          baseFamilyType = 'serif';
      }
    } else {
      // Fallback to serif prop if variant didn't provide family
      baseFamilyType = serif ? 'serif' : 'sans-serif';
    }

    // 2. Select specific font file based on type, weight, and FINAL italic style
    let selectedFontFamily: string | undefined;
    let hasSpecificFamily = false;
    if (fonts) {
      if (baseFamilyType === 'serif') {
        // Check if it's DMSerifDisplay or DMSerifText based on variant name (heuristic)
        if (variant?.toLowerCase().includes('display')) {
             selectedFontFamily = finalItalic ? fonts.serifDisplayItalic : fonts.serifDisplay;
        } else {
             // Default to DMSerifText for other serif variants
             selectedFontFamily = finalItalic ? fonts.serifItalic : fonts.serif;
        }
      } else { // Sans-serif (DM Sans)
        if (resolvedWeight === '700') {
            selectedFontFamily = finalItalic ? fonts.systemBoldItalic : fonts.systemBold;
        } else if (resolvedWeight === '500') {
            selectedFontFamily = finalItalic ? fonts.systemMediumItalic : fonts.systemMedium;
        } else { // 400
            selectedFontFamily = finalItalic ? fonts.systemItalic : fonts.system;
        }
      }

      // Check if the final selected family is one of our specific loaded fonts
      if (selectedFontFamily && Object.values(fonts).includes(selectedFontFamily)) {
          hasSpecificFamily = true;
      }
    }
    // Fallback to generic system fonts
    selectedFontFamily = selectedFontFamily ?? (baseFamilyType === 'serif' ? 'serif' : 'sans-serif');


    // Style Combination
    const combinedStyle: TextStyle = {
      // 1. Start with base variant styles
      ...variantStyle,
      // 2. Apply flattened styles (excluding font-related ones)
      ...(({ fontWeight: _fw, fontStyle: _fs, fontFamily: _ff, ...restFlatStyle }) => restFlatStyle)(flatStyle),
      // 3. Apply explicit prop overrides for non-font styles
      color: color !== undefined ? color : colors.text.primary,
      ...(align !== undefined && { textAlign: align }),
      ...(textTransform !== undefined && { textTransform }),
      // 4. Apply calculated font family (Highest Priority)
      fontFamily: selectedFontFamily,
      // 5. Remove fontWeight/fontStyle if specific family was set
      fontWeight: hasSpecificFamily ? undefined : (flatStyle.fontWeight || variantStyle.fontWeight),
      fontStyle: hasSpecificFamily ? undefined : (finalItalic ? 'italic' : 'normal'),
    };
    
    // Explicitly re-apply italic if needed and specific family was chosen
    if (hasSpecificFamily && finalItalic) {
        combinedStyle.fontStyle = 'italic';
    }

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