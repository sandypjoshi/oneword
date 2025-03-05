import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { theme } from '../../constants/theme';

// Define the ThemeContext type
type ThemeContextType = {
  theme: typeof theme.light;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
};

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: theme.light,
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

// Create hook for easy theme access
export const useTheme = () => useContext(ThemeContext);

// Props for ThemeProvider component
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
}

/**
 * ThemeProvider component that provides theme context to child components
 * Handles theme switching and system preference detection
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
}) => {
  // Get the system color scheme
  const colorScheme = useColorScheme();
  
  // Initial theme state based on defaultTheme prop
  const [isDark, setIsDark] = useState(() => {
    if (defaultTheme === 'system') {
      return colorScheme === 'dark';
    }
    return defaultTheme === 'dark';
  });

  // Update theme when system preference changes
  useEffect(() => {
    if (defaultTheme === 'system') {
      setIsDark(colorScheme === 'dark');
    }
  }, [colorScheme, defaultTheme]);

  // Toggle between dark and light themes
  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Set specific theme
  const setTheme = (dark: boolean) => {
    setIsDark(dark);
  };

  // Current theme based on isDark state
  const currentTheme = isDark ? theme.dark : theme.light;

  // Provide theme context to child components
  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        isDark,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 