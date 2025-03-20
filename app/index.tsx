import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { checkOnboardingStatus } from '../src/utils/onboarding';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const checkStatus = async () => {
      try {
        const status = await checkOnboardingStatus();
        setHasOnboarded(status);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to not onboarded on error
        setHasOnboarded(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  // Show loading indicator while checking status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Redirect based on onboarding status
  return hasOnboarded ? (
    <Redirect href="/(tabs)" />
  ) : (
    <Redirect href="/onboarding" />
  );
} 