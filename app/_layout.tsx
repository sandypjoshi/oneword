import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { ThemeProvider } from '../src/theme/ThemeProvider';

// Root layout
export default function RootLayout() {
  return (
    <ThemeProvider defaultTheme="system">
      <View style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: true }} />
      </View>
    </ThemeProvider>
  );
} 