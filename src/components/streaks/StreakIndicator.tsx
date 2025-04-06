import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Text, Icon } from '../ui';
import spacing from '../../theme/spacing';

// TODO: Replace with actual state from Zustand store
const useMockStreakStore = () => ({
  currentStreak: 5, // Mock data for now
});

/**
 * Displays the current user streak with a flame icon.
 */
const StreakIndicator: React.FC = () => {
  const { colors } = useTheme();
  const { currentStreak } = useMockStreakStore(); // Use mock data for now

  // Don't render if streak is 0 or undefined (or adjust as needed)
  if (!currentStreak || currentStreak === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Icon 
        name="flame" // Correct icon name
        color={colors.warning} // Use warning color (typically orange/yellow)
        size={20} 
        // Variant prop removed as the SVG name includes style
      />
      <Text 
        variant="label" 
        color={colors.warning} // Match icon color
        style={styles.text}
      >
        {currentStreak}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg, // Adjusted margin to lg
  },
  text: {
    marginLeft: spacing.xxs,
    fontWeight: 'bold', // Make number stand out
  },
});

export default StreakIndicator; 