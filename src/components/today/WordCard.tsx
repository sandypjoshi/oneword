import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { WordOfDay } from '../../types/wordOfDay';
import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../layout';

interface WordCardProps {
  /**
   * Word data to display
   */
  wordData: WordOfDay;
  
  /**
   * Additional styles for the container
   */
  style?: ViewStyle;
}

/**
 * Card component that displays a word of the day
 */
const WordCard: React.FC<WordCardProps> = ({ 
  wordData,
  style 
}) => {
  const { colors, spacing } = useTheme();
  const { word, pronunciation, partOfSpeech, definition, example } = wordData;
  
  return (
    <View 
      style={[
        styles.container,
        { 
          backgroundColor: colors.background.card,
          borderColor: colors.border.light,
        },
        style
      ]}
    >
      <Box padding="lg">
        <Text 
          style={[
            styles.word,
            { color: colors.text.primary }
          ]}
        >
          {word}
        </Text>
        
        <Text
          style={[
            styles.pronunciation,
            { color: colors.text.secondary }
          ]}
        >
          {pronunciation}
        </Text>
        
        <View 
          style={[
            styles.partOfSpeech,
            { backgroundColor: colors.primaryLight }
          ]}
        >
          <Text 
            style={[
              styles.partOfSpeechText,
              { color: colors.text.inverse }
            ]}
          >
            {partOfSpeech}
          </Text>
        </View>
        
        <Text
          style={[
            styles.definition,
            { 
              color: colors.text.primary,
              marginTop: spacing.md 
            }
          ]}
        >
          {definition}
        </Text>
        
        {example && (
          <Text
            style={[
              styles.example,
              { 
                color: colors.text.secondary,
                marginTop: spacing.sm 
              }
            ]}
          >
            "{example}"
          </Text>
        )}
      </Box>
    </View>
  );
};

// Empty state component when no word data is available
export const EmptyWordCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { colors, spacing } = useTheme();
  
  return (
    <View 
      style={[
        styles.container,
        { 
          backgroundColor: colors.background.card,
          borderColor: colors.border.light,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: spacing.xl
        },
        style
      ]}
    >
      <Box padding="lg" align="center" justify="center">
        <Text 
          style={[
            styles.emptyStateText,
            { color: colors.text.secondary }
          ]}
        >
          No word available for this date
        </Text>
      </Box>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  word: {
    fontSize: 36,
    fontFamily: 'serif',
    textAlign: 'center',
    fontWeight: '400',
    textTransform: 'lowercase',
  },
  pronunciation: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '400',
  },
  partOfSpeech: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 16,
  },
  partOfSpeechText: {
    fontSize: 14,
    fontWeight: '600',
  },
  definition: {
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  example: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyStateText: {
    fontSize: 18,
    textAlign: 'center',
  },
});

export default WordCard; 