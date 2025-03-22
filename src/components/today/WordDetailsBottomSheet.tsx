import React, { forwardRef, useCallback, useImperativeHandle, useRef, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { 
  BottomSheetModal, 
  BottomSheetModalProvider,
  BottomSheetBackdrop, 
  BottomSheetScrollView,
  BottomSheetBackdropProps
} from '@gorhom/bottom-sheet';
import { WordOfDay } from '../../types/wordOfDay';
import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../layout';
import { Text, Icon } from '../ui';
import { radius } from '../../theme/styleUtils';
import AnimatedChip from '../ui/AnimatedChip';
import { speak } from '../../utils/tts';

export interface WordDetailsBottomSheetProps {
  /**
   * Word data to display
   */
  wordData: WordOfDay;
  
  /**
   * Called when the bottom sheet is dismissed
   */
  onDismiss?: () => void;
}

export interface WordDetailsBottomSheetRef {
  open: () => void;
  close: () => void;
}

/**
 * Bottom sheet component that displays detailed information about a word
 */
const WordDetailsBottomSheet = forwardRef<WordDetailsBottomSheetRef, WordDetailsBottomSheetProps>(
  ({ wordData, onDismiss }, ref) => {
    const { colors, spacing } = useTheme();
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    
    const { 
      word, 
      pronunciation, 
      partOfSpeech, 
      definition,
      example,
      userAttempts = 0
    } = wordData;
    
    // Define snap points
    const snapPoints = useMemo(() => ['85%'], []);
    
    // Backdrop component to customize the backdrop
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );
    
    // Expose methods to control the bottom sheet
    useImperativeHandle(ref, () => ({
      open: () => {
        bottomSheetModalRef.current?.present();
      },
      close: () => {
        bottomSheetModalRef.current?.close();
      }
    }));
    
    // Handle pronunciation
    const handlePronunciation = useCallback(async () => {
      await speak(word);
    }, [word]);
    
    // Format attempt message
    const getAttemptMessage = useCallback(() => {
      if (userAttempts === 0) {
        return 'Not attempted yet';
      } else if (userAttempts === 1) {
        return 'Correct on first attempt!';
      } else {
        return `Correct on attempt #${userAttempts}`;
      }
    }, [userAttempts]);
    
    // Get attempt color
    const getAttemptColor = useCallback(() => {
      if (userAttempts === 0) {
        return colors.text.secondary;
      } else if (userAttempts === 1) {
        return colors.success;
      } else {
        return colors.primary;
      }
    }, [userAttempts, colors]);
    
    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        onDismiss={onDismiss}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: colors.background.card,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.border.medium,
          width: 40,
        }}
        enableContentPanningGesture={true}
        animateOnMount={true}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <Box padding="lg">
            {/* Word header section */}
            <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
              {partOfSpeech && (
                <Text
                  variant="caption"
                  color={colors.text.secondary}
                  italic={true}
                  style={{ 
                    textAlign: 'center',
                    textTransform: 'lowercase',
                    marginBottom: -4
                  }}
                >
                  {partOfSpeech}
                </Text>
              )}
              
              <Text 
                variant="serifTextLarge"
                color={colors.text.primary}
                align="center"
                style={{ 
                  textTransform: 'lowercase', 
                  marginTop: -2,
                  marginBottom: spacing.sm
                }}
              >
                {word}
              </Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                {pronunciation && (
                  <AnimatedChip 
                    label={pronunciation}
                    iconLeft="volumeLoud"
                    size="small"
                    onPress={handlePronunciation}
                    isAnimating={false}
                  />
                )}
                
                <AnimatedChip 
                  label={getAttemptMessage()}
                  iconLeft={userAttempts === 1 ? "checkmark" : undefined}
                  size="small"
                  variant="default"
                  backgroundColor={getAttemptColor()}
                  isAnimating={false}
                />
              </View>
            </View>
            
            {/* Definition section */}
            <View style={styles.section}>
              <Text 
                variant="subtitle"
                color={colors.text.primary}
                style={{ marginBottom: spacing.sm }}
              >
                Definition
              </Text>
              
              <Text 
                variant="bodyMedium"
                color={colors.text.primary}
                style={{ marginBottom: spacing.md }}
              >
                {definition}
              </Text>
            </View>
            
            {/* Example section */}
            {example && (
              <View style={styles.section}>
                <Text 
                  variant="subtitle"
                  color={colors.text.primary}
                  style={{ marginBottom: spacing.sm }}
                >
                  Example
                </Text>
                
                <View style={[
                  styles.exampleBox, 
                  { 
                    backgroundColor: colors.background.secondary,
                    borderLeftColor: colors.primary,
                    borderRadius: radius.md
                  }
                ]}>
                  <Text 
                    variant="bodyMedium"
                    color={colors.text.primary}
                    italic={true}
                  >
                    {example}
                  </Text>
                </View>
              </View>
            )}
            
            {/* Close button */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  marginTop: spacing.lg,
                }
              ]}
              onPress={() => bottomSheetModalRef.current?.close()}
            >
              <Text variant="button" color={colors.text.primary}>
                Close
              </Text>
            </TouchableOpacity>
          </Box>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  exampleBox: {
    padding: 16,
    borderLeftWidth: 4,
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
});

// Set display name for better debugging
WordDetailsBottomSheet.displayName = 'WordDetailsBottomSheet';

export default WordDetailsBottomSheet; 