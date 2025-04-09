import React, { memo, useMemo } from 'react';
import { StyleSheet, StyleProp, ViewStyle, TouchableOpacity, View } from 'react-native';
import { WordOfDay, WordOption } from '../../types/wordOfDay';
import { useTheme } from '../../theme';
import { radius, borderWidth } from '../../theme/styleUtils';
import WordSection from './WordSection';
import { useWordCardStore, OptionState } from '../../store/wordCardStore';
import { Text, Icon, Separator } from '../ui';
import Box from '../layout/Box';
import spacing from '../../theme/spacing';
import { 
  firstGuessMessages, 
  fewGuessesMessages, 
  manyGuessesMessages 
} from '../../features/today/todayScreenCopy'; // Import copy strings

interface ReflectionCardProps {
  wordData: WordOfDay;
  style?: StyleProp<ViewStyle>;
  onFlipBack?: () => void;
}

// Define a type for the icon variant directly
type IconVariant = 'bold' | undefined; 

// --- Copywriting: Performance Messages --- 

// Helper function for random selection
const getRandomMessage = (messages: ReadonlyArray<string>, attempts: number): string => {
  if (messages.length === 0) return "";
  const randomIndex = Math.floor(Math.random() * messages.length);
  let message = messages[randomIndex];
  if (attempts > 1) {
    message = message.replace('{attempts}', attempts.toString());
  }
  return message;
};

/**
 * Displays the back of the word card, showing word details and reflection on the user's answer.
 * Tappable to flip back to the question side.
 */
const ReflectionCardComponent: React.FC<ReflectionCardProps> = ({ 
  wordData,
  style,
  onFlipBack,
}) => {
  const { colors } = useTheme();

  // Define styles *inside* the component to access theme colors
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative',
      borderRadius: radius.lg,
      overflow: 'hidden',
      paddingTop: spacing.xxl,    // Add specific top padding
      paddingHorizontal: 20,     // Add horizontal padding
      paddingBottom: 20,        // Add bottom padding
      borderWidth: borderWidth.thin,
      borderColor: colors.border.light,
    },
    wordSection: {
      marginBottom: spacing.lg,
    },
    performanceText: {
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    answerListContainer: {
      alignItems: 'center',
    },
    answerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    iconWrapper: { 
      marginRight: spacing.sm, 
    },
    answerText: {
      lineHeight: 26,
    },
    answerTextBold: {
      fontWeight: 'bold',
    },
  }), [colors, spacing]); // Add spacing to dependencies

  const { id, word, pronunciation, partOfSpeech, options = [] } = wordData;

  const selectedOptionValue = useWordCardStore(state => state.getSelectedOption(id));
  const attempts = useWordCardStore(state => state.getAttempts(id));
  const getOptionState = useWordCardStore(state => state.getOptionState);

  // Use imported message arrays
  const performanceMessage = useMemo(() => {
    if (attempts <= 0) return null;

    if (attempts === 1) {
      return getRandomMessage(firstGuessMessages, attempts);
    } else if (attempts <= 3) { 
      return getRandomMessage(fewGuessesMessages, attempts);
    } else { 
      return getRandomMessage(manyGuessesMessages, attempts);
    }
  }, [attempts]);

  // Adjusted to use getOptionState for reflecting user attempts
  const getOptionDisplayStatus = (option: WordOption) => {
    const isCorrect = option.isCorrect; // Is this option the *actual* correct one?
    // Get the interaction state of *this specific* option from the store
    const optionState = getOptionState(id, option.value);
    
    let icon: 'checkCircleBold' | 'close' = 'close';
    let iconVariant: IconVariant = 'bold';
    let iconColor = colors.text.disabled; 
    let isBoldText = false; 
    let textColor = colors.text.tertiary; // Default for unselected incorrect

    if (isCorrect) {
      // Case 1: This IS the correct answer
      icon = 'checkCircleBold';
      iconVariant = undefined;
      iconColor = colors.success;
      isBoldText = true;
      textColor = colors.success;
    } else if (optionState === 'incorrect') {
      // Case 2: This is an incorrect answer AND the user selected it (store marked it as 'incorrect')
      icon = 'close';
      iconVariant = 'bold'; 
      iconColor = colors.error; // Use error styling
      isBoldText = true;
      textColor = colors.error;
    } else {
      // Case 3: Incorrect Answer - User Did NOT Select This One
      icon = 'close';
      iconVariant = 'bold';
      iconColor = colors.text.disabled; 
      isBoldText = false; 
      // textColor remains tertiary as initialized
    }

    // We no longer need to explicitly check isSelected based on the potentially outdated selectedOptionValue
    return { isCorrect, icon, iconColor, isBoldText, textColor, iconVariant }; // Removed isSelected from return
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container, // Use the container style from StyleSheet
        { backgroundColor: colors.background.card }, // Keep dynamic background separate
        style
      ]}
      onPress={onFlipBack}
      activeOpacity={0.8}
      disabled={!onFlipBack}
    >
      <WordSection
        wordId={id}
        word={word}
        pronunciation={pronunciation}
        partOfSpeech={partOfSpeech}
        style={styles.wordSection}
      />

      <Separator 
        orientation="horizontal"
        marginVertical="md"
      />

      {performanceMessage && (
        <Text variant="label" color={colors.text.tertiary} style={styles.performanceText}>
          {performanceMessage}
        </Text>
      )}

      <Box style={styles.answerListContainer}>
        {options.map((option) => {
          // Destructure updated return values (no isSelected needed here)
          const { 
            icon, 
            iconColor, 
            isBoldText, 
            textColor, 
            iconVariant 
          } = getOptionDisplayStatus(option);

          return (
            <View key={option.value} style={styles.answerRow}>
              <View style={styles.iconWrapper}>
                 <Icon 
                   name={icon} 
                   color={iconColor} 
                   size={18} 
                   variant={iconVariant}
                 /> 
              </View>
              <Text 
                variant="bodyMedium"
                color={textColor} 
                style={[styles.answerText, isBoldText && styles.answerTextBold]}
              >
                {option.value}
              </Text>
            </View>
          );
        })}
      </Box>

    </TouchableOpacity>
  );
};

const ReflectionCard = memo(ReflectionCardComponent);

ReflectionCard.displayName = 'ReflectionCard';

export default ReflectionCard; 