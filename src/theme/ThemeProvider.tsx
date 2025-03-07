/**
 * ThemeProvider for the OneWord app
 * Provides theme values and theme switching functionality
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import theme, { colors } from './index';

// Theme types
type ThemeMode = 'light' | 'dark' | 'system';
type ThemeContextType = {
  mode: ThemeMode;
  isDark: boolean;
  colors: typeof colors.light | typeof colors.dark;
  spacing: typeof theme.spacing;
  typography: typeof theme.typography;
  setMode: (mode: ThemeMode) => void;
};

// Create theme context with defaults
const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  isDark: false,
  colors: colors.light,
  spacing: theme.spacing,
  typography: theme.typography,
  setMode: () => {},
});

// Hook for using theme throughout the app
export const useTheme = () => useContext(ThemeContext);

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
  
  // Determine if dark mode is active based on mode and device settings
  const isDark = 
    mode === 'dark' || (mode === 'system' && deviceColorScheme === 'dark');
  
  // Get the appropriate color set
  const activeColors = isDark ? colors.dark : colors.light;
  
  // Create the theme context value
  const themeContextValue: ThemeContextType = {
    mode,
    isDark,
    colors: activeColors,
    spacing: theme.spacing,
    typography: theme.typography,
    setMode,
  };
  
  // Update when device color scheme changes
  useEffect(() => {
    if (mode === 'system') {
      // No need to update state, just let the isDark calculation handle it
    }
  }, [deviceColorScheme, mode]);
  
  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 