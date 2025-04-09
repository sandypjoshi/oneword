import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { ButtonGroup } from './ui';
import { Text } from './ui';

interface ThemeSwitcherProps {
  onSelectTheme: (theme: string) => void;
  onSelectMode: (mode: string) => void;
  selectedTheme: string;
  selectedMode: string;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  onSelectTheme,
  onSelectMode,
  selectedTheme,
  selectedMode,
}) => {
  const { colors, spacing } = useTheme();

  const themeOptions = [
    {
      value: 'default',
      label: 'Default',
      description: 'Clean and modern design',
    },
    {
      value: 'quill',
      label: 'Quill',
      description: 'Classic serif typography',
    },
  ];

  const modeOptions = [
    {
      value: 'light',
      label: 'Light',
      description: 'Bright and clear interface',
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Easy on the eyes at night',
    },
    {
      value: 'system',
      label: 'System',
      description: 'Follow device settings',
    },
  ];

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <View style={[styles.section, { marginBottom: spacing.lg }]}>
        <Text
          variant="headingMedium"
          color={colors.text.primary}
          style={styles.sectionTitle}
        >
          Theme Style
        </Text>

        <ButtonGroup
          options={themeOptions}
          selectedValue={selectedTheme}
          onSelect={onSelectTheme}
        />
      </View>

      <View style={styles.section}>
        <Text
          variant="headingMedium"
          color={colors.text.primary}
          style={styles.sectionTitle}
        >
          Appearance
        </Text>

        <ButtonGroup
          options={modeOptions}
          selectedValue={selectedMode}
          onSelect={onSelectMode}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
});

export default ThemeSwitcher;
