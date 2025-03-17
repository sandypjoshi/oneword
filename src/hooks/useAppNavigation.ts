import { useRouter } from 'expo-router';
import { ROUTES } from '../constants';

/**
 * Custom hook for app navigation
 * Provides typed navigation methods for common routes
 */
export function useAppNavigation() {
  const router = useRouter();
  
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
    
    // Raw router for custom navigation
    router,
  };
}

export default useAppNavigation; 