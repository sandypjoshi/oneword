/**
 * ThemeProvider for the OneWord app
 * Provides theme values and theme switching functionality
 * Supports multiple themes, each with light and dark variants
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme, AppState, AppStateStatus } from 'react-native';
import themes from './colors';
import spacing from './spacing';
import typography from './typography';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme types
type ColorMode = 'light' | 'dark' | 'system';
type ThemeName = 'default' | 'quill' | 'aura';

// Interface for the theme context
type ThemeContextType = {
  colorMode: ColorMode;
  themeName: ThemeName;
  isDark: boolean;
  colors: typeof themes.default.light | typeof themes.default.dark;
  spacing: typeof spacing;
  typography: typeof typography.styles;
  setColorMode: (mode: ColorMode) => void;
  setThemeName: (name: ThemeName) => void;
};

// Storage keys
const STORAGE_KEYS = {
  COLOR_MODE: '@oneword:color_mode',
  THEME_NAME: '@oneword:theme_name',
};

// Default theme values
const defaultThemeValues: ThemeContextType = {
  colorMode: 'system',
  themeName: 'default',
  isDark: false,
  colors: themes.default.light,
  spacing: spacing,
  typography: typography.styles,
  setColorMode: () => {},
  setThemeName: () => {},
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
  defaultColorMode?: ColorMode;
  defaultThemeName?: ThemeName;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultColorMode = 'system',
  defaultThemeName = 'default',
}) => {
  // Get device color scheme
  const deviceColorScheme = useColorScheme();
  const [colorMode, setColorMode] = useState<ColorMode>(defaultColorMode);
  const [themeName, setThemeName] = useState<ThemeName>(defaultThemeName);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  
  // Load saved theme preferences on mount
  useEffect(() => {
    async function loadSavedTheme() {
      try {
        const savedColorMode = await AsyncStorage.getItem(STORAGE_KEYS.COLOR_MODE);
        const savedThemeName = await AsyncStorage.getItem(STORAGE_KEYS.THEME_NAME);
        
        if (savedColorMode) {
          setColorMode(savedColorMode as ColorMode);
        }
        
        if (savedThemeName) {
          setThemeName(savedThemeName as ThemeName);
        }
      } catch (error) {
        console.warn('Error loading saved theme preferences:', error);
      }
    }
    
    loadSavedTheme();
  }, []);
  
  // Save theme preferences when they change
  useEffect(() => {
    async function saveThemePreferences() {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.COLOR_MODE, colorMode);
        await AsyncStorage.setItem(STORAGE_KEYS.THEME_NAME, themeName);
      } catch (error) {
        console.warn('Error saving theme preferences:', error);
      }
    }
    
    saveThemePreferences();
  }, [colorMode, themeName]);
  
  // Determine if dark mode is active based on color mode and device settings
  const isDark = 
    colorMode === 'dark' || (colorMode === 'system' && deviceColorScheme === 'dark');
  
  // Get the appropriate theme set
  const themeSet = themes[themeName] || themes.default;
  
  // Get the appropriate color set based on light/dark mode
  const activeColors = isDark ? themeSet.dark : themeSet.light;
  
  // Get theme-specific typography
  const themeTypography = typography.createTextStyles(themeName);
  
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
    if (appState === 'active' && colorMode === 'system') {
      // Re-apply the current mode to force context update
      setColorMode(current => current);
    }
  }, [deviceColorScheme, appState, colorMode]);
  
  // Create theme context wrapper functions to persist preferences
  const handleSetColorMode = (mode: ColorMode) => {
    setColorMode(mode);
  };
  
  const handleSetThemeName = (name: ThemeName) => {
    setThemeName(name);
  };
  
  // Create the theme context value
  const themeContextValue: ThemeContextType = {
    colorMode,
    themeName,
    isDark,
    colors: activeColors,
    spacing: spacing,
    typography: themeTypography,
    setColorMode: handleSetColorMode,
    setThemeName: handleSetThemeName,
  };
  
  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 