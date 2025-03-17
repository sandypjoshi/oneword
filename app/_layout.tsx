import React, { useEffect, useState } from 'react';
import { Stack, useRouter, SplashScreen, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Image, StyleSheet, Animated } from 'react-native';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { ensurePolyfills } from '../src/utils/supabaseSetup';
import { checkOnboardingStatus } from '../src/utils/onboarding';

// Import logo image
const logoImage = require('../src/assets/images/logo.png');

// Initialize polyfills immediately
ensurePolyfills();

// Keep the splash screen visible while we initialize
SplashScreen.preventAutoHideAsync();

// Set minimum splash screen duration in milliseconds
const MIN_SPLASH_DURATION = 2500;

// Main content component that uses the theme
const MainContent = () => {
  const [initializing, setInitializing] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(1));
  const router = useRouter();
  const segments = useSegments();
  const { colors, isDark, spacing } = useTheme();
  
  // Initialize app and handle navigation
  useEffect(() => {
    async function initialize() {
      try {
        // Check if user has completed onboarding
        const hasOnboarded = await checkOnboardingStatus();

        // Hide the native splash screen
        await SplashScreen.hideAsync();
        
        // First navigate to the initial screen WITHOUT animation
        if (!hasOnboarded && segments[0] !== 'onboarding') {
          router.replace('/onboarding');
        } else if (hasOnboarded && !segments[0]) {
          router.replace('/(tabs)');
        }
        
        // Wait for minimum duration (our custom splash screen will be visible during this time)
        await new Promise(resolve => setTimeout(resolve, MIN_SPLASH_DURATION));
        
        // Fade out splash screen smoothly
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Mark initialization as complete after fade completes
          setInitializing(false);
        });
        
      } catch (e) {
        console.warn('Error during app initialization:', e);
        
        // Wait for minimum splash duration even on error
        await new Promise(resolve => setTimeout(resolve, MIN_SPLASH_DURATION));
        
        // Navigate to onboarding as fallback WITHOUT animation
        if (segments[0] !== 'onboarding') {
          router.replace('/onboarding');
        }
        
        // Fade out splash screen smoothly
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Mark initialization as complete after fade completes
          setInitializing(false);
        });
      }
    }

    initialize();
  }, [router, segments, fadeAnim, colors]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Properly implemented Stack navigator for animations */}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
          presentation: 'card',
          contentStyle: { 
            backgroundColor: colors.background.primary
          },
          // Add animation settings to prevent flashing
          animationTypeForReplace: 'push',
        }}
      />
      
      {/* Overlay our custom splash screen while initializing - now with fade animation */}
      {initializing && (
        <Animated.View style={[
          layoutStyles.splashOverlay, 
          { 
            backgroundColor: colors.background.primary,
            opacity: fadeAnim 
          }
        ]}>
          <Image 
            source={logoImage} 
            style={[
              layoutStyles.logo,
              { marginBottom: spacing.lg }
            ]} 
            resizeMode="contain"
          />
          <ActivityIndicator 
            size="large" 
            color={colors.primary} 
            style={{ marginTop: spacing.md }}
          />
        </Animated.View>
      )}
    </View>
  );
};

// Root layout
export default function RootLayout() {
  // Wrap the entire application with ThemeProvider, using default values that will be
  // overridden by any saved preferences from AsyncStorage
  return (
    <ThemeProvider defaultColorMode="system" defaultThemeName="default">
      <MainContent />
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
  },
}); 