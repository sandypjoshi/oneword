import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

const Button = ({ 
  title, 
  variant = 'primary', 
  style, 
  ...props 
}: ButtonProps) => {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        styles[variant], 
        style
      ]} 
      {...props}
    >
      <Text style={[styles.text, variant === 'outline' && styles.outlineText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#3498db',
  },
  secondary: {
    backgroundColor: '#2ecc71',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  text: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  outlineText: {
    color: '#3498db',
  },
});

export default Button; 