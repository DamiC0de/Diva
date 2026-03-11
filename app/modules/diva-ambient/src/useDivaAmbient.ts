import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import DivaAmbient from './DivaAmbientModule';
import type { AmbientState, AmbientStatus, WakeWordEvent } from './types';

interface UseDivaAmbientOptions {
  /** Called when wake word "Diva" is detected */
  onWakeWordDetected?: (event: WakeWordEvent) => void;
  /** Auto-start listening on mount */
  autoStart?: boolean;
  /** Whether to pause (e.g., during active voice session) */
  paused?: boolean;
}

export function useDivaAmbient({
  onWakeWordDetected,
  autoStart = false,
  paused = false,
}: UseDivaAmbientOptions = {}) {
  const [state, setState] = useState<AmbientState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const wasListeningBeforePause = useRef(false);

  // Subscribe to native events
  useEffect(() => {
    const statusSub = DivaAmbient.addStatusListener((status: AmbientStatus) => {
      setState(status.state);
      setIsListening(status.isListening);
      setIsAvailable(status.isAvailable);
    });

    const wakeWordSub = DivaAmbient.addWakeWordListener((event: WakeWordEvent) => {
      onWakeWordDetected?.(event);
    });

    const errorSub = DivaAmbient.addErrorListener((error) => {
      console.error('[DivaAmbient] Error:', error.message);
      setState('error');
    });

    // Get initial status
    DivaAmbient.getStatus().then((status) => {
      setState(status.state);
      setIsListening(status.isListening);
      setIsAvailable(status.isAvailable);
    });

    return () => {
      statusSub.remove();
      wakeWordSub.remove();
      errorSub.remove();
    };
  }, [onWakeWordDetected]);

  // Auto-start
  useEffect(() => {
    if (autoStart && isAvailable && !isListening && !paused) {
      DivaAmbient.startListening();
    }
  }, [autoStart, isAvailable, isListening, paused]);

  // Handle pause/resume (e.g., during active voice session)
  useEffect(() => {
    if (paused && isListening) {
      wasListeningBeforePause.current = true;
      DivaAmbient.stopListening();
    } else if (!paused && wasListeningBeforePause.current) {
      wasListeningBeforePause.current = false;
      DivaAmbient.startListening();
    }
  }, [paused, isListening]);

  // Handle app state changes
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && wasListeningBeforePause.current) {
        // App came back to foreground — resume if was listening
        DivaAmbient.startListening();
        wasListeningBeforePause.current = false;
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  const start = useCallback(async () => {
    await DivaAmbient.startListening();
  }, []);

  const stop = useCallback(async () => {
    wasListeningBeforePause.current = false;
    await DivaAmbient.stopListening();
  }, []);

  return {
    state,
    isListening,
    isAvailable,
    start,
    stop,
  };
}
