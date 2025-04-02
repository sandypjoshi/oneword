import React, { useState, useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Box } from '../../src/components/layout';
import { Text, Button } from '../../src/components/ui';
import { useThemeReady } from '../../src/hooks';
import { resetOnboardingStatus } from '../../src/utils/onboarding';
import { useRouter, Link } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import Icon from '../../src/components/ui/Icon';
import { MeshGradient } from '../../src/components/common';
import { getGradientIds } from '../../src/theme/primitives/gradients';
import { useCardStore } from '../../src/store/cardStore';
import { useWordStore } from '../../src/store/wordStore';
import { useProgressStore } from '../../src/store/progressStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sample profile card component with gradient background
interface GradientProfileCardProps {
  onChangeGradient?: (gradientId: string) => void;
}

const GradientProfileCard: React.FC<GradientProfileCardProps> = ({ onChangeGradient }) => {
  const { colors, spacing, colorMode } = useTheme();
  const [gradientIndex, setGradientIndex] = useState(0);
  const [seedIndex, setSeedIndex] = useState(0);
  
  // Get all gradient IDs for the current theme
  const gradientIds = useMemo(() => getGradientIds(colorMode), [colorMode]);
  
  // Pre-defined seeds for different patterns
  // These will remain constant regardless of which gradient is selected
  const seeds = [14245, 67890, 90180, 13579, 99999];
  
  const handlePress = () => {
    // Cycle through gradients on tap
    const nextIndex = (gradientIndex + 1) % gradientIds.length;
    setGradientIndex(nextIndex);
    if (onChangeGradient) onChangeGradient(gradientIds[nextIndex]);
  };
  
  const handleLongPress = () => {
    // Cycle through seeds (patterns) on long press
    const nextSeedIndex = (seedIndex + 1) % seeds.length;
    setSeedIndex(nextSeedIndex);
  };
  
  return (
    <TouchableOpacity 
      style={[styles.profileCard, { borderWidth: 1, borderColor: colors.border.light }]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={300}
      activeOpacity={0.9}
    >
      {/* Using MeshGradient with separate gradient ID and seed */}
      <MeshGradient 
        gradientId={gradientIds[gradientIndex]}
        seed={seeds[seedIndex]}
        withBorder={true}
        borderOpacity={0.2}
        withShadow={false}
        zIndex={-1}
      />
      
      {/* Profile content */}
      <View style={styles.profileContent}>
        <View style={[styles.avatarContainer, { borderColor: colors.background.primary }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '40' }]}>
            <Icon name="user" size={32} color={colors.primary} variant="bold" />
          </View>
        </View>
        
        <Text 
          variant="headingMedium" 
          style={{ textAlign: 'center', marginTop: spacing.xs }}
        >
          Welcome!
        </Text>
        
        <Text 
          variant="bodySmall"
          color={colors.text.secondary}
          style={{ textAlign: 'center', marginTop: spacing.xs }}
        >
          {gradientIds[gradientIndex]}
        </Text>
        
        <Text 
          variant="bodySmall"
          color={colors.text.tertiary}
          style={{ textAlign: 'center', marginTop: spacing.xs, fontSize: 12 }}
        >
          Tap to change gradient • Long press to change pattern (Seed: {seeds[seedIndex]})
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Simple theme selector component for development
const DevThemeSelector = () => {
  const { themeName, setThemeName, colorMode, setColorMode, colors, spacing } = useTheme();

  const themes = [
    { value: 'default', label: 'Default Theme' },
    { value: 'quill', label: 'Quill Theme' },
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
  const [currentGradient, setCurrentGradient] = useState('morning-sky');
  
  // Get the reset functions from stores
  const resetCardStore = useCardStore(state => state.resetCardState);
  const fetchWords = useWordStore(state => state.fetchWords);
  const resetStreak = useProgressStore(state => state.resetStreak);

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
  
  const handleResetAllData = async () => {
    Alert.alert(
      "Reset All Data",
      "This will reset all your progress data, words, and cards. This action cannot be undone. Do you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear all AsyncStorage keys for the stores
              await AsyncStorage.multiRemove([
                'card-ui-storage',
                'word-progress-storage',
                'user-progress-storage'
              ]);
              
              // Reset in-memory state
              resetStreak();
              fetchWords(14, true); // Force refresh words
              
              Alert.alert(
                "Data Reset Complete",
                "All app data has been reset successfully.",
                [{ text: "OK" }]
              );
            } catch (error) {
              console.error("Error resetting data:", error);
              Alert.alert("Error", "Failed to reset app data");
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Box padding="lg" align="center">
        <Text variant="headingMedium">Profile</Text>
        
        {/* Add the gradient profile card */}
        <Box width="100%" marginTop="md">
          <GradientProfileCard 
            onChangeGradient={setCurrentGradient}
          />
          <Text 
            variant="bodySmall"
            color={colors.text.tertiary}
            align="center"
            style={{ marginTop: spacing.sm }}
          >
            Using MeshGradient component with "{currentGradient}" palette
          </Text>
        </Box>
        
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
        
        {/* Development/Testing buttons */}
        <Box marginTop="xl" width="100%">
          <TouchableOpacity
            style={[
              styles.resetButton,
              { 
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.medium,
                marginTop: spacing.md
              }
            ]}
            onPress={handleResetOnboarding}
          >
            <Text color={colors.text.secondary}>Reset Onboarding (Dev Only)</Text>
          </TouchableOpacity>
          
          {/* Reset Data Button */}
          <TouchableOpacity
            style={[
              styles.resetButton,
              { 
                backgroundColor: colors.error + '20',
                borderColor: colors.error,
                marginTop: spacing.md
              }
            ]}
            onPress={handleResetAllData}
          >
            <Text color={colors.error}>Reset Data</Text>
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
  profileCard: {
    width: '100%',
    borderRadius: 16,
    height: 480, // Increased from 160
    overflow: 'hidden',
    position: 'relative',
    marginTop: 8,
    marginBottom: 8,
  },
  profileContent: {
    padding: 20,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    width: 60, // Reduced from 80
    height: 60, // Reduced from 80
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3, // Reduced from 4
  },
  avatar: {
    width: 50, // Reduced from 68
    height: 50, // Reduced from 68
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 