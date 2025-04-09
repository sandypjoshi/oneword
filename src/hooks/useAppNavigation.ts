import { useRouter, useSegments } from 'expo-router';
import { ROUTES } from '../constants';

/**
 * Custom hook for app navigation
 * Provides typed navigation methods for common routes in a way that's consistent with Expo Router
 */
export function useAppNavigation() {
  const router = useRouter();
  const segments = useSegments();

  const getCurrentRoute = () => {
    if (segments.length === 0) return null;
    return `/${segments.join('/')}`;
  };

  return {
    // Navigate to main tabs
    goToHome: () => router.replace(ROUTES.HOME),
    goToPractice: () => router.push(ROUTES.PRACTICE),
    goToProfile: () => router.push(ROUTES.PROFILE),

    // Auth navigation
    goToLogin: () => router.replace(ROUTES.LOGIN),
    goToSignup: () => router.push(ROUTES.SIGNUP),

    // Other screens
    goToOnboarding: () => router.replace(ROUTES.ONBOARDING),

    // Modal navigation
    openModal: () => router.push('/modal'),
    closeModal: () => router.back(),

    // General navigation
    goBack: () => router.back(),

    // Additional utility methods
    getCurrentRoute,
    
    // Raw router for custom navigation
    router,
    segments,
  };
}

export default useAppNavigation;
