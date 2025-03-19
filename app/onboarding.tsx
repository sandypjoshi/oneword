import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  ActivityIndicator, 
  Animated, 
  Dimensions 
} from 'react-native';
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
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const fallbackColors = isDark ? themes.default.dark : themes.default.light;
  
  // Animation values
  const { width } = Dimensions.get('window');
  const welcomePosition = useRef(new Animated.Value(0)).current;
  const difficultyPosition = useRef(new Animated.Value(width)).current;

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
    // Animate the transition
    Animated.parallel([
      Animated.timing(welcomePosition, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(difficultyPosition, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Update step after animation completes
      setCurrentStep(OnboardingStep.DIFFICULTY);
    });
  };

  const handleDifficultySelect = (level: string) => {
    setSelectedDifficulty(level);
  };

  const handleGetStarted = async () => {
    // Prevent double tap
    if (isNavigating) return;
    
    // Check if we have a selected difficulty
    if (!selectedDifficulty) return;
    
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
      <Animated.View 
        style={[
          styles.screenContainer, 
          { transform: [{ translateX: welcomePosition }] }
        ]}
      >
        {/* Image placeholder - upper half */}
        <Box style={styles.imageContainer}>
          {/* You will add the image here later */}
        </Box>
        
        {/* Content - lower half */}
        <Box style={styles.contentContainer}>
          <Box style={styles.textContainer}>
            <Text 
              variant="displayLarge" 
              color={themeColors.text.primary}
              align="center" 
              style={styles.title}
            >
              Master a New Word Every Day
            </Text>
            
            <Text 
              variant="bodyLarge" 
              color={themeColors.text.secondary} 
              align="center"
              style={styles.subtitle}
            >
              Expand your vocabulary with a daily word in just 1 minute
            </Text>
          </Box>
          
          <Box width="100%" style={styles.buttonContainer}>
            <Button
              title="Get Started"
              variant="primary"
              fullWidth
              onPress={handleNext}
            />
          </Box>
        </Box>
      </Animated.View>
    );
  };

  // Difficulty selection step content
  const renderDifficultyStep = () => {
    const hasSelection = selectedDifficulty !== null;
    
    return (
      <Animated.View 
        style={[
          styles.screenContainer, 
          styles.absolutePosition,
          { transform: [{ translateX: difficultyPosition }] }
        ]}
      >
        <Box 
          flex={1} 
          justify="center" 
          align="center" 
          padding="lg"
          paddingTop="xl"
          paddingBottom="xl"
        >
          <DifficultySelector 
            selectedLevel={selectedDifficulty}
            onSelectLevel={handleDifficultySelect}
            hasSelection={hasSelection}
          />
        </Box>
        
        <Box width="100%" style={styles.buttonContainer} padding="lg">
          {hasSelection ? (
            <Button
              title={isNavigating ? "Loading..." : "Continue"}
              variant="primary"
              fullWidth
              onPress={handleGetStarted}
              disabled={isNavigating}
            />
          ) : (
            <View style={styles.buttonPlaceholder} />
          )}
          
          {isNavigating && (
            <ActivityIndicator 
              size="small" 
              color={themeColors.primary}
              style={{ marginTop: spacing.md }}
            />
          )}
        </Box>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      {renderWelcomeStep()}
      {renderDifficultyStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  screenContainer: {
    flex: 1,
    width: '100%',
  },
  absolutePosition: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageContainer: {
    flex: 1.5,
    backgroundColor: '#F5F5F5', // Placeholder color
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  textContainer: {
    paddingTop: 32,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    marginBottom: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    paddingBottom: 20,
  },
  buttonPlaceholder: {
    height: 56, // Same height as the Button component
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 