import React from 'react';
import { View, ViewProps, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useTheme } from './ThemeProvider';

// Define Container props
interface ContainerProps extends ViewProps {
  children: React.ReactNode;
  useSafeArea?: boolean;
  padded?: boolean;
  center?: boolean;
  flex?: boolean | number;
  backgroundColor?: string;
}

/**
 * Container component for consistent screen layouts
 * Handles safe areas, padding, and theme-based styling
 */
export const Container: React.FC<ContainerProps> = ({
  children,
  useSafeArea = true,
  padded = true,
  center = false,
  flex = true,
  backgroundColor,
  style,
  ...props
}) => {
  // Access current theme
  const { theme, isDark } = useTheme();
  
  // Create container styles based on props
  const containerStyles = StyleSheet.create({
    container: {
      backgroundColor: backgroundColor || theme.colors.background,
      ...(flex && { flex: typeof flex === 'number' ? flex : 1 }),
      ...(padded && {
        paddingHorizontal: theme.spacing.layout.screenPaddingHorizontal,
        paddingVertical: theme.spacing.layout.screenPaddingVertical,
      }),
      ...(center && {
        justifyContent: 'center',
        alignItems: 'center',
      }),
    },
  });

  // Render with or without SafeAreaView based on props
  if (useSafeArea) {
    return (
      <SafeAreaView style={[containerStyles.container, style]} {...props}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundColor || theme.colors.background}
        />
        {children}
      </SafeAreaView>
    );
  }

  return (
    <View style={[containerStyles.container, style]} {...props}>
      {children}
    </View>
  );
};

export default Container; 