/**
 * EL-010 — Wake Word detection hook
 *
 * Uses @react-native-voice/voice (native iOS Speech Recognition)
 * to detect the keyword "Diva" in continuous listening mode.
 *
 * Supports three modes:
 * - always_on: listens continuously, restarts after each recognition
 * - smart: listens continuously but pauses in background
 * - manual: wake word disabled, user must tap to activate
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import Voice, {
  type SpeechResultsEvent,
  type SpeechErrorEvent,
} from '@react-native-voice/voice';

// Conditional imports - these will fail in Expo Go
let PorcupineManager: any = null;
let Voice: any = null;

// Try to import Porcupine (may not be installed)
try {
  PorcupineManager = require('@picovoice/porcupine-react-native').PorcupineManager;
} catch {
  console.log('[WakeWord] Porcupine not available');
}

// Try to import Voice (may not be installed)
try {
  Voice = require('@react-native-voice/voice').default;
} catch {
  console.log('[WakeWord] Voice not available');
}

// Configuration
const PORCUPINE_ACCESS_KEY = process.env.EXPO_PUBLIC_PORCUPINE_ACCESS_KEY || '';
const WAKE_WORD = 'diva';

export type WakeWordMode = 'always_on' | 'smart' | 'manual';

const WAKE_KEYWORD = 'diva';
// Cooldown to avoid rapid re-triggers (ms)
const COOLDOWN_MS = 2000;
// Restart delay after speech ends (ms)
const RESTART_DELAY_MS = 500;

interface UseWakeWordOptions {
  mode: WakeWordMode;
  onWakeWordDetected: () => void;
  /** If true, won't listen while the main voice session is active */
  pauseWhileRecording?: boolean;
}

export function useWakeWord({
  mode,
  onWakeWordDetected,
  pauseWhileRecording = false,
}: UseWakeWordOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const isListeningRef = useRef(false);
  const lastTriggerRef = useRef(0);
  const shouldListenRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check availability on mount
  useEffect(() => {
    // @react-native-voice/voice is available on iOS and Android
    setIsAvailable(Platform.OS === 'ios' || Platform.OS === 'android');
  }, []);

  // Handle speech results — look for wake word
  const onSpeechResults = useCallback(
    (event: SpeechResultsEvent) => {
      const now = Date.now();
      if (now - lastTriggerRef.current < COOLDOWN_MS) return;

      const results = event.value || [];
      for (const transcript of results) {
        if (transcript.toLowerCase().includes(WAKE_KEYWORD)) {
          lastTriggerRef.current = now;
          console.log(`[WakeWord] Detected "${WAKE_KEYWORD}" in: "${transcript}"`);
          // Stop listening briefly, callback will handle activation
          Voice.stop().catch(() => {});
          onWakeWordDetected();
          return;
        }
      }
    },
    [onWakeWordDetected],
  );

  // Handle speech end — restart listening if in continuous mode
  const onSpeechEnd = useCallback(() => {
    if (shouldListenRef.current && !pauseWhileRecording) {
      // Small delay before restarting to avoid audio conflicts
      restartTimerRef.current = setTimeout(() => {
        if (shouldListenRef.current) {
          Voice.start('fr-FR').catch((err) => {
            console.warn('[WakeWord] Restart failed:', err);
          });
        }
      }, RESTART_DELAY_MS);
    }
  }, [pauseWhileRecording]);

  // Handle errors — restart on recoverable errors
  const onSpeechError = useCallback((event: SpeechErrorEvent) => {
    const errorCode = event.error?.code;
    console.warn('[WakeWord] Error:', event.error?.message);

    // Restart on common recoverable errors
    if (shouldListenRef.current && errorCode !== 'permissions') {
      restartTimerRef.current = setTimeout(() => {
        if (shouldListenRef.current) {
          Voice.start('fr-FR').catch(() => {});
        }
      }, RESTART_DELAY_MS * 2);
    }
  }, []);

  // Register Voice callbacks
  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    };
  }, [onSpeechResults, onSpeechEnd, onSpeechError]);

  // Handle app state changes for 'smart' mode
  useEffect(() => {
    if (mode !== 'smart') return;

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active' && shouldListenRef.current) {
        Voice.start('fr-FR').catch(() => {});
        setIsListening(true);
        isListeningRef.current = true;
      } else if (state === 'background' && isListeningRef.current) {
        Voice.stop().catch(() => {});
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [mode]);

  const start = useCallback(async () => {
    if (mode === 'manual') return;
    if (!isAvailable) {
      console.warn('[WakeWord] Speech recognition not available');
      return;
    }

    try {
      shouldListenRef.current = true;
      await Voice.start('fr-FR');
      setIsListening(true);
      isListeningRef.current = true;
      console.log(`[WakeWord] Listening started (mode: ${mode}, keyword: "${WAKE_KEYWORD}")`);
    } catch (err) {
      console.error('[WakeWord] Start failed:', err);
    }
  }, [mode, isAvailable]);

  const stop = useCallback(async () => {
    shouldListenRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    try {
      await Voice.stop();
      await Voice.destroy();
    } catch {
      // ignore
    }
    setIsListening(false);
    isListeningRef.current = false;
    console.log('[WakeWord] Listening stopped');
  }, []);

  // Pause/resume when main recording is active
  useEffect(() => {
    if (pauseWhileRecording && isListeningRef.current) {
      Voice.stop().catch(() => {});
      setIsListening(false);
      isListeningRef.current = false;
    } else if (!pauseWhileRecording && shouldListenRef.current && !isListeningRef.current) {
      Voice.start('fr-FR').catch(() => {});
      setIsListening(true);
      isListeningRef.current = true;
    }
  }, [pauseWhileRecording]);

  return {
    isListening,
    isAvailable,
    detectionMethod,
    mode,
    start,
    stop,
  };
}
