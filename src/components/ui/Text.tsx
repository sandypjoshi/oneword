import React, { useMemo } from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

// Use only the typography variants that are actually defined
type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body1' | 'body2' | 'caption' | 'button' | 'label';

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  weight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
}

const Text = ({
  children,
  style,
  variant = 'body1',
  color,
  align,
  weight,
  ...rest
}: TextProps) => {
  const { typography, colors } = useTheme();
  
  // Create styles once per unique combination of props
  const textStyles = useMemo(() => {
    return StyleSheet.create({
      text: {
        ...(typography.styles[variant]),
        color: color || colors.text.primary,
        textAlign: align,
        fontWeight: weight,
      },
    });
  }, [typography.styles, variant, color, colors.text.primary, align, weight]);

  return (
    <RNText style={[textStyles.text, style]} {...rest}>
      {children}
    </RNText>
  );
};

export default Text; 