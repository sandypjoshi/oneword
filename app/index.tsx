import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { checkOnboardingStatus } from '../src/utils/onboarding';

/**
 * Root entry point - redirects to the appropriate screen
 */
export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  
  // Check onboarding status on mount
  useEffect(() => {
    async function checkStatus() {
      const status = await checkOnboardingStatus();
      setHasOnboarded(status);
      setIsLoading(false);
    }
    
    checkStatus();
  }, []);
  
  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2e68e6" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  }
}); 