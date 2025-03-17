import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import Icon from './ui/Icon';

/**
 * A component that allows users to switch between available themes and color modes
 */
const ThemeSwitcher: React.FC = () => {
  const { 
    colorMode, 
    themeName, 
    setColorMode, 
    setThemeName, 
    colors,
    spacing,
    typography
  } = useTheme();

  // Available color modes
  const colorModes = [
    { value: 'light', label: 'Light Mode' },
    { value: 'dark', label: 'Dark Mode' },
    { value: 'system', label: 'System Default' },
  ];

  // Available themes
  const themes = [
    { value: 'default', label: 'Default Theme' },
    { value: 'quill', label: 'Quill Theme' },
    { value: 'aura', label: 'Aura Theme' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <View style={[styles.section, { marginBottom: spacing.lg }]}>
        <Text style={[styles.sectionTitle, { 
          color: colors.text.primary,
          fontSize: typography.fontSizes.lg,
          fontWeight: typography.fontWeights.bold,
          marginBottom: spacing.md
        }]}>
          Appearance
        </Text>

        {/* Color Mode Selection */}
        <View style={styles.optionGroup}>
          <Text style={[styles.groupTitle, { 
            color: colors.text.secondary,
            fontSize: typography.fontSizes.md,
            marginBottom: spacing.sm
          }]}>
            Color Mode
          </Text>
          
          {colorModes.map((mode) => (
            <TouchableOpacity
              key={mode.value}
              style={[
                styles.option,
                {
                  backgroundColor: colorMode === mode.value 
                    ? colors.primary + '20' // 20% opacity
                    : 'transparent',
                  borderColor: colors.border.light,
                  padding: spacing.md,
                  marginBottom: spacing.sm
                }
              ]}
              onPress={() => setColorMode(mode.value as any)}
            >
              <Text style={[
                styles.optionText,
                { 
                  color: colors.text.primary,
                  fontSize: typography.fontSizes.md
                }
              ]}>
                {mode.label}
              </Text>
              
              {colorMode === mode.value && (
                <Icon 
                  name="checkmark" 
                  color={colors.primary} 
                  size={18} 
                  variant="bold"
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme Selection */}
        <View style={[styles.optionGroup, { marginTop: spacing.lg }]}>
          <Text style={[styles.groupTitle, { 
            color: colors.text.secondary,
            fontSize: typography.fontSizes.md,
            marginBottom: spacing.sm
          }]}>
            Theme
          </Text>
          
          {themes.map((theme) => (
            <TouchableOpacity
              key={theme.value}
              style={[
                styles.option,
                {
                  backgroundColor: themeName === theme.value 
                    ? colors.primary + '20' // 20% opacity
                    : 'transparent',
                  borderColor: colors.border.light,
                  padding: spacing.md,
                  marginBottom: spacing.sm
                }
              ]}
              onPress={() => setThemeName(theme.value as any)}
            >
              <Text style={[
                styles.optionText,
                { 
                  color: colors.text.primary,
                  fontSize: typography.fontSizes.md
                }
              ]}>
                {theme.label}
              </Text>
              
              {themeName === theme.value && (
                <Icon 
                  name="checkmark" 
                  color={colors.primary} 
                  size={18} 
                  variant="bold"
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  optionGroup: {
    marginBottom: 20,
  },
  groupTitle: {
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionText: {
    flex: 1,
  },
});

export default ThemeSwitcher; 