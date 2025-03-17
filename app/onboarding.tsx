import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Box } from '../src/components/layout';
import { Text } from '../src/components/ui';
import { useThemeReady } from '../src/hooks';
import { useRouter } from 'expo-router';
import { setOnboardingComplete } from '../src/utils/onboarding';
import { wordOfDayService } from '../src/services/wordOfDayService';
import colors from '../src/theme/colors';
import { useColorScheme } from 'react-native';

export default function OnboardingScreen() {
  const { isReady, theme } = useThemeReady();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const fallbackColors = isDark ? colors.dark : colors.light;

  if (!isReady) {
    return (
      <View style={[
        styles.loadingContainer, 
        { backgroundColor: fallbackColors.background.primary }
      ]}>
        <ActivityIndicator size="large" color={fallbackColors.primary} />
      </View>
    );
  }

  const { spacing, colors: themeColors } = theme;

  const handleGetStarted = async () => {
    // Prevent double tap
    if (isNavigating) return;
    
    // Set state to show we're processing
    setIsNavigating(true);
    
    try {
      // Mark onboarding as complete
      await setOnboardingComplete();
      
      // Pre-load words data to avoid loading screen in the main tab
      try {
        // Silently preload the words in the background
        wordOfDayService.getWordsForPastDays(14);
      } catch (e) {
        // Ignore errors during preloading, we'll retry in the main screen
        console.warn('Error preloading words:', e);
      }
      
      // Navigate to home screen
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error during onboarding completion:', error);
      setIsNavigating(false); // Reset state on error
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <Box flex={1} justify="center" align="center" padding="xl">
        <Text 
          variant="h1" 
          color={themeColors.primary} 
          style={{ marginBottom: spacing.lg }}
        >
          OneWord
        </Text>
        
        <Text 
          variant="h2" 
          color={themeColors.text.primary} 
          align="center"
          style={{ marginBottom: spacing.lg }}
        >
          Expand Your Vocabulary
        </Text>
        
        <Text 
          variant="body1" 
          color={themeColors.text.secondary} 
          align="center"
          style={{ marginBottom: spacing.xl }}
        >
          Learn one new word every day. Build your vocabulary systematically with our curated selection of words.
        </Text>
        
        <TouchableOpacity
          style={[
            styles.button,
            { 
              backgroundColor: isNavigating ? themeColors.border.light : themeColors.primary,
              padding: spacing.md,
              marginTop: spacing.lg
            }
          ]}
          onPress={handleGetStarted}
          disabled={isNavigating}
        >
          {isNavigating ? (
            <ActivityIndicator size="small" color={themeColors.primary} />
          ) : (
            <Text variant="button" color={themeColors.background.primary}>
              Get Started
            </Text>
          )}
        </TouchableOpacity>
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
  button: {
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
}); 