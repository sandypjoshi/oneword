import React, { memo } from 'react';
import { StyleSheet, View, ViewStyle, Image } from 'react-native';
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
  const imageUrl = 'https://i.ibb.co/1YvNkbVH/Empty-State-Image-from-Tiny-PNG-1.png';
  
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
      <Box 
        padding="lg" 
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image} 
          resizeMode="contain"
        />
        
        <Text 
          variant="bodyMedium"
          color={colors.text.secondary}
          align="center"
          style={{ marginTop: spacing.md }}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
});

// Set display name for better debugging
EmptyWordCard.displayName = 'EmptyWordCard';

export default EmptyWordCard; 