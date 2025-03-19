import React, { memo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { WordOfDay } from '../../types/wordOfDay';
import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../layout';
import { Text } from '../ui';

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
            variant="displaySmall"
            color={colors.text.primary}
            align="center"
            style={styles.wordText}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {word}
          </Text>
          
          <Text
            variant="bodySmall"
            color={colors.text.secondary}
            align="center"
            style={styles.pronunciationText}
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
              variant="label"
              color={colors.text.inverse}
              style={styles.partOfSpeechText}
            >
              {partOfSpeech}
            </Text>
          </View>
        </View>
        
        {/* Definition */}
        <View style={[styles.contentSection, { marginTop: spacing.md }]}>
          <Text
            variant="bodyMedium"
            color={colors.text.primary}
            align="center"
          >
            {definition}
          </Text>
          
          {/* Example usage */}
          {example && (
            <Text
              variant="bodySmall"
              color={colors.text.secondary}
              align="center"
              style={styles.exampleText}
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
  wordText: {
    fontFamily: 'serif',
    textTransform: 'lowercase',
  },
  pronunciationText: {
    marginTop: 4,
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
    textTransform: 'lowercase',
  },
  contentSection: {
    alignItems: 'center',
  },
  exampleText: {
    fontStyle: 'italic',
    marginTop: 8,
  },
});

// Set display name for better debugging
WordCard.displayName = 'WordCard';

export default WordCard; 