import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import Icon from './Icon';
import { speak } from '../../utils/tts';
import { radius } from '../../theme/styleUtils';

interface PronunciationChipProps {
  /**
   * The pronunciation text to display and speak
   */
  pronunciation: string;
  
  /**
   * The actual word to speak (may be different from pronunciation)
   */
  word?: string;
}

/**
 * A chip that displays pronunciation and speaks the word when tapped
 */
const PronunciationChip: React.FC<PronunciationChipProps> = ({
  pronunciation,
  word
}) => {
  const { colors, spacing } = useTheme();
  
  const handlePress = () => {
    // Speak the word if provided, otherwise speak the pronunciation
    speak(word || pronunciation);
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.background.tertiary,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={{ marginRight: spacing.xxs }}>
        <Icon 
          name="notes" 
          size={16} 
          color={colors.text.secondary}
        />
      </View>
      <Text
        style={{
          color: colors.text.secondary,
          fontSize: 14,
          fontWeight: '400',
        }}
      >
        {pronunciation}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  }
});

export default PronunciationChip; 