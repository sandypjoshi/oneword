import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Box } from '../src/components/layout';
import { Text, Button } from '../src/components/ui';
import { useThemeReady } from '../src/hooks';
import { useRouter } from 'expo-router';
import { setOnboardingComplete, setDifficultyLevel } from '../src/utils/onboarding';
import { wordOfDayService } from '../src/services/wordOfDayService';
import { DifficultySelector } from '../src/components/onboarding';
import { DIFFICULTY_LEVELS } from '../src/constants';
import themes from '../src/theme/colors';
import { useColorScheme } from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';

// Onboarding steps
enum OnboardingStep {
  WELCOME = 0,
  DIFFICULTY = 1,
}

export default function OnboardingScreen() {
  const { isReady, theme } = useThemeReady();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.WELCOME);
  const [selectedDifficulty, setSelectedDifficulty] = useState(DIFFICULTY_LEVELS.INTERMEDIATE);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const fallbackColors = isDark ? themes.default.dark : themes.default.light;

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

  const handleNext = () => {
    setCurrentStep(OnboardingStep.DIFFICULTY);
  };

  const handleDifficultySelect = (level: string) => {
    setSelectedDifficulty(level);
  };

  const handleGetStarted = async () => {
    // Prevent double tap
    if (isNavigating) return;
    
    // Set state to show we're processing
    setIsNavigating(true);
    
    try {
      // Save the selected difficulty level
      await setDifficultyLevel(selectedDifficulty);
      
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
      router.replace({
        pathname: '/(tabs)',
        params: {
          animation: 'slide_from_right'
        }
      });
    } catch (error) {
      console.error('Error during onboarding completion:', error);
      setIsNavigating(false); // Reset state on error
    }
  };

  // Welcome step content
  const renderWelcomeStep = () => {
    return (
      <Box flex={1} padding="xl" style={styles.screenContainer}>
        <Box flex={1} justify="center" align="center">
          <Text 
            variant="h1" 
            color={themeColors.primary} 
            style={{ 
              marginBottom: spacing.lg,
              fontSize: 52,
              fontWeight: '700',
            }}
          >
            OneWord
          </Text>
          
          <Text 
            variant="h3" 
            color={themeColors.text.primary} 
            align="center"
            style={{ 
              marginBottom: spacing.lg,
              fontSize: 24,
              fontWeight: '600',
            }}
          >
            Expand Your Vocabulary
          </Text>
          
          <Text 
            variant="body1" 
            color={themeColors.text.secondary} 
            align="center"
            style={{ 
              marginBottom: spacing.xl,
              fontSize: 18,
              lineHeight: 27,
            }}
          >
            Learn one new word every day. Build your vocabulary systematically with our curated selection of words.
          </Text>
        </Box>
        
        <Box width="100%" style={styles.buttonContainer}>
          <Button
            title="Next"
            variant="primary"
            fullWidth
            onPress={handleNext}
          />
        </Box>
      </Box>
    );
  };

  // Difficulty selection step content
  const renderDifficultyStep = () => {
    return (
      <Box flex={1} padding="xl" style={styles.screenContainer}>
        <Box flex={1} justify="center" align="center">
          <DifficultySelector 
            selectedLevel={selectedDifficulty}
            onSelectLevel={handleDifficultySelect}
          />
        </Box>
        
        <Box width="100%" style={styles.buttonContainer}>
          <Button
            title={isNavigating ? "Loading..." : "Get Started"}
            variant="primary"
            fullWidth
            onPress={handleGetStarted}
            disabled={isNavigating}
          />
          
          {isNavigating && (
            <ActivityIndicator 
              size="small" 
              color={themeColors.primary}
              style={{ marginTop: spacing.md }}
            />
          )}
        </Box>
      </Box>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      {currentStep === OnboardingStep.WELCOME && renderWelcomeStep()}
      {currentStep === OnboardingStep.DIFFICULTY && renderDifficultyStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  buttonContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 