/**
 * useDeviceId.ts
 *
 * This hook provides a stable device ID for anonymous tracking and offline data management.
 * It generates a UUID on first use and stores it in AsyncStorage for subsequent retrievals.
 * This ID is used to track user progress and favorites without requiring authentication.
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// Storage key for device ID
const DEVICE_ID_KEY = 'oneword:device_id';

/**
 * Generate a UUID v4 for device identification
 */
const generateDeviceId = (): string => {
  return uuidv4();
};

/**
 * Hook to get the device ID, generating a new one if none exists
 */
export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getOrCreateDeviceId = async () => {
      try {
        setIsLoading(true);

        // Try to get existing device ID
        const storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

        if (storedDeviceId) {
          setDeviceId(storedDeviceId);
        } else {
          // Generate a new device ID
          const newDeviceId = generateDeviceId();

          // Store it for future use
          await AsyncStorage.setItem(DEVICE_ID_KEY, newDeviceId);

          setDeviceId(newDeviceId);
        }
      } catch (err) {
        console.error('Error getting device ID:', err);
        setError('Failed to get device ID');
      } finally {
        setIsLoading(false);
      }
    };

    getOrCreateDeviceId();
  }, []);

  /**
   * Force regenerate the device ID
   * Can be used for "forget this device" functionality
   */
  const regenerateDeviceId = async (): Promise<string> => {
    try {
      setIsLoading(true);

      // Generate a new device ID
      const newDeviceId = generateDeviceId();

      // Store it
      await AsyncStorage.setItem(DEVICE_ID_KEY, newDeviceId);

      setDeviceId(newDeviceId);
      return newDeviceId;
    } catch (err) {
      console.error('Error regenerating device ID:', err);
      setError('Failed to regenerate device ID');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deviceId,
    isLoading,
    error,
    regenerateDeviceId,
  };
}
