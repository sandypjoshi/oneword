import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, ButtonGroup } from '../ui';
import { Box } from '../layout';
import { useTheme } from '../../theme/ThemeProvider';
import { DIFFICULTY_LEVELS, DIFFICULTY_DESCRIPTIONS } from '../../constants';
import type { ButtonGroupOption } from '../ui/ButtonGroup';

interface DifficultySelectorProps {
  selectedLevel: string;
  onSelectLevel: (level: string) => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  selectedLevel,
  onSelectLevel,
}) => {
  const { colors, spacing } = useTheme();
  
  // Array of difficulty levels for rendering (excluding ALL)
  const options: ButtonGroupOption[] = [
    {
      value: DIFFICULTY_LEVELS.BEGINNER,
      label: 'Beginner',
    },
    {
      value: DIFFICULTY_LEVELS.INTERMEDIATE,
      label: 'Intermediate',
    },
    {
      value: DIFFICULTY_LEVELS.ADVANCED,
      label: 'Advanced',
    },
  ];
  
  return (
    <Box width="100%">
      <Text 
        variant="h2" 
        color={colors.text.primary} 
        align="center" 
        style={{ marginBottom: spacing.xl }}
      >
        What's your vocabulary level?
      </Text>
      
      <ButtonGroup
        options={options}
        selectedValues={selectedLevel}
        onChange={(value) => onSelectLevel(value as string)}
        mode="single"
        layout="vertical"
        containerStyle={styles.buttonGroup}
      />
    </Box>
  );
};

const styles = StyleSheet.create({
  buttonGroup: {
    width: '100%',
  },
});

export default DifficultySelector; 