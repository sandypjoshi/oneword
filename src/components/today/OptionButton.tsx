import React, { memo, useMemo, useCallback } from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle,
  StyleProp 
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../ui';
import { radius, borderWidth, opacity } from '../../theme/styleUtils';

export type OptionState = 'default' | 'selected' | 'correct' | 'incorrect' | 'disabled';

// State lookup sets for easier maintenance
const BORDER_STATES = new Set(['selected', 'correct', 'incorrect', 'disabled']);
const BOLD_STATES = new Set(['selected', 'correct', 'incorrect']);

interface OptionButtonProps {
  /**
   * Text content of the option
   */
  label: string;
  
  /**
   * Current state of the option
   */
  state?: OptionState;
  
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  
  /**
   * Function called when the option is pressed
   */
  onPress?: () => void;
  
  /**
   * Additional style for the container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Get background color based on state
 */
const getBackgroundColor = (state: OptionState, colors: any, isDark: boolean) => {
  switch (state) {
    case 'selected':
      return colors.primary + opacity.light;
    case 'correct':
      return colors.success + opacity.light;
    case 'incorrect':
      return colors.error + opacity.light;
    case 'disabled':
      // More distinct background for disabled state, especially in dark mode
      return isDark 
        ? `${colors.text.secondary}${opacity.light}` // Slightly darker in dark mode for better contrast
        : colors.background.tertiary + opacity.light;
    default:
      return colors.background.tertiary;
  }
};

/**
 * Get border color based on state
 */
const getBorderColor = (state: OptionState, colors: any, isDark: boolean) => {
  switch (state) {
    case 'selected':
      return colors.primary;
    case 'correct':
      return colors.success;
    case 'incorrect':
      return colors.error;
    case 'disabled':
      return isDark ? colors.border.light + opacity.medium : colors.border.light;
    default:
      return isDark ? opacity.subtle.light : opacity.subtle.dark;
  }
};

/**
 * Get text color based on state
 */
const getTextColor = (state: OptionState, colors: any, isDark: boolean) => {
  switch (state) {
    case 'selected':
      return colors.primary;
    case 'correct':
      return colors.success;
    case 'incorrect':
      return colors.error;
    case 'disabled':
      // Make text lighter for disabled state
      return isDark
        ? `${colors.text.hint}${opacity.higher}` // Lighter text in dark mode
        : colors.text.hint; // Use hint text which is lighter than secondary
    default:
      return colors.text.primary;
  }
};

/**
 * Custom button for word definition options
 */
const OptionButtonComponent: React.FC<OptionButtonProps> = ({
  label,
  state: propState = 'default',
  disabled = false,
  onPress,
  style
}) => {
  const { colors, spacing, isDark } = useTheme();
  
  // Determine effective state (if disabled but not in a result state, use 'disabled' state)
  const state = disabled && !['correct', 'incorrect'].includes(propState) 
    ? 'disabled' 
    : propState;
  
  // Determine if button should have border
  const hasBorder = BORDER_STATES.has(state);
  
  // Determine if text should be bold - not for disabled state
  const isBold = BOLD_STATES.has(state);
  
  // We don't need to reduce opacity since we're handling subtlety with color opacity tokens
  const shouldReduceOpacity = false;
  
  // Memoize the styles to prevent recalculation on every render
  const buttonStyles = useMemo(() => ({
    container: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      marginBottom: spacing.sm,
      width: '100%' as const,
      backgroundColor: getBackgroundColor(state, colors, isDark),
      borderColor: getBorderColor(state, colors, isDark),
      borderWidth: hasBorder ? borderWidth.hairline : borderWidth.none,
      opacity: shouldReduceOpacity ? opacity.disabled : 1,
    },
    text: {
      textTransform: 'lowercase' as const,
      paddingVertical: spacing.xs,
    }
  }), [state, colors, spacing, isDark, hasBorder]);
  
  // Use callback for press handler to prevent unnecessary function recreation
  const handlePress = useCallback(() => {
    if (onPress) onPress();
  }, [onPress]);
  
  return (
    <TouchableOpacity
      style={[buttonStyles.container, style]}
      onPress={handlePress}
      disabled={disabled || ['correct', 'incorrect'].includes(state)}
      activeOpacity={opacity.disabled}
    >
      <Text
        variant="bodyMedium"
        weight={isBold ? "700" : "400"}
        color={getTextColor(state, colors, isDark)}
        align="center"
        style={buttonStyles.text}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Apply memo to prevent unnecessary re-renders
const OptionButton = memo(OptionButtonComponent);

// Set display name with state for better debugging
OptionButton.displayName = 'OptionButton';

export default OptionButton; 