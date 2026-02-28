/**
 * useVoiceSession — Main hook for voice-first interaction.
 * Tap orb → capture audio → send via WebSocket → receive + play TTS response.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import type { OrbState } from '../components/Orb/OrbView';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://72.60.155.227:4000';
const WS_URL = API_URL.replace('http', 'ws');

interface VoiceSessionOptions {
  token: string | null;
}

interface VoiceSessionReturn {
  orbState: OrbState;
  transcript: string | null;
  transcriptRole: 'user' | 'assistant';
  audioLevel: number;
  startListening: () => void;
  stopListening: () => void;
  cancel: () => void;
  isConnected: boolean;
}

export function useVoiceSession({ token }: VoiceSessionOptions): VoiceSessionReturn {
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcriptRole, setTranscriptRole] = useState<'user' | 'assistant'>('user');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // WebSocket connection
  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`${WS_URL}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setOrbState('idle');
    };

    ws.onmessage = async (event) => {
      // Binary = audio response
      if (typeof event.data !== 'string') {
        await playAudio(event.data);
        return;
      }

      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'state':
          case 'state_change':
            if (msg.state === 'processing' || msg.state === 'THINKING') {
              setOrbState('processing');
            } else if (msg.state === 'speaking' || msg.state === 'SYNTHESIZING') {
              setOrbState('speaking');
            } else if (msg.state === 'idle' || msg.state === 'COMPLETED') {
              setOrbState('idle');
            }
            break;
          case 'transcription':
            setTranscript(msg.text);
            setTranscriptRole('user');
            break;
          case 'response':
          case 'assistant_message':
            setTranscript(msg.text || msg.content);
            setTranscriptRole('assistant');
            // After showing, clear after 4s
            setTimeout(() => setTranscript(null), 4000);
            break;
          case 'tts_audio':
            // Base64 audio from server
            if (msg.audio) {
              await playBase64Audio(msg.audio);
            }
            break;
          case 'error':
            setOrbState('error');
            setTranscript(msg.message);
            setTranscriptRole('assistant');
            setTimeout(() => {
              setOrbState('idle');
              setTranscript(null);
            }, 3000);
            break;
          case 'connected':
            setOrbState('idle');
            break;
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setOrbState('idle');
    };

    ws.onerror = () => {
      setIsConnected(false);
      setOrbState('error');
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token]);

  const playBase64Audio = async (base64: string) => {
    try {
      setOrbState('speaking');
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/wav;base64,${base64}` },
        { shouldPlay: true },
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setOrbState('idle');
          sound.unloadAsync();
        }
      });
    } catch {
      setOrbState('idle');
    }
  };

  const playAudio = async (_data: unknown) => {
    // Binary audio playback — to be implemented with proper PCM handling
    setOrbState('speaking');
    setTimeout(() => setOrbState('idle'), 2000);
  };

  const startListening = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setOrbState('listening');

      // Notify server
      wsRef.current?.send(JSON.stringify({ type: 'start_listening' }));

      // Monitor audio levels
      recording.setProgressUpdateInterval(100);
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering != null) {
          // Convert dB to 0-1 range (metering is typically -160 to 0)
          const normalized = Math.max(0, Math.min(1, (status.metering + 50) / 50));
          setAudioLevel(normalized);
        }
      });
    } catch (err) {
      console.error('Failed to start recording:', err);
      setOrbState('error');
      setTimeout(() => setOrbState('idle'), 2000);
    }
  }, []);

  const stopListening = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    try {
      setOrbState('processing');
      setAudioLevel(0);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

      if (uri && wsRef.current?.readyState === WebSocket.OPEN) {
        // Read audio file and send as base64 (for now)
        const response = await fetch(uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          wsRef.current?.send(JSON.stringify({
            type: 'audio_message',
            audio: base64,
            format: 'wav',
          }));
        };
        reader.readAsDataURL(blob);
      }

      // Notify server
      wsRef.current?.send(JSON.stringify({ type: 'stop_listening' }));

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setOrbState('idle');
    }
  }, []);

  const cancel = useCallback(() => {
    // Stop recording if active
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    // Stop playback if active
    if (soundRef.current) {
      soundRef.current.stopAsync().catch(() => {});
      soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setOrbState('idle');
    setAudioLevel(0);
    setTranscript(null);
    wsRef.current?.send(JSON.stringify({ type: 'cancel' }));
  }, []);

  return {
    orbState,
    transcript,
    transcriptRole,
    audioLevel,
    startListening,
    stopListening,
    cancel,
    isConnected,
  };
}
