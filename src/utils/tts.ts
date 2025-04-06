import * as Speech from 'expo-speech';

// Track if speech is currently in progress
let isSpeakingActive = false;
let speechStartTime = 0;
const averageSpeakingDuration = 1500; // Default estimate for speaking duration in ms

/**
 * Speak the provided text using the device's text-to-speech engine.
 * Stops any previous speech before starting.
 * @param text The text to speak
 * @param options Options for the speech (rate, pitch, etc.)
 * @returns A promise that resolves when speech finishes or is stopped, and rejects on error.
 */
export const speak = async (
  text: string, 
  options: Speech.SpeechOptions = {}
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Stop any current speech before starting new one
      const currentlySpeaking = await Speech.isSpeakingAsync();
      if (currentlySpeaking) {
        await Speech.stop(); // Note: This might trigger onStopped for the *previous* speech
      }
      
      // Use default options if none provided
      const defaultOptions: Speech.SpeechOptions = {
        rate: 0.9,
        pitch: 1.0,
        language: 'en-US'
      };
      
      // Merge default options with provided options
      const speechOptions = {
        ...defaultOptions,
        ...options
      };
      
      // Set speaking state and start time (still potentially useful for isSpeaking/getProgress)
      isSpeakingActive = true;
      speechStartTime = Date.now();
      
      // Speak the text, resolving/rejecting the promise in callbacks
      Speech.speak(text, {
        ...speechOptions,
        onDone: () => {
          console.log(`[tts.speak] Done speaking: "${text.substring(0, 20)}..."`);
          isSpeakingActive = false;
          resolve();
        },
        onStopped: () => {
          console.log(`[tts.speak] Stopped speaking: "${text.substring(0, 20)}..."`);
          isSpeakingActive = false;
          resolve(); // Resolve on stop as well, as the action is complete from the caller's perspective
        },
        onError: (error) => {
          console.error(`[tts.speak] Error speaking: "${text.substring(0, 20)}..."`, error);
          isSpeakingActive = false;
          reject(error);
        }
      });
    } catch (error) {
      console.error('[tts.speak] Error initiating text-to-speech:', error);
      isSpeakingActive = false;
      reject(error); // Reject the promise if initial setup fails
    }
  });
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