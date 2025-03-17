import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface CardProps extends ViewProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'elevated', 
  style, 
  ...props 
}) => {
  const { colors } = useTheme();
  
  const cardStyles = {
    elevated: {
      backgroundColor: colors.background.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    outlined: {
      backgroundColor: colors.background.card,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    filled: {
      backgroundColor: colors.background.secondary,
    },
  };
  
  return (
    <View 
      style={[
        styles.card, 
        cardStyles[variant], 
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    margin: 8,
  },
});

export default Card; 