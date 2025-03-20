import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Box } from '../layout';
import { Text, Icon } from '../ui';
import { DIFFICULTY_LEVELS } from '../../constants';
import { useTheme } from '../../theme/ThemeProvider';

interface DifficultySelectorProps {
  selectedLevel: string | null;
  onSelectLevel: (level: string) => void;
  hasSelection: boolean;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  selectedLevel,
  onSelectLevel,
  hasSelection,
}) => {
  const { colors, spacing } = useTheme();

  // Define difficulty levels with more detailed descriptions and icons
  const difficultyOptions = [
    {
      value: DIFFICULTY_LEVELS.BEGINNER,
      label: 'Beginner',
      description: 'Common words used in everyday conversations',
      icon: 'book',
    },
    {
      value: DIFFICULTY_LEVELS.INTERMEDIATE,
      label: 'Intermediate',
      description: 'More advanced vocabulary for fluent communication',
      icon: 'notes',
    },
    {
      value: DIFFICULTY_LEVELS.ADVANCED,
      label: 'Advanced',
      description: 'Sophisticated words to enhance your expression',
      icon: 'medalRibbon',
    },
  ];

  const handleSelect = (level: string) => {
    onSelectLevel(level);
  };

  return (
    <Box width="100%" align="center">
      <Text
        variant="displaySmall"
        color={colors.text.primary}
        align="center"
        style={{ marginBottom: spacing.md }}
      >
        What's your vocabulary level?
      </Text>
      
      <Text
        variant="bodyMedium"
        color={colors.text.secondary}
        align="center"
        style={{ marginBottom: spacing.xxl }}
      >
        Select an option to continue
      </Text>

      <View style={{ width: '100%', gap: spacing.md }}>
        {difficultyOptions.map((option) => {
          const isSelected = selectedLevel === option.value;
          
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                {
                  borderColor: isSelected ? colors.primary : colors.border.light,
                  backgroundColor: isSelected ? colors.background.card : colors.background.primary,
                  padding: spacing.lg,
                  borderRadius: 16,
                },
              ]}
              onPress={() => handleSelect(option.value)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1, marginRight: spacing.md }}>
                <Text
                  variant="label"
                  color={colors.text.primary}
                >
                  {option.label}
                </Text>
              </View>
              
              <View style={styles.radioContainer}>
                {isSelected ? (
                  <Icon
                    name="checkCircleBold"
                    size={24}
                    color={colors.primary}
                    variant="bold"
                  />
                ) : (
                  <Icon
                    name="circleOutline"
                    size={24}
                    color={colors.border.medium}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Box>
  );
};

const styles = StyleSheet.create({
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    width: '100%',
  },
  radioContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DifficultySelector; 