/**
 * Box component for themed layouts
 * A wrapper around View with theme-aware styling
 */

import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';

interface BoxProps extends ViewProps {
  flex?: number;
  padding?: keyof typeof spacingValues | number;
  paddingHorizontal?: keyof typeof spacingValues | number;
  paddingVertical?: keyof typeof spacingValues | number;
  margin?: keyof typeof spacingValues | number;
  marginHorizontal?: keyof typeof spacingValues | number;
  marginVertical?: keyof typeof spacingValues | number;
  marginTop?: keyof typeof spacingValues | number;
  marginBottom?: keyof typeof spacingValues | number;
  marginLeft?: keyof typeof spacingValues | number;
  marginRight?: keyof typeof spacingValues | number;
  bg?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  center?: boolean;
}

// Map spacing key names to values
const spacingValues = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Helper to get spacing value from key or number
const getSpacing = (value: keyof typeof spacingValues | number | undefined) => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  return spacingValues[value];
};

export const Box: React.FC<BoxProps> = ({
  children,
  style,
  flex,
  padding,
  paddingHorizontal,
  paddingVertical,
  margin,
  marginHorizontal,
  marginVertical,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  bg,
  borderColor,
  borderWidth,
  borderRadius,
  center,
  ...props
}) => {
  const { colors } = useTheme();
  
  return (
    <View
      style={[
        flex !== undefined && { flex },
        padding !== undefined && { padding: getSpacing(padding) },
        paddingHorizontal !== undefined && { paddingHorizontal: getSpacing(paddingHorizontal) },
        paddingVertical !== undefined && { paddingVertical: getSpacing(paddingVertical) },
        margin !== undefined && { margin: getSpacing(margin) },
        marginHorizontal !== undefined && { marginHorizontal: getSpacing(marginHorizontal) },
        marginVertical !== undefined && { marginVertical: getSpacing(marginVertical) },
        marginTop !== undefined && { marginTop: getSpacing(marginTop) },
        marginBottom !== undefined && { marginBottom: getSpacing(marginBottom) },
        marginLeft !== undefined && { marginLeft: getSpacing(marginLeft) },
        marginRight !== undefined && { marginRight: getSpacing(marginRight) },
        bg && { backgroundColor: bg },
        borderColor && { borderColor },
        borderWidth !== undefined && { borderWidth },
        borderRadius !== undefined && { borderRadius },
        center && styles.center,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Box; 