import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Minimal root entry point.
 * The actual routing logic (onboarding vs. tabs) is handled
 * by the root layout (_layout.tsx) during the splash screen phase.
 * This component just ensures something minimal is rendered initially.
 */
export default function Index() {
  // Render a simple loading indicator while the root layout determines the correct route.
  // Styling is minimal as the theme may not be fully available yet.
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Use a neutral background that works reasonably in light/dark
    // eslint-disable-next-line react-native/no-color-literals
    backgroundColor: '#f0f0f0', // Example neutral light gray
  },
});
