import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Box } from '../../src/components/layout';
import { Text } from '../../src/components/ui';
import { useThemeReady } from '../../src/hooks';
import MeshGradientCard from '../../src/components/practice/MeshGradientCard';

export default function PracticeScreen() {
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
        <Text variant="headingMedium" style={{ marginBottom: 24 }}>Practice</Text>
        <MeshGradientCard 
          title="Welcome to Practice"
          description="Experience the beautiful gradient animations powered by Skia"
        />
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