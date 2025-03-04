import React, { useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from '../components/ui/ThemeProvider';
import { useUserStore } from '../store/userStore';
import { getDeviceId } from '../lib/supabase/client';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create a shared query client for React Query
const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Get user preferences from store
  const { deviceId, setDeviceId, updateLastActive, settings } = useUserStore();
  
  // Load device ID and update last active date on app start
  useEffect(() => {
    async function initializeUser() {
      if (!deviceId) {
        const id = await getDeviceId();
        setDeviceId(id);
      }
      updateLastActive();
    }
    
    initializeUser();
  }, [deviceId, setDeviceId, updateLastActive]);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme={settings?.darkMode || 'system'}>
        <RootLayoutNav />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Add more screens here as needed */}
    </Stack>
  );
} 