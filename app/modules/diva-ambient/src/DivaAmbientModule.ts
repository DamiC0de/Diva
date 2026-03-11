import { requireNativeModule, EventEmitter } from 'expo-modules-core';
import type { AmbientStatus, WakeWordEvent } from './types';

// Native module — will throw on Android (iOS only)
let nativeModule: any = null;
try {
  nativeModule = requireNativeModule('DivaAmbient');
} catch {
  console.warn('[DivaAmbient] Native module not available (Android or missing prebuild)');
}

const emitter = nativeModule ? new EventEmitter(nativeModule) : null;

const DivaAmbient = {
  /**
   * Start background listening (VAD + wake word detection)
   */
  async startListening(): Promise<void> {
    if (!nativeModule) {
      console.warn('[DivaAmbient] Module not available');
      return;
    }
    return nativeModule.startListening();
  },

  /**
   * Stop background listening
   */
  async stopListening(): Promise<void> {
    if (!nativeModule) return;
    return nativeModule.stopListening();
  },

  /**
   * Check if currently listening
   */
  async isListening(): Promise<boolean> {
    if (!nativeModule) return false;
    return nativeModule.isListening();
  },

  /**
   * Get current ambient status
   */
  async getStatus(): Promise<AmbientStatus> {
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
