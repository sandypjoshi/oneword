import React, { memo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../layout';
import { Text } from '../ui';

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
        },
        style
      ]}
    >
      <Box padding="lg" align="center" justify="center">
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
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    minHeight: 280,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
});

// Set display name for better debugging
EmptyWordCard.displayName = 'EmptyWordCard';

export default EmptyWordCard; 