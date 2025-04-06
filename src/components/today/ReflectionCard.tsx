import React, { memo } from 'react';
import { StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { WordOfDay } from '../../types/wordOfDay';
import { useTheme } from '../../theme';
import { radius } from '../../theme/styleUtils';
import WordSection from './WordSection';

interface ReflectionCardProps {
  wordData: WordOfDay;
  style?: StyleProp<ViewStyle>;
  onFlipBack?: () => void;
}

/**
 * Displays the back of the word card, showing only the word details.
 * Tappable to flip back to the question side.
 */
const ReflectionCardComponent: React.FC<ReflectionCardProps> = ({ 
  wordData,
  style,
  onFlipBack,
}) => {
  const { colors } = useTheme();
  const { id, word, pronunciation, partOfSpeech } = wordData;
  
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.background.card }, style]}
      onPress={onFlipBack}
      activeOpacity={0.8}
    >
      <WordSection
        wordId={id}
        word={word}
        pronunciation={pronunciation}
        partOfSpeech={partOfSpeech}
        style={styles.wordSection}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: 20,
    paddingTop: 30,
    justifyContent: 'center',
  },
  wordSection: {
  },
});

const ReflectionCard = memo(ReflectionCardComponent);

ReflectionCard.displayName = 'ReflectionCard';

export default ReflectionCard; 