/**
 * ThemeProvider for the OneWord app
 * Provides theme values and theme switching functionality
 * Supports multiple themes, each with light and dark variants
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useColorScheme, AppState, AppStateStatus, useWindowDimensions, TextStyle, View, Animated } from 'react-native';
import themes from './colors';
import spacing from './spacing';
import typography, { TypographyVariant, BASE_TEXT_STYLES } from './typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { invalidateMeshCache } from '../utils/meshGradientGenerator';

// Theme types
type ColorMode = 'light' | 'dark' | 'system';
type ThemeName = 'default' | 'quill';

// Define the expanded theme type with responsive typography
export type ThemeContextType = {
  colors: typeof themes.default.light;
  spacing: typeof spacing;
  typography: {
    styles: Record<string, TextStyle>;
    fonts: typeof typography.fonts;
    createTextStyles: typeof typography.createTextStyles;
  };
  // Add responsive typography styles
  responsiveTypography: Record<TypographyVariant, TextStyle>;
  // Add scale factor for custom components
  fontScale: number;
  // Add the rest of the existing theme context
  themeLoaded: boolean;
  colorMode: ColorMode;
  themeName: ThemeName;
  effectiveColorMode: 'light' | 'dark'; // Added to provide single source of truth
  setColorMode: (mode: ColorMode) => void;
  setThemeName: (theme: ThemeName) => void;
};

// Storage keys
const STORAGE_KEYS = {
  COLOR_MODE: '@oneword:color_mode',
  THEME_NAME: '@oneword:theme_name',
};

// Debounce utility function
const debounce = <F extends (...args: any[]) => any>(func: F, wait: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<F>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Default theme values
const defaultThemeValues: ThemeContextType = {
  colors: themes.default.light,
  spacing,
  typography: {
    styles: typography.styles,
    fonts: typography.fonts,
    createTextStyles: typography.createTextStyles,
  },
  responsiveTypography: {} as Record<TypographyVariant, TextStyle>,
  fontScale: 1,
  themeLoaded: false,
  colorMode: 'system',
  themeName: 'default',
  effectiveColorMode: 'light',
  setColorMode: () => {},
  setThemeName: () => {},
};

// Update context with default values for responsive typography
export const ThemeContext = createContext<ThemeContextType>(defaultThemeValues);

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
  const isThemeChangingRef = useRef(false);
  
  // Get device dimensions for responsive typography
  const { width } = useWindowDimensions();
  
  // Calculate font scale based on device width (optimized for phones/tablets)
  // Base design is for iPhone 8 (375px width)
  // Cap scale for tablets to avoid excessively large text
  const calculateFontScale = useCallback(() => {
    // For phones (width under 600px), scale linearly
    if (width < 600) {
      return Math.max(0.85, Math.min(width / 375, 1.1));
    }
    // For tablets, use a more modest scaling
    return Math.min(1.15, width / 768);
  }, [width]);
  
  const fontScale = calculateFontScale();
  
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
  
  // Centralize effective color mode determination - single source of truth
  const effectiveColorMode = useMemo((): 'light' | 'dark' => {
    return colorMode === 'system' 
      ? deviceColorScheme === 'dark' ? 'dark' : 'light'
      : colorMode;
  }, [colorMode, deviceColorScheme]);
  
  // Get the appropriate theme set
  const themeSet = themes[themeName] || themes.default;
  
  // Get the appropriate color set based on light/dark mode
  const activeColors = effectiveColorMode === 'dark' ? themeSet.dark : themeSet.light;
  
  // Get theme-specific typography
  const themeTypography = typography.createTextStyles(themeName);
  
  // Debounced app state change handler to prevent rapid theme changes
  const debouncedAppStateChange = useCallback(
    debounce((nextAppState: AppStateStatus) => {
      setAppState(nextAppState);
    }, 100),
    []
  );
  
  // Listen for app state changes to detect theme changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', debouncedAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [debouncedAppStateChange]);
  
  // Track the previous effective color mode to detect actual changes
  const prevEffectiveColorMode = useRef<'light' | 'dark' | null>(null);
  
  // Update when device color scheme changes or when app comes to foreground
  useEffect(() => {
    // Only trigger updates when there's an actual change in the effective color mode
    if (appState === 'active' && 
        colorMode === 'system' && 
        prevEffectiveColorMode.current !== effectiveColorMode) {
        
      // Batch visual updates with mesh cache invalidation
      if (!isThemeChangingRef.current) {
        // Schedule mesh cache invalidation after render
        requestAnimationFrame(() => {
          invalidateMeshCache();
        });
      }
      
      // Update previous value
      prevEffectiveColorMode.current = effectiveColorMode;
    }
  }, [effectiveColorMode, appState, colorMode]);
  
  // Add state for theme transition
  const [isThemeChanging, setIsThemeChanging] = useState(false);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  
  // Modify the theme context wrapper functions to include transition
  const handleSetColorMode = (mode: ColorMode) => {
    // Prevent multiple transitions at once
    if (isThemeChanging || isThemeChangingRef.current) return;
    
    setIsThemeChanging(true);
    isThemeChangingRef.current = true;
    
    // First do the visual transition
    Animated.timing(fadeAnim, {
      toValue: 0.15,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      // Change actual theme values during the transition
      setColorMode(mode);
      
      // Schedule mesh cache invalidation AFTER theme is updated
      requestAnimationFrame(() => {
        invalidateMeshCache();
        
        // Complete the transition
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setIsThemeChanging(false);
          isThemeChangingRef.current = false;
        });
      });
    });
  };
  
  const handleSetThemeName = (name: ThemeName) => {
    // Prevent multiple transitions at once
    if (isThemeChanging || isThemeChangingRef.current) return;
    
    setIsThemeChanging(true);
    isThemeChangingRef.current = true;
    
    // First do the visual transition
    Animated.timing(fadeAnim, {
      toValue: 0.15,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      // Change actual theme values during the transition
      setThemeName(name);
      
      // Schedule mesh cache invalidation AFTER theme is updated
      requestAnimationFrame(() => {
        invalidateMeshCache();
        
        // Complete the transition
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setIsThemeChanging(false);
          isThemeChangingRef.current = false;
        });
      });
    });
  };
  
  // Memoize the responsive typography styles
  const responsiveTypography = useMemo(() => {
    const originalStyles = themeTypography;
    
    // Create scaled typography styles
    return Object.fromEntries(
      Object.entries(originalStyles).map(([key, style]) => {
        // Skip if style is undefined or doesn't have fontSize
        if (!style || typeof style.fontSize !== 'number') {
          return [key, style];
        }
        
        // Create a new style with scaled font size and line height
        const newStyle: TextStyle = {
          ...style,
          fontSize: Math.round(style.fontSize * fontScale * 10) / 10, // Round to 1 decimal place
        };
        
        // Only scale lineHeight if it's a number
        if (typeof style.lineHeight === 'number') {
          newStyle.lineHeight = Math.round(style.lineHeight * fontScale * 10) / 10;
        }
        
        return [key, newStyle];
      })
    ) as Record<TypographyVariant, TextStyle>;
  }, [themeTypography, fontScale]);

  // Create the combined theme context with responsive typography
  const themeContextValue = useMemo(() => ({
    colors: activeColors,
    spacing,
    typography: {
      styles: themeTypography,
      fonts: typography.fonts,
      createTextStyles: typography.createTextStyles,
    },
    responsiveTypography,
    fontScale,
    themeLoaded: true,
    colorMode,
    themeName,
    effectiveColorMode,
    setColorMode: handleSetColorMode,
    setThemeName: handleSetThemeName,
  }), [
    activeColors, 
    spacing, 
    themeTypography, 
    responsiveTypography,
    fontScale,
    colorMode,
    themeName,
    effectiveColorMode,
    handleSetColorMode,
    handleSetThemeName
  ]);
  
  // Render provider with transition overlay
  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
      {isThemeChanging && (
        <Animated.View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: effectiveColorMode === 'dark' ? 'white' : 'black',
            opacity: fadeAnim,
            pointerEvents: 'none',
            zIndex: 9999,
          }} 
        />
      )}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 