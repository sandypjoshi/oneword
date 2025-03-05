import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';
import { textStyles } from '../../constants/theme/typography';

// Define additional props for our Text component
interface TextProps extends RNTextProps {
  variant?: keyof typeof textStyles;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  weight?: 'normal' | 'bold' | 'medium' | 'light';
}

/**
 * Text component that uses theme typography and colors
 * Provides a consistent text appearance throughout the app
 */
export const Text: React.FC<TextProps> = ({
  children,
  variant = 'bodyMedium',
  color,
  align,
  weight,
  style,
  ...props
}) => {
  // Access current theme
  const { theme } = useTheme();
  
  // Get the style for the specified variant
  const variantStyle = textStyles[variant];
  
  // Build style object based on props
  const textStyle = StyleSheet.create({
    text: {
      ...variantStyle,
      color: color ? color : theme.colors.textPrimary,
      textAlign: align,
      ...(weight && { fontWeight: weight }),
    },
  });

  return (
    <RNText style={[textStyle.text, style]} {...props}>
      {children}
    </RNText>
  );
};

// Preset variant components for common text styles
export const Heading1 = (props: Omit<TextProps, 'variant'>) => (
  <Text variant="heading1" {...props} />
);

export const Heading2 = (props: Omit<TextProps, 'variant'>) => (
  <Text variant="heading2" {...props} />
);

export const Heading3 = (props: Omit<TextProps, 'variant'>) => (
  <Text variant="heading3" {...props} />
);

export const BodyLarge = (props: Omit<TextProps, 'variant'>) => (
  <Text variant="bodyLarge" {...props} />
);

export const BodyMedium = (props: Omit<TextProps, 'variant'>) => (
  <Text variant="bodyMedium" {...props} />
);

export const BodySmall = (props: Omit<TextProps, 'variant'>) => (
  <Text variant="bodySmall" {...props} />
);

export const Label = (props: Omit<TextProps, 'variant'>) => (
  <Text variant="labelMedium" {...props} />
);

export const WordOfTheDay = (props: Omit<TextProps, 'variant'>) => (
  <Text variant="wordOfTheDay" {...props} />
);

export const Pronunciation = (props: Omit<TextProps, 'variant'>) => (
  <Text variant="pronunciation" {...props} />
);

export default Text; 