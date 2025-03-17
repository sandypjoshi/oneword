import React from 'react';
import { TouchableOpacity, StyleSheet, TouchableOpacityProps, ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import Text from './Text';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const Button = ({ 
  title, 
  variant = 'primary', 
  style, 
  loading = false,
  fullWidth = false,
  disabled = false,
  size = 'medium',
  ...props 
}: ButtonProps) => {
  const { colors, spacing } = useTheme();
  
  // Generate button styles based on variant and theme
  const buttonStyles = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primaryLight,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
    },
  };
  
  // Generate text styles based on variant and theme
  const textStyles = {
    primary: {
      color: colors.text.inverse,
    },
    secondary: {
      color: colors.text.inverse,
    },
    outline: {
      color: colors.primary,
    },
  };
  
  // Text variant based on button size
  const textVariant = size === 'small' ? 'buttonSmall' : 'button';
  
  // Padding based on button size
  const buttonPadding = {
    small: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    medium: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    large: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
    },
  };

  return (
    <TouchableOpacity 
      style={[
        styles.button,
        buttonStyles[variant],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        buttonPadding[size],
        style
      ]}
      disabled={disabled || loading}
      {...props}
    >
      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'outline' ? colors.primary : '#fff'} 
          />
        ) : (
          <Text 
            variant={textVariant}
            style={[textStyles[variant]]}
          >
            {title}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 100, // Pill shape as in original
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200, // Restore original minimum width
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default Button; 