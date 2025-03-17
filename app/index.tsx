import { Redirect } from 'expo-router';

export default function Index() {
  // For now, redirect to onboarding
  // In a real app, you would check if the user has completed onboarding
  return <Redirect href="/onboarding" />;
} 