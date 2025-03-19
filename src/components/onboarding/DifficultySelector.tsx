import React from 'react';
import { StyleSheet } from 'react-native';
import { Box } from '../layout';
import { Text } from '../ui';
import { ButtonGroup } from '../ui';
import { DIFFICULTY_LEVELS } from '../../constants';
import { useTheme } from '../../theme/ThemeProvider';

interface DifficultySelectorProps {
  selectedLevel: string;
  onSelectLevel: (level: string) => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  selectedLevel,
  onSelectLevel,
}) => {
  const { colors, spacing } = useTheme();

  const options = [
    {
      value: DIFFICULTY_LEVELS.BEGINNER,
      label: 'Beginner',
      description: 'Common words used in everyday conversations',
    },
    {
      value: DIFFICULTY_LEVELS.INTERMEDIATE,
      label: 'Intermediate',
      description: 'More advanced vocabulary for fluent communication',
    },
    {
      value: DIFFICULTY_LEVELS.ADVANCED,
      label: 'Advanced',
      description: 'Sophisticated words to enhance your expression',
    },
  ];

  return (
    <Box padding="lg" align="center">
      <Text
        variant="headingMedium"
        color={colors.text.primary}
        align="center"
        style={styles.title}
      >
        Choose Your Level
      </Text>

      <ButtonGroup
        options={options}
        selectedValue={selectedLevel}
        onSelect={onSelectLevel}
        containerStyle={styles.buttonGroup}
      />
    </Box>
  );
};

const styles = StyleSheet.create({
  buttonGroup: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    marginBottom: 32,
  }
});

export default DifficultySelector; 