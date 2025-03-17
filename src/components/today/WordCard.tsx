import React, { memo } from 'react';
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
const WordCardComponent: React.FC<WordCardProps> = ({ 
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
        {/* Word and pronunciation */}
        <View style={styles.headerSection}>
          <Text 
            style={[
              styles.word,
              { color: colors.text.primary }
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
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
        </View>
        
        {/* Part of speech badge */}
        <View style={styles.badgeContainer}>
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
        </View>
        
        {/* Definition */}
        <View style={[styles.contentSection, { marginTop: spacing.md }]}>
          <Text
            style={[
              styles.definition,
              { color: colors.text.primary }
            ]}
          >
            {definition}
          </Text>
          
          {/* Example usage */}
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
        </View>
      </Box>
    </View>
  );
};

// Apply memo to the component
const WordCard = memo(WordCardComponent);

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
    minHeight: 280,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  word: {
    fontSize: 38,
    fontFamily: 'serif',
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'lowercase',
    letterSpacing: 0.5,
  },
  pronunciation: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '400',
    letterSpacing: 0.25,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
  },
  partOfSpeech: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  partOfSpeechText: {
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  contentSection: {
    alignItems: 'center',
  },
  definition: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '400',
  },
  example: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
});

// Set display name for better debugging
WordCard.displayName = 'WordCard';

export default WordCard; 