import React from 'react';
import { Stack } from 'expo-router';

// Setting initialRouteName to help Expo Router identify the initial route
export const unstable_settings = {
  initialRouteName: "index",
};

// Simple default export with minimal code
export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
} 