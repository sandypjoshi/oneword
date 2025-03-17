import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Box } from '../../src/components/layout';
import { Text } from '../../src/components/ui';
import { useThemeReady } from '../../src/hooks';

export default function HomeScreen() {
  const { isReady, theme } = useThemeReady();

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const { colors } = theme;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Box padding="lg" flex={1} align="center" justify="center">
        <Text variant="h2">Today</Text>
        <Text 
          variant="body1" 
          color={colors.text.secondary}
          align="center"
          style={styles.subtitle}
        >
          Ready to build something new
        </Text>
      </Box>
    </View>
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
  subtitle: {
    marginTop: 8,
  },
}); 