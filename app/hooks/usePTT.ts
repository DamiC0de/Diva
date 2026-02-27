/**
 * EL-013 — Push-to-Talk hook for audio recording.
 */

import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

type PTTState = 'idle' | 'recording' | 'processing';

interface UsePTTOptions {
  onAudioReady: (base64Audio: string) => void;
}

export function usePTT({ onAudioReady }: UsePTTOptions) {
  const [state, setState] = useState<PTTState>('idle');
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        console.warn('Microphone permission not granted');
        return;
      }

      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      recordingRef.current = recording;
      setState('recording');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setState('idle');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    setState('processing');

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (uri) {
        // Read file as base64
        const response = await fetch(uri);
        const blob = await response.blob();
        const reader = new FileReader();

        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          if (base64) {
            onAudioReady(base64);
          }
          setState('idle');
        };

        reader.readAsDataURL(blob);
      } else {
        setState('idle');
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setState('idle');
    }
  }, [onAudioReady]);

  const cancelRecording = useCallback(async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {
        // Ignore
      }
      recordingRef.current = null;
    }
    setState('idle');
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
