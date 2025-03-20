import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Box } from '../layout';
import { Text, ButtonGroup } from '../ui';
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

      <ButtonGroup
        options={difficultyOptions}
        selectedValue={selectedLevel || undefined}
        onSelect={onSelectLevel}
        variant="vertical"
      />
    </Box>
  );
};

export default DifficultySelector; 