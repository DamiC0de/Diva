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

// Lazy-load Voice to avoid TurboModule crash on startup
let Voice: any = null;
let VoiceLoaded = false;

function getVoice(): any {
  if (VoiceLoaded) return Voice;
  VoiceLoaded = true;
  try {
    Voice = require('@react-native-voice/voice').default;
  } catch {
    console.log('[WakeWord] Voice module not available');
    Voice = null;
  }
  return Voice;
}

// Configuration
const WAKE_KEYWORD = 'diva';
// Cooldown to avoid rapid re-triggers (ms)
const COOLDOWN_MS = 2000;
// Restart delay after speech ends (ms)
const RESTART_DELAY_MS = 500;

export type WakeWordMode = 'always_on' | 'smart' | 'manual';

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
  const voiceInitialized = useRef(false);

  // Check availability on mount — only try to use Voice in non-manual mode
  useEffect(() => {
    if (mode === 'manual') return;
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
    
    try {
      const v = getVoice();
      setIsAvailable(v !== null);
    } catch {
      setIsAvailable(false);
    }
  }, [mode]);

  // Handle speech results — look for wake word
  const onSpeechResults = useCallback(
    (event: any) => {
      const now = Date.now();
      if (now - lastTriggerRef.current < COOLDOWN_MS) return;

      const results = (event.value || []) as string[];
      for (const transcript of results) {
        if (transcript.toLowerCase().includes(WAKE_KEYWORD)) {
          lastTriggerRef.current = now;
          console.log(`[WakeWord] Detected "${WAKE_KEYWORD}" in: "${transcript}"`);
          try { getVoice()?.stop().catch(() => {}); } catch {}
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
      restartTimerRef.current = setTimeout(() => {
        if (shouldListenRef.current) {
          try {
            getVoice()?.start('fr-FR').catch((err: any) => {
              console.warn('[WakeWord] Restart failed:', err);
            });
          } catch {}
        }
      }, RESTART_DELAY_MS);
    }
  }, [pauseWhileRecording]);

  // Handle errors — restart on recoverable errors
  const onSpeechError = useCallback((event: any) => {
    const errorCode = event.error?.code;
    console.warn('[WakeWord] Error:', event.error?.message);

    if (shouldListenRef.current && errorCode !== 'permissions') {
      restartTimerRef.current = setTimeout(() => {
        if (shouldListenRef.current) {
          try {
            getVoice()?.start('fr-FR').catch(() => {});
          } catch {}
        }
      }, RESTART_DELAY_MS * 2);
    }
  }, []);

  // Register Voice callbacks — only when not manual and voice is available
  useEffect(() => {
    if (mode === 'manual' || !isAvailable) return;

    const v = getVoice();
    if (!v) return;

    voiceInitialized.current = true;
    try {
      v.onSpeechResults = onSpeechResults;
      v.onSpeechEnd = onSpeechEnd;
      v.onSpeechError = onSpeechError;
    } catch (err) {
      console.warn('[WakeWord] Failed to register callbacks:', err);
    }

    return () => {
      if (voiceInitialized.current) {
        try {
          v.destroy().then(() => { try { v.removeAllListeners?.(); } catch {} }).catch(() => {});
        } catch {}
        voiceInitialized.current = false;
      }
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    };
  }, [mode, isAvailable, onSpeechResults, onSpeechEnd, onSpeechError]);

  // Handle app state changes for 'smart' mode
  useEffect(() => {
    if (mode !== 'smart' || !isAvailable) return;

    const handleAppState = (state: AppStateStatus) => {
      const v = getVoice();
      if (!v) return;
      if (state === 'active' && shouldListenRef.current) {
        try { v.start('fr-FR').catch(() => {}); } catch {}
        setIsListening(true);
        isListeningRef.current = true;
      } else if (state === 'background' && isListeningRef.current) {
        try { v.stop().catch(() => {}); } catch {}
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [mode, isAvailable]);

  const start = useCallback(async () => {
    if (mode === 'manual') return;
    if (!isAvailable) {
      console.warn('[WakeWord] Speech recognition not available');
      return;
    }

    const v = getVoice();
    if (!v) return;

    try {
      shouldListenRef.current = true;
      await v.start('fr-FR');
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

    const v = getVoice();
    if (!v) return;

    try {
      await v.stop();
    } catch {}

    try {
      await v.destroy();
    } catch {}

    setIsListening(false);
    isListeningRef.current = false;
    console.log('[WakeWord] Listening stopped');
  }, []);

  // Pause/resume when main recording is active
  useEffect(() => {
    if (!isAvailable) return;
    const v = getVoice();
    if (!v) return;

    if (pauseWhileRecording && isListeningRef.current) {
      try { v.stop().catch(() => {}); } catch {}
      setIsListening(false);
      isListeningRef.current = false;
    } else if (!pauseWhileRecording && shouldListenRef.current && !isListeningRef.current) {
      try { v.start('fr-FR').catch(() => {}); } catch {}
      setIsListening(true);
      isListeningRef.current = true;
    }
  }, [pauseWhileRecording, isAvailable]);

  return {
    isListening,
    isAvailable,
    detectionMethod: 'native-speech' as const,
    mode,
    start,
    stop,
  };
}
