import { useState, useEffect } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { palettes } from '../theme/colors';

/**
 * Custom hook that ensures the theme is ready before rendering a component.
 * Returns an object with theme and isReady properties.
 * Includes safeguards against undefined theme values with fallbacks that match our semantic token structure.
 */
export function useThemeReady() {
  const [isReady, setIsReady] = useState(false);
  const theme = useTheme();

  // Make sure we never return undefined theme properties
  const safeTheme = {
    ...theme,
    // Ensure colors has all required properties with proper semantic structure
    colors: theme?.colors || {
      // Semantic background colors
      background: {
        primary: palettes.neutralLight[0],
        secondary: palettes.neutralLight[50],
        tertiary: palettes.neutralLight[100],
        card: palettes.neutralLight[0],
        success: palettes.green[50],
        successHeavy: palettes.green[100],
        error: palettes.red[50],
        errorHeavy: palettes.red[100],
        warning: palettes.orange[50],
        warningHeavy: palettes.orange[100],
        info: palettes.blue[50],
        infoHeavy: palettes.blue[100],
        disabled: palettes.neutralLight[50],
        selected: palettes.blue[50],
      },
      // Semantic text colors
      text: {
        primary: palettes.neutral[1000],
        secondary: palettes.neutral[700],
        tertiary: palettes.neutral[600],
        hint: palettes.neutral[500],
        inverse: palettes.neutral.white,
        success: palettes.green[700],
        error: palettes.red[700],
        warning: palettes.orange[700],
        info: palettes.blue[700],
        disabled: palettes.neutral[400],
        link: palettes.blue[600],
        linkHover: palettes.blue[700],
      },
      // Semantic border colors
      border: {
        light: palettes.neutralLight[200],
        medium: palettes.neutralLight[300],
        dark: palettes.neutralLight[400],
        focus: palettes.blue[500],
        success: palettes.green[500],
        error: palettes.red[500],
        warning: palettes.orange[500],
        info: palettes.blue[500],
        disabled: palettes.neutralLight[300],
      },
      // Brand colors
      primary: palettes.blue[500],
      primaryLight: palettes.blue[300],
      primaryDark: palettes.blue[700],

      // Status colors
      success: palettes.green[500],
      successLight: palettes.green[300],
      successDark: palettes.green[700],

      error: palettes.red[500],
      errorLight: palettes.red[300],
      errorDark: palettes.red[700],

      warning: palettes.orange[500],
      warningLight: palettes.orange[300],
      warningDark: palettes.orange[700],

      info: palettes.blue[500],
      infoLight: palettes.blue[300],
      infoDark: palettes.blue[700],
    },
    // Ensure spacing has values
    spacing: theme?.spacing || {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
    // Ensure typography exists
    typography: theme?.typography || {},
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
    isReady,
  };
}

export default useThemeReady;
