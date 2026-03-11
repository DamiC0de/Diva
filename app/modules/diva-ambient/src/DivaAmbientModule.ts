import { requireNativeModule, EventEmitter } from 'expo-modules-core';
import type { AmbientStatus, WakeWordEvent } from './types';

// Native module — will throw on Android (iOS only)
let nativeModule: any = null;
let emitter: any = null;

try {
  nativeModule = requireNativeModule('DivaAmbient');
  emitter = new EventEmitter(nativeModule);
  console.log('[DivaAmbient] Native module loaded successfully');
} catch (err) {
  console.warn('[DivaAmbient] Native module not available:', err);
}

const DivaAmbient = {
  /**
   * Start background listening (VAD + wake word detection)
   * This is async because it requests permissions
   */
  async startListening(): Promise<void> {
    if (!nativeModule) {
      console.warn('[DivaAmbient] Module not available');
      return;
    }
    return nativeModule.startListening();
  },

  /**
   * Stop background listening (sync)
   */
  stopListening(): void {
    if (!nativeModule) return;
    nativeModule.stopListening();
  },

  /**
   * Check if currently listening (sync)
   */
  isListening(): boolean {
    if (!nativeModule) return false;
    return nativeModule.isListening();
  },

  /**
   * Get current ambient status (sync)
   */
  getStatus(): AmbientStatus {
    if (!nativeModule) {
      return {
        state: 'idle',
        isListening: false,
        isAvailable: false,
        batteryThreshold: 30,
        isSpeechRecognitionActive: false,
      };
    }
    return nativeModule.getStatus();
  },

  /**
   * Subscribe to wake word detection events
   */
  addWakeWordListener(callback: (event: WakeWordEvent) => void) {
    if (!emitter) return { remove: () => {} };
    return emitter.addListener('onWakeWordDetected', callback);
  },

  /**
   * Subscribe to status change events
   */
  addStatusListener(callback: (status: AmbientStatus) => void) {
    if (!emitter) return { remove: () => {} };
    return emitter.addListener('onStatusChange', callback);
  },

  /**
   * Subscribe to error events
   */
  addErrorListener(callback: (error: { message: string; code: string }) => void) {
    if (!emitter) return { remove: () => {} };
    return emitter.addListener('onError', callback);
  },
};

export default DivaAmbient;
