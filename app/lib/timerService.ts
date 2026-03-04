/**
 * US-023 — Timer Service
 * 
 * Timer management with Expo notifications.
 * Supports multiple simultaneous timers.
 */

import * as Notifications from 'expo-notifications';
import { useState, useEffect, useCallback } from 'react';

export interface Timer {
  id: string;
  endTime: number;
  durationSeconds: number;
  label?: string;
  notificationId?: string;
  createdAt: number;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions.
 * Call this early in app lifecycle.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

/**
 * Hook for timer management.
 */
export function useTimers() {
  const [timers, setTimers] = useState<Timer[]>([]);

  /**
   * Create a new timer.
   */
  const createTimer = useCallback(async (durationSeconds: number, label?: string): Promise<Timer> => {
    const id = Math.random().toString(36).slice(2, 11);
    const endTime = Date.now() + durationSeconds * 1000;
    const createdAt = Date.now();

    // Schedule notification for when timer ends
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Timer terminé !',
        body: label ? `Timer "${label}" terminé` : 'Ton timer est terminé',
        sound: 'default',
        data: { timerId: id },
      },
      trigger: {
        seconds: durationSeconds,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });

    const timer: Timer = {
      id,
      endTime,
      durationSeconds,
      label,
      notificationId,
      createdAt,
    };

    setTimers(prev => [...prev, timer]);
    return timer;
  }, []);

  /**
   * Cancel a specific timer by ID.
   */
  const cancelTimer = useCallback(async (id: string): Promise<boolean> => {
    const timer = timers.find(t => t.id === id);
    if (!timer) return false;

    if (timer.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(timer.notificationId);
    }
    
    setTimers(prev => prev.filter(t => t.id !== id));
    return true;
  }, [timers]);

  /**
   * Cancel the most recent timer.
   */
  const cancelLastTimer = useCallback(async (): Promise<Timer | null> => {
    if (timers.length === 0) return null;
    
    // Get most recently created timer
    const sorted = [...timers].sort((a, b) => b.createdAt - a.createdAt);
    const lastTimer = sorted[0];
    
    await cancelTimer(lastTimer.id);
    return lastTimer;
  }, [timers, cancelTimer]);

  /**
   * Cancel all active timers.
   */
  const cancelAllTimers = useCallback(async (): Promise<number> => {
    const count = timers.length;
    
    for (const timer of timers) {
      if (timer.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(timer.notificationId);
      }
    }
    
    setTimers([]);
    return count;
  }, [timers]);

  /**
   * Get remaining time for a timer in seconds.
   */
  const getRemainingTime = useCallback((id: string): number | null => {
    const timer = timers.find(t => t.id === id);
    if (!timer) return null;
    
    const remaining = Math.max(0, Math.ceil((timer.endTime - Date.now()) / 1000));
    return remaining;
  }, [timers]);

  // Clean up expired timers periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTimers(prev => prev.filter(t => t.endTime > now));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Listen for notification interactions
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const timerId = response.notification.request.content.data?.timerId as string;
      if (timerId) {
        // Timer notification was interacted with - remove it from state
        setTimers(prev => prev.filter(t => t.id !== timerId));
      }
    });

    return () => subscription.remove();
  }, []);

  return {
    timers,
    createTimer,
    cancelTimer,
    cancelLastTimer,
    cancelAllTimers,
    getRemainingTime,
    activeCount: timers.length,
  };
}

/**
 * Format remaining time for display.
 */
export function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return 'Terminé';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  } else if (m > 0) {
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  } else {
    return `${s}s`;
  }
}
