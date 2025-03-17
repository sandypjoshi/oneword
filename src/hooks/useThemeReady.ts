import { useState, useEffect } from 'react';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Custom hook that ensures the theme is ready before rendering a component.
 * Returns an object with theme and isReady properties.
 */
export function useThemeReady() {
  const [isReady, setIsReady] = useState(false);
  const theme = useTheme();
  
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
    theme,
    isReady
  };
}

export default useThemeReady; 