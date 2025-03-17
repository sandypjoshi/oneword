import React from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Box } from '../src/components/layout';
import { Text } from '../src/components/ui';
import { useThemeReady } from '../src/hooks';
import { useRouter } from 'expo-router';
import { setOnboardingComplete } from '../src/utils/onboarding';

export default function OnboardingScreen() {
  const { isReady, theme } = useThemeReady();
  const router = useRouter();

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const { spacing, colors } = theme;

  const handleGetStarted = async () => {
    // Mark onboarding as complete
    await setOnboardingComplete();
    // Navigate to home screen - animation is handled by Stack navigator
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Box flex={1} justify="center" align="center" padding="xl">
        <Text 
          variant="h1" 
          color={colors.primary} 
          style={{ marginBottom: spacing.lg }}
        >
          OneWord
        </Text>
        
        <Text 
          variant="h2" 
          color={colors.text.primary} 
          align="center"
          style={{ marginBottom: spacing.lg }}
        >
          Expand Your Vocabulary
        </Text>
        
        <Text 
          variant="body1" 
          color={colors.text.secondary} 
          align="center"
          style={{ marginBottom: spacing.xl }}
        >
          Learn one new word every day. Build your vocabulary systematically with our curated selection of words.
        </Text>
        
        <TouchableOpacity
          style={[
            styles.button,
            { 
              backgroundColor: colors.primary,
              padding: spacing.md,
              marginTop: spacing.lg
            }
          ]}
          onPress={handleGetStarted}
        >
          <Text variant="button" color={colors.background.primary}>
            Get Started
          </Text>
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