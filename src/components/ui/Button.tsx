import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = ({ 
  title, 
  variant = 'primary', 
  style, 
  loading = false,
  fullWidth = false,
  disabled = false,
  ...props 
}: ButtonProps) => {
  const { colors } = useTheme();
  
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

  return (
    <TouchableOpacity 
      style={[
        styles.button,
        buttonStyles[variant],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style
      ]} 
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' ? colors.primary : colors.text.inverse} 
        />
      ) : (
        <Text style={[styles.text, textStyles[variant], disabled && styles.disabledText]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 100, // Pill shape
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.8,
  },
});

export default Button; 