/**
 * useAudioRecording — Recording with expo-av, silence detection, and audio level monitoring.
 * Handles microphone recording, automatic silence detection, and audio level callbacks.
 */
import { useState, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import { ERROR_MESSAGES, type ErrorMessage } from '../constants/errors';

// Silence detection config
const SILENCE_THRESHOLD = -45; // dB — below this = silence
const SILENCE_DURATION_MS = 2500; // 2.5s of silence → auto-send
const MIN_RECORDING_MS = 1000; // don't auto-stop before 1s
const LONG_RECORDING_SILENCE_MS = 3500; // 3.5s silence if recording > 10s

// Audio level detection — US-006
const MIN_AUDIBLE_LEVEL = -50; // dB — below this = inaudible

export interface AudioRecordingReturn {
  /** Start recording with silence detection */
  startRecording: () => Promise<void>;
  /** Stop recording and get audio data */
  stopRecording: () => Promise<RecordingResult | null>;
  /** Current audio level (0-1) */
  audioLevel: number;
  /** Whether currently recording */
  isRecording: boolean;
  /** Recording ref for external access */
  recordingRef: React.MutableRefObject<Audio.Recording | null>;
  /** Whether we're in the process of stopping */
  stoppingRef: React.MutableRefObject<boolean>;
  /** Error if any */
  error: ErrorMessage | null;
  /** Clear error */
  clearError: () => void;
}

export interface RecordingResult {
  uri: string;
  base64: string;
  hasAudibleAudio: boolean;
}

interface AudioRecordingOptions {
  /** Called when silence is detected and recording should auto-stop */
  onSilenceDetected?: () => void;
  /** Called when audio level changes */
  onAudioLevelChange?: (level: number) => void;
}

export function useAudioRecording(options: AudioRecordingOptions = {}): AudioRecordingReturn {
  const { onSilenceDetected, onAudioLevelChange } = options;
  
  const [audioLevel, setAudioLevel] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<ErrorMessage | null>(null);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number>(0);
  const stoppingRef = useRef(false);
  const hasAudibleAudioRef = useRef(false);
  const isPreparingRecordingRef = useRef(false);
  
  // Store callbacks in refs
  const onSilenceDetectedRef = useRef(onSilenceDetected);
  const onAudioLevelChangeRef = useRef(onAudioLevelChange);
  
  onSilenceDetectedRef.current = onSilenceDetected;
  onAudioLevelChangeRef.current = onAudioLevelChange;

  const startRecording = useCallback(async () => {
    // Prevent concurrent recording preparations
    if (isPreparingRecordingRef.current) {
      console.log('[AudioRecording] Already preparing recording, skipping');
      return;
    }

    // Reset stopping flag
    stoppingRef.current = false;
    isPreparingRecordingRef.current = true;

    try {
      // Cleanup any previous recording
      if (recordingRef.current) {
        try {
          const status = await recordingRef.current.getStatusAsync();
          if (status.canRecord || status.isRecording) {
            await recordingRef.current.stopAndUnloadAsync();
          }
        } catch {}
        recordingRef.current = null;
      }

      // Release any recording session first
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
      } catch {}

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError(ERROR_MESSAGES.MICROPHONE_PERMISSION);
        return;
      }

      // Wait for iOS to release audio resources
      await new Promise(r => setTimeout(r, 250));

      // Switch to recording mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      await new Promise(r => setTimeout(r, 50));

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      recordingStartRef.current = Date.now();
      silenceStartRef.current = null;
      stoppingRef.current = false;
      hasAudibleAudioRef.current = false;
      setIsRecording(true);

      // Monitor audio levels + silence detection
      recording.setProgressUpdateInterval(100);
      recording.setOnRecordingStatusUpdate((recStatus) => {
        if (!recStatus.isRecording || recStatus.metering == null) return;

        const db = recStatus.metering;
        const normalized = Math.max(0, Math.min(1, (db + 50) / 50));
        setAudioLevel(normalized);
        onAudioLevelChangeRef.current?.(normalized);

        // Track if we've heard any audible audio
        if (db > MIN_AUDIBLE_LEVEL) {
          hasAudibleAudioRef.current = true;
        }

        const now = Date.now();
        const elapsed = now - recordingStartRef.current;

        // Silence detection (only after minimum recording time)
        if (elapsed > MIN_RECORDING_MS) {
          if (db < SILENCE_THRESHOLD) {
            if (!silenceStartRef.current) {
              silenceStartRef.current = now;
            } else {
              const silenceRequired = elapsed > 10000 
                ? LONG_RECORDING_SILENCE_MS 
                : SILENCE_DURATION_MS;
              
              if (now - silenceStartRef.current >= silenceRequired) {
                if (!stoppingRef.current) {
                  stoppingRef.current = true;
                  onSilenceDetectedRef.current?.();
                }
              }
            }
          } else {
            silenceStartRef.current = null;
          }
        }
      });
    } catch (err) {
      console.error('[AudioRecording] Failed to start recording:', err);
      setError({
        title: 'Erreur micro',
        message: 'Impossible de démarrer l\'enregistrement.',
        action: 'Réessayer',
      });
    } finally {
      isPreparingRecordingRef.current = false;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    const recording = recordingRef.current;
    if (!recording) return null;

    try {
      setAudioLevel(0);
      setIsRecording(false);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

      // Check if we heard any audible audio
      if (!hasAudibleAudioRef.current) {
        setError(ERROR_MESSAGES.AUDIO_TOO_QUIET);
        return null;
      }

      if (!uri) return null;

      // Convert to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve({
            uri,
            base64,
            hasAudibleAudio: hasAudibleAudioRef.current,
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error('[AudioRecording] Failed to stop recording:', err);
      return null;
    } finally {
      stoppingRef.current = false;
      
      // Switch back to playback mode
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      } catch {}
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    startRecording,
    stopRecording,
    audioLevel,
    isRecording,
    recordingRef,
    stoppingRef,
    error,
    clearError,
  };
}
