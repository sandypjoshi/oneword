import { useMemo } from 'react';
import { TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { TypographyVariant } from '../theme/typography';

/**
 * Hook that provides responsive text styles for a specific variant
 * This is a simplified wrapper for accessing responsive typography
 */
export default function useResponsiveText(
  variant: TypographyVariant,
  customStyle?: StyleProp<TextStyle>
): TextStyle {
  const { responsiveTypography, fontScale } = useTheme();
  
  // Memoize the final style to prevent unnecessary object creation
  return useMemo(() => {
    // Get the responsive style for this variant
    const baseStyle = responsiveTypography[variant] || {};
    
    // If no custom style, just return the base style
    if (!customStyle) {
      return baseStyle;
    }
    
    // Return a combined style with the custom style taking precedence
    return { ...baseStyle, ...(customStyle as any) };
  }, [variant, responsiveTypography, customStyle, fontScale]);
} 