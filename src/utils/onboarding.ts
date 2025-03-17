import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, DIFFICULTY_LEVELS } from '../constants';

const HAS_ONBOARDED_KEY = 'oneword:hasOnboarded';

export const checkOnboardingStatus = async (): Promise<boolean> => {
  try {
    const hasOnboarded = await AsyncStorage.getItem(HAS_ONBOARDED_KEY);
    return hasOnboarded === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

export const setOnboardingComplete = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(HAS_ONBOARDED_KEY, 'true');
  } catch (error) {
    console.error('Error setting onboarding status:', error);
  }
};

// For testing purposes - resets onboarding status
export const resetOnboardingStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(HAS_ONBOARDED_KEY);
    console.log('Onboarding status reset successfully');
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
  }
};

/**
 * Get the user's preferred difficulty level
 * @returns The difficulty level or the default (intermediate) if none is set
 */
export const getDifficultyLevel = async (): Promise<string> => {
  try {
    const level = await AsyncStorage.getItem(STORAGE_KEYS.DIFFICULTY_LEVEL);
    return level || DIFFICULTY_LEVELS.INTERMEDIATE; // Default to intermediate
  } catch (error) {
    console.error('Error getting difficulty level:', error);
    return DIFFICULTY_LEVELS.INTERMEDIATE; // Default to intermediate on error
  }
};

/**
 * Set the user's preferred difficulty level
 * @param level The difficulty level to set
 */
export const setDifficultyLevel = async (level: string): Promise<void> => {
  try {
    if (!Object.values(DIFFICULTY_LEVELS).includes(level)) {
      console.warn(`Invalid difficulty level: ${level}, using intermediate`);
      level = DIFFICULTY_LEVELS.INTERMEDIATE;
    }
    await AsyncStorage.setItem(STORAGE_KEYS.DIFFICULTY_LEVEL, level);
  } catch (error) {
    console.error('Error setting difficulty level:', error);
  }
}; 