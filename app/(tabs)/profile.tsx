import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Box } from '../../src/components/layout';
import { Text, Button } from '../../src/components/ui';
import { useThemeReady } from '../../src/hooks';
import { resetOnboardingStatus } from '../../src/utils/onboarding';
import { useRouter, Link } from 'expo-router';
import { useTheme } from '../../src/theme';
import Icon from '../../src/components/ui/Icon';
import { MeshGradient } from '../../src/components/common';
import { getGradientIds } from '../../src/theme/primitives/gradients';
import { useWordCardStore } from '../../src/store/wordCardStore';
import { useWordStore } from '../../src/store/wordStore';
import { useProgressStore } from '../../src/store/progressStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { radius } from '../../src/theme/styleUtils';

// Sample profile card component with gradient background
interface GradientProfileCardProps {
  onChangeGradient?: (gradientId: string) => void;
}

const GradientProfileCard: React.FC<GradientProfileCardProps> = ({
  onChangeGradient,
}) => {
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
      style={[
        styles.profileCard,
        { borderWidth: 1, borderColor: colors.border.light },
      ]}
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
        <View
          style={[
            styles.avatarContainer,
            { borderColor: colors.background.primary },
          ]}
        >
          <View
            style={[styles.avatar, { backgroundColor: colors.primary + '40' }]}
          >
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
          Tap to change gradient • Long press to change pattern (Seed:{' '}
          {seeds[seedIndex]})
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Simple theme selector component for development
const DevThemeSelector = () => {
  const { themeName, setThemeName, colorMode, setColorMode, colors, spacing } =
    useTheme();

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
      <Text
        variant="headingSmall"
        style={{ marginTop: spacing.md, marginBottom: spacing.sm }}
      >
        Theme Style
      </Text>
      <View style={{ gap: spacing.sm }}>
        {themes.map(theme => (
          <TouchableOpacity
            key={theme.value}
            style={[
              styles.themeButton,
              {
                backgroundColor:
                  themeName === theme.value
                    ? colors.primary + '20'
                    : colors.background.secondary,
                borderColor:
                  themeName === theme.value
                    ? colors.primary
                    : colors.border.light,
              },
            ]}
            onPress={() => setThemeName(theme.value as any)}
          >
            <Text color={colors.text.primary}>{theme.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Color Mode Selection */}
      <Text
        variant="headingSmall"
        style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}
      >
        Appearance
      </Text>
      <View style={{ gap: spacing.sm }}>
        {colorModes.map(mode => (
          <TouchableOpacity
            key={mode.value}
            style={[
              styles.themeButton,
              {
                backgroundColor:
                  colorMode === mode.value
                    ? colors.primary + '20'
                    : colors.background.secondary,
                borderColor:
                  colorMode === mode.value
                    ? colors.primary
                    : colors.border.light,
              },
            ]}
            onPress={() => setColorMode(mode.value as any)}
          >
            <Text color={colors.text.primary}>{mode.label}</Text>
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
  const resetCardState = useWordCardStore(state => state.resetCardState);
  const fetchWords = useWordStore(state => state.fetchWords);
  const resetStreak = useProgressStore(state => state.resetStreak);
  const { streak, longestStreak, totalWordsLearned, lastCompletedDate } =
    useProgressStore();
  const resetProgressState = useProgressStore(
    state => state._dangerouslyResetAllState
  );
  const resetWordCardState = useWordCardStore(
    state => state._dangerouslyResetAllState
  );
  const resetWordState = useWordStore(state => state._dangerouslyResetAllState);

  if (!isReady) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme?.colors?.background?.primary },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme?.colors?.primary || '#0000ff'}
        />
      </View>
    );
  }

  const { colors, spacing } = theme;

  const handleResetOnboarding = async () => {
    try {
      await resetOnboardingStatus();
      Alert.alert(
        'Onboarding Reset',
        'Onboarding status has been reset. The app will restart to show the onboarding screen.',
        [{ text: 'OK', onPress: () => router.replace('/onboarding') }]
      );
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      Alert.alert('Error', 'Failed to reset onboarding status');
    }
  };

  const handleResetAllData = async () => {
    Alert.alert(
      'Reset All Data',
      'This will reset all your progress data, words, and cards. This action cannot be undone. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all AsyncStorage keys for the stores
              await AsyncStorage.multiRemove([
                'word-progress-storage',
                'user-progress-storage',
                'word-card-storage',
              ]);

              // Also reset in-memory state using the _dangerouslyResetAllState functions
              console.log('Resetting in-memory store states...');
              resetProgressState(); // Calls _dangerouslyResetAllState for progress
              resetWordCardState(); // Calls _dangerouslyResetAllState for word cards
              resetWordState(); // Call word store reset

              // Optional: Trigger a refetch after reset to load fresh data
              // fetchWords(14, true);

              Alert.alert(
                'Data Reset Complete',
                'All app data has been reset successfully.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error resetting data:', error);
              Alert.alert('Error', 'Failed to reset app data');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background.primary }}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
    >
      <Box padding="lg" alignItems="center">
        <Text variant="headingMedium">Profile</Text>

        {/* Profile card with gradient background */}
        <GradientProfileCard onChangeGradient={setCurrentGradient} />

        {/* User stats */}
        <View style={{ width: '100%', marginTop: spacing.xl }}>
          <Text variant="headingSmall">Your Stats</Text>

          <View
            style={[
              styles.statsContainer,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            <View style={styles.statItem}>
              <Text variant="headingMedium" align="center">
                {streak}
              </Text>
              <Text
                variant="bodySmall"
                align="center"
                color={colors.text.secondary}
              >
                Current Streak
              </Text>
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.border.light }]}
            />

            <View style={styles.statItem}>
              <Text variant="headingMedium" align="center">
                {longestStreak}
              </Text>
              <Text
                variant="bodySmall"
                align="center"
                color={colors.text.secondary}
              >
                Longest Streak
              </Text>
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.border.light }]}
            />

            <View style={styles.statItem}>
              <Text variant="headingMedium" align="center">
                {totalWordsLearned}
              </Text>
              <Text
                variant="bodySmall"
                align="center"
                color={colors.text.secondary}
              >
                Words Learned
              </Text>
            </View>
          </View>
        </View>

        {/* Dev Buttons Section */}
        <Box width="100%" marginTop="xl">
          <Text variant="headingSmall">Developer Tools</Text>
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            <Button
              variant="secondary"
              onPress={handleResetOnboarding}
              title="Reset Onboarding Status"
            />

            <Button
              variant="secondary"
              onPress={handleResetAllData}
              title="Reset All User Data"
            />
          </View>

          <DevThemeSelector />
        </Box>
      </Box>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    width: '100%',
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginTop: 16,
    height: 180,
    position: 'relative',
  },
  profileContent: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 12,
  },
  avatar: {
    flex: 1,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: radius.md,
    marginTop: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    marginHorizontal: 8,
  },
  themeButton: {
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
