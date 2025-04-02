import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  ActivityIndicator, 
  Animated, 
  Dimensions,
  Image 
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
import { useTheme } from '../src/theme/ThemeProvider';

// Import logo image
const logoImage = require('../src/assets/images/logo.png');

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
  const { effectiveColorMode } = useTheme();
  const isDark = effectiveColorMode === 'dark';
  const fallbackColors = isDark ? themes.default.dark : themes.default.light;
  
  // Animation values
  const { width } = Dimensions.get('window');
  const welcomePosition = useRef(new Animated.Value(0)).current;
  const difficultyPosition = useRef(new Animated.Value(width)).current;

  // Memoized animation configuration
  const animationConfig = useMemo(() => ({
    duration: 300,
    useNativeDriver: true,
    width,
  }), [width]);

  // Define all hooks at the top level - regardless of isReady
  const themeColors = isReady ? theme.colors : fallbackColors;
  // Ensure we have default values for spacing if theme isn't ready
  const themeSpacing = isReady ? theme.spacing : { 
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 
  };

  // Memoize the navigation handlers
  const handleNext = useCallback(() => {
    // Animate the transition
    Animated.parallel([
      Animated.timing(welcomePosition, {
        toValue: -animationConfig.width,
        duration: animationConfig.duration,
        useNativeDriver: animationConfig.useNativeDriver,
      }),
      Animated.timing(difficultyPosition, {
        toValue: 0,
        duration: animationConfig.duration,
        useNativeDriver: animationConfig.useNativeDriver,
      })
    ]).start(() => {
      // Update step after animation completes
      setCurrentStep(OnboardingStep.DIFFICULTY);
    });
  }, [welcomePosition, difficultyPosition, animationConfig]);

  const handleDifficultySelect = useCallback((level: string) => {
    setSelectedDifficulty(level);
  }, []);

  const handleGetStarted = useCallback(async () => {
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
  }, [isNavigating, selectedDifficulty, router]);

  // Memoize the render functions
  const renderWelcomeStep = useCallback(() => {
    return (
      <Animated.View 
        style={[
          styles.screenContainer, 
          { transform: [{ translateX: welcomePosition }] }
        ]}
      >
        {/* Image placeholder - upper half */}
        <Box style={[
          styles.imageContainer, 
          { backgroundColor: themeColors.background.primary }
        ]}>
          <Image 
            source={logoImage}
            style={styles.welcomeImage}
            resizeMode="contain"
          />
        </Box>
        
        {/* Content - lower half */}
        <Box style={[
          styles.contentContainer,
          { paddingHorizontal: themeSpacing.xl }
        ]}>
          <Box style={[styles.textContainer, { paddingTop: themeSpacing.xl }]}>
            <Text 
              variant="displayMedium" 
              color={themeColors.text.primary}
              align="center" 
              style={{ marginBottom: themeSpacing.md }}
            >
              Master a New Word Every Day
            </Text>
            
            <Text 
              variant="bodyMedium" 
              color={themeColors.text.secondary} 
              align="center"
              style={{ paddingHorizontal: themeSpacing.sm }}
            >
              Expand your vocabulary with a daily word in just 1 minute
            </Text>
          </Box>
          
          <Box style={{ paddingBottom: themeSpacing.xl }}>
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
  }, [welcomePosition, themeColors, handleNext, themeSpacing]);

  // Difficulty selection step content
  const renderDifficultyStep = useCallback(() => {
    const hasSelection = selectedDifficulty !== null;
    
    return (
      <Animated.View 
        style={[
          styles.screenContainer,
          styles.absolutePosition,
          { transform: [{ translateX: difficultyPosition }] }
        ]}
      >
        {/* Main content */}
        <Box style={[
          styles.contentContainer,
          { paddingHorizontal: themeSpacing.xl }
        ]}>
          <Box 
            flex={1} 
            style={{
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <DifficultySelector 
              selectedLevel={selectedDifficulty}
              onSelectLevel={handleDifficultySelect}
              hasSelection={hasSelection}
            />
          </Box>
          
          <Box style={{ paddingBottom: themeSpacing.xl }}>
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
                style={{ marginTop: themeSpacing.md }}
              />
            )}
          </Box>
        </Box>
      </Animated.View>
    );
  }, [
    difficultyPosition, 
    selectedDifficulty, 
    themeColors, 
    themeSpacing, 
    handleDifficultySelect, 
    handleGetStarted, 
    isNavigating
  ]);

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
    flex: 1.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeImage: {
    width: '100%',
    height: '100%',
    maxHeight: 240,
  },
  contentContainer: {
    flex: 1.2,
    justifyContent: 'space-between',
  },
  textContainer: {
  },
  buttonPlaceholder: {
    height: 50,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 