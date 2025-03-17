import React from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { Box } from '../../src/components/layout';
import { Text } from '../../src/components/ui';
import { useThemeReady } from '../../src/hooks';

export default function PracticeScreen() {
  const { isReady, theme } = useThemeReady();

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const { spacing, colors } = theme;

  return (
    <ScrollView style={styles.container}>
      <Box padding="lg">
        <Text variant="h1" style={{ marginBottom: spacing.md }}>Practice</Text>
        <Text variant="body1" style={{ marginBottom: spacing.lg }}>Strengthen your vocabulary with these exercises</Text>
        
        <Box 
          style={[
            styles.card, 
            { 
              marginBottom: spacing.md,
              backgroundColor: colors.background.secondary,
              padding: spacing.lg,
              borderRadius: 8
            }
          ]}
        >
          <Text variant="h2" style={{ marginBottom: spacing.sm }}>Word Quiz</Text>
          <Text variant="body1">Test your knowledge of recent words</Text>
        </Box>
        
        <Box 
          style={[
            styles.card, 
            { 
              marginBottom: spacing.md,
              backgroundColor: colors.background.secondary,
              padding: spacing.lg,
              borderRadius: 8
            }
          ]}
        >
          <Text variant="h2" style={{ marginBottom: spacing.sm }}>Word Match</Text>
          <Text variant="body1">Match words with their definitions</Text>
        </Box>
        
        <Box 
          style={[
            styles.card, 
            { 
              backgroundColor: colors.background.secondary,
              padding: spacing.lg,
              borderRadius: 8
            }
          ]}
        >
          <Text variant="h2" style={{ marginBottom: spacing.sm }}>Flash Cards</Text>
          <Text variant="body1">Review words with digital flash cards</Text>
        </Box>
      </Box>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
}); 