import React, { memo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../layout';
import { Text } from '../ui';
import { radius, applyElevation } from '../../theme/styleUtils';

interface EmptyWordCardProps {
  /**
   * Optional message to display
   */
  message?: string;

  /**
   * Additional styles for the container
   */
  style?: ViewStyle;

  /**
   * Optional date string for the empty day
   */
  date?: string;
}

/**
 * Empty state component for days without a word
 */
const EmptyWordCardComponent: React.FC<EmptyWordCardProps> = ({ 
  message,
  style,
  date 
}) => {
  const { colors, spacing } = useTheme();
  const defaultMessage = date 
    ? `No word available for ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : 'No word available for this date';
  
  return (
    <View 
      style={[
        styles.container,
        { 
          backgroundColor: colors.background.card,
          borderColor: colors.border.light,
          borderRadius: radius.xl,
          ...applyElevation('sm', colors.text.primary)
        },
        style
      ]}
    >
      <Box padding="lg" align="center" justify="center" style={{ flex: 1 }}>
        <View style={styles.iconContainer}>
          <Text 
            variant="displayMedium" 
            color={colors.text.secondary}
          >
            {"📖"}
          </Text>
        </View>
        
        <Text 
          variant="bodyMedium"
          color={colors.text.secondary}
          align="center"
        >
          {message || defaultMessage}
        </Text>
      </Box>
    </View>
  );
};

// Apply memo to the component
const EmptyWordCard = memo(EmptyWordCardComponent);

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
    flex: 1,
    display: 'flex',
  },
  iconContainer: {
    marginBottom: 16,
  },
});

// Set display name for better debugging
EmptyWordCard.displayName = 'EmptyWordCard';

export default EmptyWordCard; 