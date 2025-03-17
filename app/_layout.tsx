import React, { useEffect, useState } from 'react';
import { Slot, useRouter, SplashScreen, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Image, StyleSheet, useColorScheme } from 'react-native';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { ensurePolyfills } from '../src/utils/supabaseSetup';
import { checkOnboardingStatus } from '../src/utils/onboarding';
import colors from '../src/theme/colors';

// Import logo image
const logoImage = require('../src/assets/images/logo.png');

// Initialize polyfills immediately
ensurePolyfills();

// Keep the splash screen visible while we initialize
SplashScreen.preventAutoHideAsync();

// Set minimum splash screen duration in milliseconds
const MIN_SPLASH_DURATION = 2500;

// Root layout
export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const colorScheme = useColorScheme();
  
  // Initialize app and handle navigation
  useEffect(() => {
    async function initialize() {
      try {
        // Check if user has completed onboarding
        const hasOnboarded = await checkOnboardingStatus();

        // Hide the native splash screen
        await SplashScreen.hideAsync();
        
        // Wait for minimum duration (our custom splash screen will be visible during this time)
        await new Promise(resolve => setTimeout(resolve, MIN_SPLASH_DURATION));
        
        // Navigate to the appropriate screen after delay
        if (!hasOnboarded && segments[0] !== 'onboarding') {
          router.replace('/onboarding');
        } else if (hasOnboarded && !segments[0]) {
          router.replace('/(tabs)');
        }
        
        // Mark initialization as complete
        setInitializing(false);
      } catch (e) {
        console.warn('Error during app initialization:', e);
        
        // Wait for minimum splash duration even on error
        await new Promise(resolve => setTimeout(resolve, MIN_SPLASH_DURATION));
        
        // Navigate to onboarding as fallback
        if (segments[0] !== 'onboarding') {
          router.replace('/onboarding');
        }
        
        setInitializing(false);
      }
    }

    initialize();
  }, [router, segments]);

  // Get appropriate colors for splash screen
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  // Render the app with proper navigation structure
  return (
    <ThemeProvider defaultTheme="system">
      <View style={{ flex: 1 }}>
        <StatusBar style="auto" />
        
        {/* Always render a navigator (Slot) to avoid the error */}
        <Slot />
        
        {/* Overlay our custom splash screen while initializing */}
        {initializing && (
          <View style={[
            layoutStyles.splashOverlay, 
            { backgroundColor: themeColors.background.primary }
          ]}>
            <Image 
              source={logoImage} 
              style={layoutStyles.logo} 
              resizeMode="contain"
            />
            <ActivityIndicator 
              size="large" 
              color={themeColors.primary} 
              style={layoutStyles.loader}
            />
          </View>
        )}
      </View>
    </ThemeProvider>
  );
}

const layoutStyles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  loader: {
    marginTop: 16,
  }
}); 