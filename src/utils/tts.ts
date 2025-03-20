import * as Speech from 'expo-speech';

// Track if speech is currently in progress
let isSpeakingActive = false;
let speechStartTime = 0;
const averageSpeakingDuration = 1500; // Default estimate for speaking duration in ms

/**
 * Speak the provided text using the device's text-to-speech engine
 * @param text The text to speak
 * @param options Options for the speech (rate, pitch, etc.)
 * @returns A promise with the estimated duration of the speech
 */
export const speak = async (
  text: string, 
  options: Speech.SpeechOptions = {}
): Promise<number> => {
  try {
    // Stop any current speech before starting new one
    const currentlySpeaking = await Speech.isSpeakingAsync();
    if (currentlySpeaking) {
      await Speech.stop();
    }
    
    // Use default options if none provided
    const defaultOptions: Speech.SpeechOptions = {
      rate: 0.9,       // Slightly slower than default for better clarity
      pitch: 1.0,      // Normal pitch
      language: 'en-US' // Default language
    };
    
    // Merge default options with provided options
    const speechOptions = {
      ...defaultOptions,
      ...options
    };
    
    // Set speaking state and start time
    isSpeakingActive = true;
    speechStartTime = Date.now();
    
    // Estimate duration based on text length
    const estimatedDuration = Math.max(
      averageSpeakingDuration, 
      text.length * 90  // ~90ms per character as a rough estimate
    );
    
    // Speak the text
    await Speech.speak(text, {
      ...speechOptions,
      onDone: () => {
        isSpeakingActive = false;
      },
      onStopped: () => {
        isSpeakingActive = false;
      },
      onError: () => {
        isSpeakingActive = false;
      }
    });
    
    return estimatedDuration;
  } catch (error) {
    console.error('Error using text-to-speech:', error);
    isSpeakingActive = false;
    return 0;
  }
};

/**
 * Stop any ongoing speech
 */
export const stopSpeaking = async (): Promise<void> => {
  try {
    await Speech.stop();
    isSpeakingActive = false;
  } catch (error) {
    console.error('Error stopping speech:', error);
  }
};

/**
 * Check if speech is currently active
 */
export const isSpeaking = (): boolean => {
  return isSpeakingActive;
};

/**
 * Get the elapsed time of current speech as a percentage (0-1)
 */
export const getSpeakingProgress = (): number => {
  if (!isSpeakingActive || speechStartTime === 0) {
    return 0;
  }
  
  const elapsed = Date.now() - speechStartTime;
  const estimatedDuration = Math.max(
    averageSpeakingDuration, 
    1000  // Minimum duration
  );
  
  return Math.min(elapsed / estimatedDuration, 1);
}; 