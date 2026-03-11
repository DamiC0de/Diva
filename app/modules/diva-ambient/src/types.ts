export type AmbientState =
  | 'idle'           // Module loaded but not listening
  | 'listening'      // Background listening active (VAD level 1)
  | 'voiceDetected'  // VAD triggered, speech recognition active (level 2)
  | 'processing'     // Wake word detected, handing off to voice session
  | 'paused'         // Paused (phone call, interruption)
  | 'error';         // Error state

export interface AmbientStatus {
  state: AmbientState;
  isListening: boolean;
  isAvailable: boolean;
  /** Battery level at which ambient mode auto-pauses (0-100) */
  batteryThreshold: number;
  /** Whether speech recognition is currently active */
  isSpeechRecognitionActive: boolean;
}

export interface WakeWordEvent {
  /** Full transcript that contained the wake word */
  transcript: string;
  /** Confidence score (0-1) if available */
  confidence: number;
  /** Timestamp of detection */
  timestamp: number;
}
