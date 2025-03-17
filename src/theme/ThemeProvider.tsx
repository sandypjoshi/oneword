/**
 * ThemeProvider for the OneWord app
 * Provides theme values and theme switching functionality
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme, AppState, AppStateStatus } from 'react-native';
import colors from './colors';
import spacing from './spacing';
import typography from './typography';

// Theme types
type ThemeMode = 'light' | 'dark' | 'system';
type ThemeContextType = {
  mode: ThemeMode;
  isDark: boolean;
  colors: typeof colors.light | typeof colors.dark;
  spacing: typeof spacing;
  typography: typeof typography;
  setMode: (mode: ThemeMode) => void;
};

// Default theme values
const defaultThemeValues = {
  mode: 'system' as ThemeMode,
  isDark: false,
  colors: colors.light,
  spacing: spacing,
  typography: typography,
  setMode: () => {},
};

// Create theme context with defaults
const ThemeContext = createContext<ThemeContextType>(defaultThemeValues);

// Hook for using theme throughout the app with safety check
export const useTheme = () => {
  const theme = useContext(ThemeContext);
  
  // If theme is undefined, return default values to avoid crashes
  if (!theme) {
    console.warn('useTheme must be used within a ThemeProvider');
    return defaultThemeValues;
  }
  
  return theme;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
}) => {
  // Get device color scheme
  const deviceColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(defaultTheme);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  
  // Determine if dark mode is active based on mode and device settings
  const isDark = 
    mode === 'dark' || (mode === 'system' && deviceColorScheme === 'dark');
  
  // Get the appropriate color set
  const activeColors = isDark ? colors.dark : colors.light;
  
  // Listen for app state changes to detect theme changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);
  
  // Update when device color scheme changes or when app comes to foreground
  useEffect(() => {
    // Force re-render when app comes back to active state
    // This ensures we capture any system theme changes that happened while the app was in background
    if (appState === 'active' && mode === 'system') {
      // Re-apply the current mode to force context update
      setMode(current => current);
    }
  }, [deviceColorScheme, appState, mode]);
  
  // Create the theme context value
  const themeContextValue: ThemeContextType = {
    mode,
    isDark,
    colors: activeColors,
    spacing: spacing,
    typography: typography,
    setMode,
  };
  
  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 