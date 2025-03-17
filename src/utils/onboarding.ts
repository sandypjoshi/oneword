import AsyncStorage from '@react-native-async-storage/async-storage';

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