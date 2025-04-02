import React from 'react';
import { StyleSheet, View, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useNavigation, useRouter } from 'expo-router';
import { Box } from '../src/components/layout';
import { Text, ButtonGroup } from '../src/components/ui';
import Icon from '../src/components/ui/Icon';
import { useThemeReady } from '../src/hooks';
import { useTheme } from '../src/theme/ThemeProvider';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { applyElevation } from '../src/theme/styleUtils';

// Theme selector component
const ThemeSelector = () => {
  const { themeName, setThemeName, colorMode, setColorMode, colors, spacing } = useTheme();

  const themeOptions = [
    { value: 'default', label: 'Default Theme', description: 'Clean and modern design' },
    { value: 'quill', label: 'Quill Theme', description: 'Dictionary style with serif typography' },
  ];

  const colorModeOptions = [
    { value: 'light', label: 'Light Mode', description: 'Bright and clear interface' },
    { value: 'dark', label: 'Dark Mode', description: 'Easy on the eyes at night' },
    { value: 'system', label: 'System Default', description: 'Follow device settings' },
  ];

  return (
    <View style={{ width: '100%' }}>
      {/* Theme Selection */}
      <Text 
        variant="headingSmall" 
        style={{ marginTop: spacing.md, marginBottom: spacing.sm }}
        serif={true}
      >
        Theme Style
      </Text>
      
      <ButtonGroup
        options={themeOptions}
        selectedValue={themeName}
        onSelect={(value) => setThemeName(value as any)}
      />
      
      {/* Color Mode Selection */}
      <Text 
        variant="headingSmall" 
        style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}
        serif={true}
      >
        Appearance
      </Text>
      
      <ButtonGroup
        options={colorModeOptions}
        selectedValue={colorMode}
        onSelect={(value) => setColorMode(value as any)}
      />
    </View>
  );
};

export default function ThemeSettingsScreen() {
  const { isReady, theme } = useThemeReady();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { effectiveColorMode } = useTheme();
  
  if (!isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme?.colors?.background?.primary }]}>
        <ActivityIndicator size="large" color={theme?.colors?.primary || "#0000ff"} />
      </View>
    );
  }

  const { colors, spacing } = theme;

  return (
    <>
      {/* Configure the header */}
      <Stack.Screen 
        options={{
          headerTitle: "Theme Settings",
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background.primary,
            ...applyElevation('none'),
          },
          headerTintColor: colors.text.primary,
        }} 
      />
      <StatusBar style={effectiveColorMode === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView 
        style={[
          styles.container, 
          { 
            backgroundColor: colors.background.primary,
          }
        ]}
        contentContainerStyle={{
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.lg,
        }}
      >
        <Box padding="lg">
          <Text 
            variant="headingLarge" 
            align="center" 
            style={{ marginBottom: spacing.md }}
            serif={true}
          >
            Theme Settings
          </Text>
          <Text 
            variant="bodyMedium"
            align="center"
          >
            Customize the appearance of your app
          </Text>
          
          {/* Theme Selector */}
          <ThemeSelector />
          
          <Text variant="caption">
            Theme settings are saved automatically
          </Text>
        </Box>
      </ScrollView>
    </>
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
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1,
  },
}); 