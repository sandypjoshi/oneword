import React from 'react';
import { StyleSheet, View, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useNavigation, useRouter } from 'expo-router';
import { Box } from '../src/components/layout';
import { Text } from '../src/components/ui';
import Icon from '../src/components/ui/Icon';
import { useThemeReady } from '../src/hooks';
import { useTheme } from '../src/theme/ThemeProvider';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Theme selector component
const ThemeSelector = () => {
  const { themeName, setThemeName, colorMode, setColorMode, colors, spacing } = useTheme();

  const themes = [
    { value: 'default', label: 'Default Theme' },
    { value: 'quill', label: 'Quill Theme (Dictionary Style)' },
    { value: 'aura', label: 'Aura Theme' },
  ];

  const colorModes = [
    { value: 'light', label: 'Light Mode' },
    { value: 'dark', label: 'Dark Mode' },
    { value: 'system', label: 'System Default' },
  ];

  return (
    <View style={{ width: '100%' }}>
      {/* Theme Selection */}
      <Text variant="h4" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>Theme Style</Text>
      <View style={{ gap: spacing.sm }}>
        {themes.map((theme) => (
          <TouchableOpacity
            key={theme.value}
            style={[
              styles.themeButton,
              {
                backgroundColor: themeName === theme.value ? colors.primary + '20' : colors.background.secondary,
                borderColor: themeName === theme.value ? colors.primary : colors.border.light,
                padding: spacing.md,
              }
            ]}
            onPress={() => setThemeName(theme.value as any)}
          >
            <Text>{theme.label}</Text>
            
            {themeName === theme.value && (
              <Icon 
                name="checkCircleBold" 
                color={colors.primary} 
                size={18} 
                variant="bold" 
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Color Mode Selection */}
      <Text variant="h4" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>Appearance</Text>
      <View style={{ gap: spacing.sm }}>
        {colorModes.map((mode) => (
          <TouchableOpacity
            key={mode.value}
            style={[
              styles.themeButton,
              {
                backgroundColor: colorMode === mode.value ? colors.primary + '20' : colors.background.secondary,
                borderColor: colorMode === mode.value ? colors.primary : colors.border.light,
                padding: spacing.md,
              }
            ]}
            onPress={() => setColorMode(mode.value as any)}
          >
            <Text>{mode.label}</Text>
            
            {colorMode === mode.value && (
              <Icon 
                name="checkCircleBold" 
                color={colors.primary} 
                size={18} 
                variant="bold" 
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default function ThemeSettingsScreen() {
  const { isReady, theme } = useThemeReady();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark } = useTheme();
  
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
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.background.primary,
          },
          headerTintColor: colors.text.primary,
        }} 
      />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
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
          <Text variant="h2" align="center" style={{ marginBottom: spacing.md }}>Theme Settings</Text>
          <Text 
            variant="body1" 
            color={colors.text.secondary}
            align="center"
            style={{ marginBottom: spacing.xl }}
          >
            Customize the appearance of your app
          </Text>
          
          {/* Theme Selector */}
          <ThemeSelector />
          
          <Text 
            variant="caption" 
            style={{ marginTop: spacing.xl, textAlign: 'center' }}
            color={colors.text.hint}
          >
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