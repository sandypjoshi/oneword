import React, { memo, useMemo, useCallback } from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle,
  StyleProp,
  Platform
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../ui';
import { radius, borderWidth } from '../../theme/styleUtils';
import { useColorScheme } from 'react-native';

export type OptionState = 'default' | 'selected' | 'correct' | 'incorrect' | 'disabled';

// State lookup sets for easier maintenance
const BORDER_STATES = new Set(['selected', 'correct', 'incorrect', 'disabled']);
const BOLD_STATES = new Set(['selected', 'correct']);

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
const getBackgroundColor = (state: OptionState, colors: any, colorScheme: 'light' | 'dark') => {
  const isDark = colorScheme === 'dark';
  switch (state) {
    case 'selected':
      return colors.background.selected;
    case 'correct':
      return colors.background.success;
    case 'incorrect':
      return colors.background.error;
    case 'disabled':
      return colors.background.disabled;
    default:
      // For default state, use a slightly darker color than tertiary
      // to increase contrast against the background
      return isDark ? colors.background.tertiary : colors.background.active;
  }
};

/**
 * Get border color based on state
 */
const getBorderColor = (state: OptionState, colors: any, colorScheme: 'light' | 'dark') => {
  const isDark = colorScheme === 'dark';
  switch (state) {
    case 'selected':
      return colors.border.focus;
    case 'correct':
      return colors.border.success;
    case 'incorrect':
      return colors.border.error;
    case 'disabled':
      return colors.border.disabled;
    default:
      // Use a lighter border for default state
      return colors.border.light;
  }
};

/**
 * Get text color based on state
 */
const getTextColor = (state: OptionState, colors: any, colorScheme: 'light' | 'dark') => {
  const isDark = colorScheme === 'dark';
  switch (state) {
    case 'selected':
      return colors.text.info;
    case 'correct':
      return colors.text.success;
    case 'incorrect':
      return colors.text.error;
    case 'disabled':
      return colors.text.disabled;
    default:
      // Use secondary text color for better contrast on darker background
      return isDark ? colors.text.primary : colors.text.secondary;
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
  const { colors, spacing } = useTheme();
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  
  // Determine effective state (if disabled but not in a result state, use 'disabled' state)
  const state = disabled && !['correct', 'incorrect'].includes(propState) 
    ? 'disabled' 
    : propState;
  
  // Determine if button should have border
  const hasBorder = BORDER_STATES.has(state) || state === 'default';
  
  // Determine if text should be bold - not for disabled state
  const isBold = BOLD_STATES.has(state);
  
  // Memoize the styles to prevent recalculation on every render
  const buttonStyles = useMemo(() => ({
    container: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      marginBottom: spacing.sm,
      width: '100%' as const,
      backgroundColor: getBackgroundColor(state, colors, colorScheme),
      borderColor: getBorderColor(state, colors, colorScheme),
      borderWidth: hasBorder ? (state === 'default' ? borderWidth.hairline : borderWidth.hairline) : borderWidth.none,
    },
    text: {
      textTransform: 'lowercase' as const,
      paddingVertical: spacing.xs,
    }
  }), [state, colors, spacing, colorScheme, hasBorder]);
  
  // Use callback for press handler to prevent unnecessary function recreation
  const handlePress = useCallback(() => {
    if (onPress) onPress();
  }, [onPress]);
  
  return (
    <TouchableOpacity
      style={[buttonStyles.container, style]}
      onPress={handlePress}
      disabled={disabled || ['correct', 'incorrect'].includes(state)}
      activeOpacity={0.7}
    >
      <Text
        variant="bodyMedium"
        weight={isBold ? "700" : "400"}
        color={getTextColor(state, colors, colorScheme)}
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