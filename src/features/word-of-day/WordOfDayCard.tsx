import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from '../../components/ui';
import { Box } from '../../components/layout';
import { useTheme } from '../../theme/ThemeProvider';

interface WordOfDayCardProps {
  word: string;
  definition: string;
  partOfSpeech: string;
  example?: string;
}

const WordOfDayCard = ({ 
  word, 
  definition, 
  partOfSpeech, 
  example 
}: WordOfDayCardProps) => {
  const { colors, spacing } = useTheme();

  return (
    <Card style={styles.card}>
      <Box padding="md">
        <Text variant="h3" style={styles.word}>{word}</Text>
        <View style={styles.partOfSpeechContainer}>
          <Text 
            variant="caption" 
            style={[styles.partOfSpeech, { color: colors.primary }]}
          >
            {partOfSpeech}
          </Text>
        </View>
        <Text variant="body1" style={styles.definition}>{definition}</Text>
        
        {example && (
          <Box marginTop="md">
            <Text 
              variant="body2" 
              style={[styles.example, { color: colors.text.secondary }]}
            >
              "{example}"
            </Text>
          </Box>
        )}
      </Box>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  word: {
    marginBottom: 4,
  },
  partOfSpeechContainer: {
    marginBottom: 12,
  },
  partOfSpeech: {
    fontStyle: 'italic',
  },
  definition: {
    lineHeight: 22,
  },
  example: {
    fontStyle: 'italic',
    lineHeight: 20,
  },
});

export default WordOfDayCard; 