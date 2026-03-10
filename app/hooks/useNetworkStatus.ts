/**
 * useNetworkStatus — Hook to detect network connectivity state.
 * Uses expo-network for reliable cross-platform network detection.
 * US-038: Offline Graceful Mode
 */
import { useState, useEffect, useCallback } from 'react';
import * as Network from 'expo-network';

export interface NetworkStatus {
  isConnected: boolean;
  connectionType: Network.NetworkStateType | null;
  isInternetReachable: boolean | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState<Network.NetworkStateType | null>(null);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  const checkNetworkState = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type ?? null);
      setIsInternetReachable(state.isInternetReachable ?? null);
    } catch (error) {
      console.warn('[Network] Failed to get network state:', error);
      // Assume connected if check fails (graceful fallback)
      setIsConnected(true);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkNetworkState();

    // Poll network state periodically (expo-network doesn't have addEventListener)
    // Check every 3 seconds for responsive offline detection
    const interval = setInterval(checkNetworkState, 3000);

    return () => clearInterval(interval);
  }, [checkNetworkState]);

  return { isConnected, connectionType, isInternetReachable };
}
