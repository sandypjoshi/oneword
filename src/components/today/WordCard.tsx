import React, { memo, useState, useCallback } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { WordOfDay } from '../../types/wordOfDay';
import WordCardQuestion from './WordCardQuestion';
import WordCardAnswer from './WordCardAnswer';

interface WordCardProps {
  /**
   * Word data to display
   */
  wordData: WordOfDay;
  
  /**
   * Additional styles for the container
   */
  style?: StyleProp<ViewStyle>;
  
  /**
   * Function called when the details button is pressed
   */
  onViewDetails?: () => void;
  
  /**
   * Function called when the word is revealed (answer is shown)
   */
  onReveal?: (wordId: string, attempts: number) => void;
}

/**
 * Card component that displays a word of the day in either question or answer state
 */
const WordCardComponent: React.FC<WordCardProps> = ({ 
  wordData: initialWordData,
  style,
  onViewDetails,
  onReveal
}) => {
  // Local state to track word data including user interactions
  const [wordData, setWordData] = useState<WordOfDay>(initialWordData);
  
  // Handle option selection in question mode
  const handleOptionSelect = useCallback((option: string, isCorrect: boolean) => {
    // Calculate attempts (increment if incorrect)
    const attempts = wordData.userAttempts ? wordData.userAttempts + (isCorrect ? 0 : 1) : 1;
    
    // Update word data
    const updatedWordData = {
      ...wordData,
      selectedOption: option,
      userAttempts: attempts,
      isRevealed: isCorrect
    };
    
    setWordData(updatedWordData);
    
    // If correct, call onReveal callback
    if (isCorrect && onReveal) {
      onReveal(wordData.id, attempts);
    }
  }, [wordData, onReveal]);
  
  // Render appropriate card based on state
  if (wordData.isRevealed) {
    return (
      <WordCardAnswer
        wordData={wordData}
        style={style}
        onViewDetails={onViewDetails}
      />
    );
  }
  
  return (
    <WordCardQuestion
      wordData={wordData}
      style={style}
      onOptionSelect={handleOptionSelect}
    />
  );
};

// Apply memo to the component
const WordCard = memo(WordCardComponent);

// Set display name for better debugging
WordCard.displayName = 'WordCard';

export default WordCard; 