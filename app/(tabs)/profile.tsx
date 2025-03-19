import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Box } from '../../src/components/layout';
import { Text, Button } from '../../src/components/ui';
import { useThemeReady } from '../../src/hooks';
import { resetOnboardingStatus } from '../../src/utils/onboarding';
import { useRouter, Link } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import Icon from '../../src/components/ui/Icon';

// Simple theme selector component for development
const DevThemeSelector = () => {
  const { themeName, setThemeName, colorMode, setColorMode, colors, spacing } = useTheme();

  const themes = [
    { value: 'default', label: 'Default Theme' },
    { value: 'quill', label: 'Quill Theme' },
    { value: 'aura', label: 'Aura Theme' },
  ];

  const colorModes = [
    { value: 'light', label: 'Light Mode' },
    { value: 'dark', label: 'Dark Mode' },
    { value: 'system', label: 'System Default' },
  ];

  return (
    <View style={{ width: '100%', marginTop: spacing.lg }}>
      <Text variant="headingSmall">Theme Settings (Dev)</Text>
      
      {/* Theme Selection */}
      <Text variant="headingSmall" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>Theme Style</Text>
      <View style={{ gap: spacing.sm }}>
        {themes.map((theme) => (
          <TouchableOpacity
            key={theme.value}
            style={[
              styles.themeButton,
              {
                backgroundColor: themeName === theme.value ? colors.primary + '20' : colors.background.secondary,
                borderColor: themeName === theme.value ? colors.primary : colors.border.light,
              }
            ]}
            onPress={() => setThemeName(theme.value as any)}
          >
            <Text>{theme.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Color Mode Selection */}
      <Text variant="headingSmall" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>Appearance</Text>
      <View style={{ gap: spacing.sm }}>
        {colorModes.map((mode) => (
          <TouchableOpacity
            key={mode.value}
            style={[
              styles.themeButton,
              {
                backgroundColor: colorMode === mode.value ? colors.primary + '20' : colors.background.secondary,
                borderColor: colorMode === mode.value ? colors.primary : colors.border.light,
              }
            ]}
            onPress={() => setColorMode(mode.value as any)}
          >
            <Text>{mode.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default function ProfileScreen() {
  const { isReady, theme } = useThemeReady();
  const router = useRouter();

  if (!isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme?.colors?.background?.primary }]}>
        <ActivityIndicator size="large" color={theme?.colors?.primary || "#0000ff"} />
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Box padding="lg" align="center">
        <Text variant="headingMedium">Profile</Text>
        <Text 
          variant="bodyMedium"
          color={colors.text.secondary}
          align="center"
        >
          Profile section coming soon...
        </Text>
        
        {/* Link to Theme Settings */}
        <Box marginTop="lg" width="100%">
          <Link href="/theme-settings" asChild>
            <TouchableOpacity
              style={[
                styles.settingsLink,
                { 
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                }
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text>Theme Settings</Text>
                <Icon name="altArrowRightLinear" size={18} color={colors.text.secondary} variant="linear" />
              </View>
            </TouchableOpacity>
          </Link>
        </Box>
        
        {/* Development/Testing button */}
        <Box marginTop="xl" width="100%">
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
    </ScrollView>
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
  resetButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  settingsLink: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
  },
  themeButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
}); 