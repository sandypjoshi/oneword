import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, applyElevation, ElevationLevel } from '../../theme/styleUtils';

export interface CardProps extends ViewProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  children: React.ReactNode;
  elevation?: ElevationLevel;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  style,
  elevation = 'md',
  ...props
}) => {
  const { colors } = useTheme();

  const cardStyles = {
    elevated: {
      backgroundColor: colors.background.card,
      ...applyElevation(elevation, colors.text.primary),
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
    <View style={[styles.card, cardStyles[variant], style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
});

export default Card;
