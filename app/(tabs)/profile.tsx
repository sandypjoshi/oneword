import React from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Box } from '../../src/components/layout';
import { Text } from '../../src/components/ui';
import { useThemeReady } from '../../src/hooks';
import { resetOnboardingStatus } from '../../src/utils/onboarding';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { isReady, theme } = useThemeReady();
  const router = useRouter();

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const { colors, spacing } = theme;

  const handleResetOnboarding = async () => {
    try {
      await resetOnboardingStatus();
      Alert.alert(
        "Onboarding Reset",
        "Onboarding status has been reset. The app will restart to show the onboarding screen.",
        [{ text: "OK", onPress: () => router.replace('/onboarding') }]
      );
    } catch (error) {
      console.error("Error resetting onboarding:", error);
      Alert.alert("Error", "Failed to reset onboarding status");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Box padding="lg" flex={1} align="center" justify="center">
        <Text variant="h2">Profile</Text>
        <Text 
          variant="body1" 
          color={colors.text.secondary}
          align="center"
          style={styles.subtitle}
        >
          Coming Soon
        </Text>
        
        {/* Development/Testing button */}
        <Box marginTop="xl">
          <TouchableOpacity
            style={[
              styles.resetButton,
              { 
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.medium,
                marginTop: spacing.xl
              }
            ]}
            onPress={handleResetOnboarding}
          >
            <Text color={colors.text.secondary}>Reset Onboarding (Dev Only)</Text>
          </TouchableOpacity>
        </Box>
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
  subtitle: {
    marginTop: 8,
  },
  resetButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
}); 