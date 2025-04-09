import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemeReady } from '../../src/hooks';
import { Text } from '../../src/components/ui';

export default function PracticeScreen() {
  const { isReady, theme } = useThemeReady();

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const { colors } = theme;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      {/* Empty practice screen */}
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
});
