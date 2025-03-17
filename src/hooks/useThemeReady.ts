import { useState, useEffect } from 'react';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Custom hook that ensures the theme is ready before rendering a component.
 * Returns an object with theme and isReady properties.
 * Includes safeguards against undefined theme values.
 */
export function useThemeReady() {
  const [isReady, setIsReady] = useState(false);
  const theme = useTheme();
  
  // Make sure we never return undefined theme properties
  const safeTheme = {
    ...theme,
    // Ensure colors has all required properties
    colors: theme?.colors || {
      background: { primary: '#ffffff', secondary: '#f5f5f5' },
      text: { primary: '#000000', secondary: '#666666', hint: '#999999' },
      border: { light: '#eeeeee', medium: '#dddddd', dark: '#cccccc' },
      primary: '#0066cc',
    },
    // Ensure spacing has values
    spacing: theme?.spacing || {
      xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
    },
    // Ensure typography exists
    typography: theme?.typography || {}
  };
  
  useEffect(() => {
    if (theme) {
      // Small delay to ensure all theme properties are available
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [theme]);
  
  return {
    theme: safeTheme,
    isReady
  };
}

export default useThemeReady; 