/**
 * Color palette for the OneWord app
 * Each theme has a completely different style and feel, not just different primary colors
 * Supports multiple themes with light and dark variants
 * Follows Design System structure with extended values from 10 to 1000
 */

import { palettes, opacity } from './primitives';

// Status colors derived from the common palette
const statusColors = {
  // Success states
  success: palettes.green[500],
  successLight: palettes.green[300],
  successDark: palettes.green[700],
  
  // Error states
  error: palettes.red[500],
  errorLight: palettes.red[300],
  errorDark: palettes.red[700],
  
  // Warning states
  warning: palettes.orange[500],
  warningLight: palettes.orange[300],
  warningDark: palettes.orange[700],
  
  // Info states
  info: palettes.blue[500],
  infoLight: palettes.blue[300],
  infoDark: palettes.blue[700],
  
  // Neutral states
  neutral: palettes.neutral[500],
  neutralLight: palettes.neutral[300],
  neutralDark: palettes.neutral[700],
  
  // Discovery states
  discovery: palettes.deepBlue[500],
  discoveryLight: palettes.deepBlue[300],
  discoveryDark: palettes.deepBlue[700],
};

// Theme Definitions
// Each theme has both light and dark variants with enhanced semantic colors

// 1. Default Theme - Modern and clean with blue accents
const defaultTheme = {
  light: {
    // Semantic colors - Background
    background: {
      primary: palettes.neutralLight[10],
      secondary: palettes.neutralLight[50],
      tertiary: palettes.neutralLight[25],
      card: palettes.neutralLight[0],
      overlay: `${palettes.neutral.black}${opacity.medium}`,
      
      // Status backgrounds
      success: palettes.green[50],
      successHeavy: palettes.green[100],
      error: palettes.red[50],
      errorHeavy: palettes.red[100],
      warning: palettes.orange[50],
      warningHeavy: palettes.orange[100],
      info: palettes.blue[50],
      infoHeavy: palettes.blue[100],
      discovery: palettes.deepBlue[50],
      discoveryHeavy: palettes.deepBlue[100],
      
      // Interactive backgrounds
      hover: palettes.neutralLight[50],
      active: palettes.neutralLight[25],
      selected: palettes.blue[50],
      disabled: palettes.neutralLight[100],
    },
    
    // Semantic colors - Text
    text: {
      primary: palettes.neutralLight[1000],
      secondary: palettes.neutralLight[800],
      tertiary: palettes.neutralLight[600],
      hint: palettes.neutralLight[500],
      inverse: palettes.neutralLight[0],
      
      // Status text
      success: palettes.green[700],
      error: palettes.red[700],
      warning: palettes.orange[700],
      info: palettes.blue[700],
      discovery: palettes.deepBlue[700],
      
      // Interactive text
      disabled: palettes.neutralLight[400],
      link: palettes.blue[600],
      linkHover: palettes.blue[700],
    },
    
    // Semantic colors - Border
    border: {
      light: palettes.neutralLight[200],
      medium: palettes.neutralLight[300],
      dark: palettes.neutralLight[400],
      focus: palettes.blue[500],
      
      // Status borders
      success: palettes.green[500],
      error: palettes.red[500],
      warning: palettes.orange[500],
      info: palettes.blue[500],
      discovery: palettes.deepBlue[500],
      
      // Interactive borders
      disabled: palettes.neutralLight[300],
    },
    
    // Brand colors
    primary: palettes.blue[500],
    primaryLight: palettes.blue[300],
    primaryDark: palettes.blue[700],
    
    // Status colors
    success: statusColors.success,
    successLight: statusColors.successLight,
    successDark: statusColors.successDark,
    
    error: statusColors.error,
    errorLight: statusColors.errorLight,
    errorDark: statusColors.errorDark,
    
    warning: statusColors.warning,
    warningLight: statusColors.warningLight,
    warningDark: statusColors.warningDark,
    
    info: statusColors.info,
    infoLight: statusColors.infoLight,
    infoDark: statusColors.infoDark,
    
    discovery: statusColors.discovery,
    discoveryLight: statusColors.discoveryLight,
    discoveryDark: statusColors.discoveryDark,
  },
  
  dark: {
    // Semantic colors - Background
    background: {
      primary: palettes.neutralDark[10],
      secondary: palettes.neutralDark[50],
      tertiary: palettes.neutralDark[100],
      card: palettes.neutralDark[50],
      overlay: `${palettes.neutral.black}${opacity.heavy}`,
      
      // Status backgrounds
      success: palettes.green[900],
      successHeavy: palettes.green[800],
      error: palettes.red[900],
      errorHeavy: palettes.red[800],
      warning: palettes.orange[900],
      warningHeavy: palettes.orange[800],
      info: palettes.blue[900],
      infoHeavy: palettes.blue[800],
      discovery: palettes.deepBlue[900],
      discoveryHeavy: palettes.deepBlue[800],
      
      // Interactive backgrounds
      hover: palettes.neutralDark[100],
      active: palettes.neutralDark[100],
      selected: palettes.blue[900],
      disabled: palettes.neutralDark[100],
    },
    
    // Semantic colors - Text
    text: {
      primary: palettes.neutralDark[1000],
      secondary: palettes.neutralDark[800],
      tertiary: palettes.neutralDark[600],
      hint: palettes.neutralDark[500],
      inverse: palettes.neutralDark[0],
      
      // Status text
      success: palettes.green[300],
      error: palettes.red[300],
      warning: palettes.orange[300],
      info: palettes.blue[300],
      discovery: palettes.deepBlue[300],
      
      // Interactive text
      disabled: palettes.neutralDark[400],
      link: palettes.blue[400],
      linkHover: palettes.blue[300],
    },
    
    // Semantic colors - Border
    border: {
      light: palettes.neutralDark[200],
      medium: palettes.neutralDark[300],
      dark: palettes.neutralDark[400],
      focus: palettes.blue[500],
      
      // Status borders
      success: palettes.green[500],
      error: palettes.red[500],
      warning: palettes.orange[500],
      info: palettes.blue[500],
      discovery: palettes.deepBlue[500],
      
      // Interactive borders
      disabled: palettes.neutralDark[300],
    },
    
    // Brand colors
    primary: palettes.blue[400],
    primaryLight: palettes.blue[300],
    primaryDark: palettes.blue[600],
    
    // Status colors
    success: statusColors.success,
    successLight: statusColors.successLight,
    successDark: statusColors.successDark,
    
    error: statusColors.error,
    errorLight: statusColors.errorLight,
    errorDark: statusColors.errorDark,
    
    warning: statusColors.warning,
    warningLight: statusColors.warningLight,
    warningDark: statusColors.warningDark,
    
    info: statusColors.info,
    infoLight: statusColors.infoLight,
    infoDark: statusColors.infoDark,
    
    discovery: statusColors.discovery,
    discoveryLight: statusColors.discoveryLight,
    discoveryDark: statusColors.discoveryDark,
  }
};

// 2. Quill Theme - Sophisticated and warm with orange accents - Enhanced for professional aesthetics
const quillTheme = {
  light: {
    // Semantic colors - Background
    background: {
      primary: palettes.sand[10],
      secondary: palettes.sand[25],
      tertiary: palettes.sand[50],
      card: palettes.sand[25],
      overlay: `${palettes.neutral.black}${opacity.medium}`,
      
      // Status backgrounds
      success: palettes.teal[25],
      successHeavy: palettes.teal[50],
      error: palettes.red[25],
      errorHeavy: palettes.red[50],
      warning: palettes.orange[25],
      warningHeavy: palettes.orange[50],
      info: palettes.deepBlue[25],
      infoHeavy: palettes.deepBlue[50],
      discovery: palettes.purple[25],
      discoveryHeavy: palettes.purple[50],
      
      // Interactive backgrounds
      hover: palettes.sand[100],
      active: palettes.sand[50],
      selected: palettes.orange[50],
      disabled: palettes.sand[50],
    },
    
    // Semantic colors - Text - Enhanced contrast
    text: {
      primary: palettes.neutral[900],
      secondary: palettes.sand[800],
      tertiary: palettes.sand[700],
      hint: palettes.sand[600],
      inverse: palettes.sand[10],
      
      // Status text - Improved readability
      success: palettes.teal[700],
      error: palettes.red[700],
      warning: palettes.orange[800],
      info: palettes.deepBlue[700],
      discovery: palettes.purple[700],
      
      // Interactive text - Better contrast
      disabled: palettes.sand[500],
      link: palettes.orange[700],
      linkHover: palettes.orange[800],
    },
    
    // Semantic colors - Border - More refined edges
    border: {
      light: palettes.sand[100],
      medium: palettes.sand[200],
      dark: palettes.sand[400],
      focus: palettes.orange[500],
      
      // Status borders - Enhanced professional look
      success: palettes.teal[500],
      error: palettes.red[500],
      warning: palettes.orange[500],
      info: palettes.deepBlue[500],
      discovery: palettes.purple[500],
      
      // Interactive borders
      disabled: palettes.sand[200],
    },
    
    // Brand colors - More elegant orange
    primary: palettes.orange[600],
    primaryLight: palettes.orange[400],
    primaryDark: palettes.orange[700],
    
    // Status colors
    success: palettes.teal[600],
    successLight: palettes.teal[400],
    successDark: palettes.teal[800],
    
    error: palettes.red[600],
    errorLight: palettes.red[400],
    errorDark: palettes.red[800],
    
    warning: palettes.orange[600],
    warningLight: palettes.orange[400],
    warningDark: palettes.orange[800],
    
    info: palettes.deepBlue[600],
    infoLight: palettes.deepBlue[400],
    infoDark: palettes.deepBlue[800],
    
    discovery: palettes.purple[600],
    discoveryLight: palettes.purple[400],
    discoveryDark: palettes.purple[800],
  },
  
  dark: {
    // Semantic colors - Background
    background: {
      primary: palettes.deepBlue[900],
      secondary: palettes.deepBlue[800],
      tertiary: palettes.deepBlue[700],
      card: palettes.deepBlue[800],
      overlay: `${palettes.neutral.black}${opacity.heavy}`,
      
      // Status backgrounds
      success: palettes.teal[900],
      successHeavy: palettes.teal[800],
      error: palettes.red[900],
      errorHeavy: palettes.red[800],
      warning: palettes.orange[900],
      warningHeavy: palettes.orange[800],
      info: palettes.deepBlue[900],
      infoHeavy: palettes.deepBlue[800],
      discovery: palettes.purple[900],
      discoveryHeavy: palettes.purple[800],
      
      // Interactive backgrounds
      hover: palettes.deepBlue[800],
      active: palettes.deepBlue[700],
      selected: palettes.orange[800],
      disabled: palettes.deepBlue[800],
    },
    
    // Semantic colors - Text
    text: {
      primary: palettes.sand[50],
      secondary: palettes.sand[100],
      tertiary: palettes.sand[200],
      hint: palettes.sand[300],
      inverse: palettes.deepBlue[900],
      
      // Status text
      success: palettes.teal[300],
      error: palettes.red[300],
      warning: palettes.orange[300],
      info: palettes.blue[300],
      discovery: palettes.purple[300],
      
      // Interactive text
      disabled: palettes.neutralDark[400],
      link: palettes.orange[400],
      linkHover: palettes.orange[300],
    },
    
    // Semantic colors - Border
    border: {
      light: palettes.deepBlue[700],
      medium: palettes.deepBlue[600],
      dark: palettes.deepBlue[500],
      focus: palettes.orange[500],
      
      // Status borders
      success: palettes.teal[500],
      error: palettes.red[500],
      warning: palettes.orange[500],
      info: palettes.blue[500],
      discovery: palettes.purple[500],
      
      // Interactive borders
      disabled: palettes.deepBlue[600],
    },
    
    // Brand colors
    primary: palettes.orange[500],
    primaryLight: palettes.orange[400],
    primaryDark: palettes.orange[600],
    
    // Status colors
    success: palettes.teal[500],
    successLight: palettes.teal[400],
    successDark: palettes.teal[600],
    
    error: palettes.red[500],
    errorLight: palettes.red[400],
    errorDark: palettes.red[600],
    
    warning: palettes.orange[500],
    warningLight: palettes.orange[400],
    warningDark: palettes.orange[600],
    
    info: palettes.blue[500],
    infoLight: palettes.blue[400],
    infoDark: palettes.blue[600],
    
    discovery: palettes.purple[500],
    discoveryLight: palettes.purple[400],
    discoveryDark: palettes.purple[600],
  }
};

// Export all themes
const themes = {
  default: defaultTheme,
  quill: quillTheme,
};

export default themes;
export { palettes, opacity, statusColors }; 