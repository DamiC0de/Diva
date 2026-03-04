/**
 * Keyword detection for voice interrupts during TTS playback.
 * Used to detect when user says "Diva", "stop", etc. while assistant is speaking.
 */

// Keywords that trigger interrupt during TTS
export const INTERRUPT_KEYWORDS = ['diva', 'stop', 'arrête', 'tais-toi'];

/**
 * Check if a transcript contains any interrupt keyword.
 * Case-insensitive matching.
 */
export function containsInterruptKeyword(transcript: string): boolean {
  const lowered = transcript.toLowerCase().trim();
  return INTERRUPT_KEYWORDS.some(kw => lowered.includes(kw));
}

/**
 * Find which keyword was detected in the transcript.
 * Returns the first matching keyword or null if none found.
 */
export function findInterruptKeyword(transcript: string): string | null {
  const lowered = transcript.toLowerCase().trim();
  return INTERRUPT_KEYWORDS.find(kw => lowered.includes(kw)) ?? null;
}
