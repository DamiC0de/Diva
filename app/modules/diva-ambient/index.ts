/**
 * Diva Ambient Module — Background wake word detection
 *
 * Native Swift module that manages:
 * - AVAudioSession (background audio)
 * - AVAudioEngine (microphone tap)
 * - VAD (Voice Activity Detection)
 * - SFSpeechRecognizer (wake word detection)
 *
 * Usage:
 *   import { DivaAmbient } from './modules/diva-ambient';
 *   await DivaAmbient.startListening();
 */

export { default as DivaAmbient } from './src/DivaAmbientModule';
export { useDivaAmbient } from './src/useDivaAmbient';
export type { AmbientStatus, AmbientState } from './src/types';
