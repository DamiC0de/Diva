/**
 * EL-010 — Wake Word detection hook
 *
 * Uses @react-native-voice/voice (native iOS Speech Recognition)
 * to detect the keyword "Diva" in continuous listening mode.
 *
 * IMPORTANT: Voice module is loaded dynamically to prevent TurboModule
 * crash at startup. The module is only initialized when wake word
 * mode is actually activated.
 *
 * Supports three modes:
 * - always_on: listens continuously, restarts after each recognition
 * - smart: listens continuously but pauses in background
 * - manual: wake word disabled, user must tap to activate
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

type WakeWordMode = 'always_on' | 'smart' | 'manual';

const WAKE_KEYWORD = 'diva';
// Cooldown to avoid rapid re-triggers (ms)
const COOLDOWN_MS = 2000;
// Restart delay after speech ends (ms)
const RESTART_DELAY_MS = 500;

// Dynamic Voice module reference — loaded lazily to avoid TurboModule crash
let VoiceModule: any = null;

async function getVoice(): Promise<any> {
  if (VoiceModule) return VoiceModule;
  try {
    const mod = await import('@react-native-voice/voice');
    VoiceModule = mod.default || mod;
    return VoiceModule;
  } catch (err) {
    console.warn('[WakeWord] Failed to load Voice module:', err);
    return null;
  }
}

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
  const voiceRef = useRef<any>(null);

  // Check availability on mount — lazy load the module
  useEffect(() => {
    if (mode === 'manual') return;

    let mounted = true;
    getVoice().then((voice) => {
      if (!mounted || !voice) return;
      voiceRef.current = voice;
      setIsAvailable(Platform.OS === 'ios' || Platform.OS === 'android');
    });
    return () => { mounted = false; };
  }, [mode]);

  // Handle speech results — look for wake word
  const onSpeechResults = useCallback(
    (event: any) => {
      const now = Date.now();
      if (now - lastTriggerRef.current < COOLDOWN_MS) return;

      const results = event.value || [];
      for (const transcript of results) {
        if (transcript.toLowerCase().includes(WAKE_KEYWORD)) {
          lastTriggerRef.current = now;
          console.log(`[WakeWord] Detected "${WAKE_KEYWORD}" in: "${transcript}"`);
          // Stop listening briefly, callback will handle activation
          voiceRef.current?.stop?.().catch(() => {});
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
        if (shouldListenRef.current && voiceRef.current) {
          voiceRef.current.start('fr-FR').catch((err: any) => {
            console.warn('[WakeWord] Restart failed:', err);
          });
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
        if (shouldListenRef.current && voiceRef.current) {
          voiceRef.current.start('fr-FR').catch(() => {});
        }
      }, RESTART_DELAY_MS * 2);
    }
  }, []);

  // Register Voice callbacks when module is available
  useEffect(() => {
    const voice = voiceRef.current;
    if (!voice) return;

    voice.onSpeechResults = onSpeechResults;
    voice.onSpeechEnd = onSpeechEnd;
    voice.onSpeechError = onSpeechError;

    return () => {
      voice.destroy?.().then(() => voice.removeAllListeners?.()).catch(() => {});
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    };
  }, [onSpeechResults, onSpeechEnd, onSpeechError, isAvailable]);

  // Handle app state changes for 'smart' mode
  useEffect(() => {
    if (mode !== 'smart' || !voiceRef.current) return;

    const handleAppState = (state: AppStateStatus) => {
      const voice = voiceRef.current;
      if (!voice) return;

      if (state === 'active' && shouldListenRef.current) {
        voice.start('fr-FR').catch(() => {});
        setIsListening(true);
        isListeningRef.current = true;
      } else if (state === 'background' && isListeningRef.current) {
        voice.stop().catch(() => {});
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [mode, isAvailable]);

  const start = useCallback(async () => {
    if (mode === 'manual') return;

    const voice = voiceRef.current || await getVoice();
    if (!voice) {
      console.warn('[WakeWord] Speech recognition not available');
      return;
    }
    voiceRef.current = voice;

    try {
      shouldListenRef.current = true;
      await voice.start('fr-FR');
      setIsListening(true);
      isListeningRef.current = true;
      console.log(`[WakeWord] Listening started (mode: ${mode}, keyword: "${WAKE_KEYWORD}")`);
    } catch (err) {
      console.error('[WakeWord] Start failed:', err);
      // Don't crash the app — just disable wake word
      setIsAvailable(false);
    }
  }, [mode]);

  const stop = useCallback(async () => {
    shouldListenRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    const voice = voiceRef.current;
    if (!voice) return;
    try {
      await voice.stop();
      await voice.destroy();
    } catch {
      // ignore
    }
    setIsListening(false);
    isListeningRef.current = false;
    console.log('[WakeWord] Listening stopped');
  }, []);

  // Pause/resume when main recording is active
  useEffect(() => {
    const voice = voiceRef.current;
    if (!voice) return;

    if (pauseWhileRecording && isListeningRef.current) {
      voice.stop().catch(() => {});
      setIsListening(false);
      isListeningRef.current = false;
    } else if (!pauseWhileRecording && shouldListenRef.current && !isListeningRef.current) {
      voice.start('fr-FR').catch(() => {});
      setIsListening(true);
      isListeningRef.current = true;
    }
  }, [pauseWhileRecording]);

  return {
    isListening,
    isAvailable,
    mode,
    start,
    stop,
  };
}
