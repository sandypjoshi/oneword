import React, { memo } from 'react';
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
  const hasBorder = state !== 'default';
  
  // Determine if text should be bold - not for disabled state
  const isBold = state !== 'default' && state !== 'disabled';
  
  // Get background color based on state
  const getBackgroundColor = () => {
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
  
  // Determine border color based on state
  const getBorderColor = () => {
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
  
  // Get text color - make disabled state more subtle
  const getTextColor = () => {
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
  
  // We don't need to reduce opacity since we're handling subtlety with color opacity tokens
  const shouldReduceOpacity = false;
  
  return (
    <TouchableOpacity
      style={[
        {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          marginBottom: spacing.sm,
          width: '100%',
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: hasBorder ? borderWidth.hairline : borderWidth.none,
          opacity: shouldReduceOpacity ? opacity.disabled : 1,
        },
        style
      ]}
      onPress={onPress}
      disabled={disabled || ['correct', 'incorrect'].includes(state)}
      activeOpacity={opacity.disabled}
    >
      <Text
        variant="bodyMedium"
        weight={isBold ? "700" : "400"}
        color={getTextColor()}
        align="center"
        style={{ 
          textTransform: 'lowercase',
          paddingVertical: spacing.xs 
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Apply memo to prevent unnecessary re-renders
const OptionButton = memo(OptionButtonComponent);

// Set display name for better debugging
OptionButton.displayName = 'OptionButton';

export default OptionButton; 