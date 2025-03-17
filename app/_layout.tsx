import React, { useEffect, useState } from 'react';
import { Slot, useRouter, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { ensurePolyfills } from '../src/utils/supabaseSetup';
import { checkOnboardingStatus } from '../src/utils/onboarding';

// Initialize polyfills immediately
ensurePolyfills();

// Keep the splash screen visible while we initialize
SplashScreen.preventAutoHideAsync();

// Root layout
export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    async function prepare() {
      try {
        // Check if user has completed onboarding
        const hasOnboarded = await checkOnboardingStatus();
        
        // Direct user to the appropriate screen
        if (!hasOnboarded) {
          router.replace('/onboarding');
        }
        
        // Wait a bit for everything to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('Error during app initialization:', e);
      } finally {
        // After everything is ready, set isReady to true
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [router]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  
  return (
    <ThemeProvider>
      <View style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <Slot />
      </View>
    </ThemeProvider>
  );
} 