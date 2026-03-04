/**
 * US-023 — Timer Parser
 * 
 * Parse duration from natural language text (French).
 * Supports: "timer 5 minutes", "minuteur de 30 secondes", "chrono 1 heure"
 */

export interface TimerRequest {
  durationSeconds: number;
  label?: string;
}

/**
 * Parse a timer request from text.
 * Returns null if no valid timer command found.
 */
export function parseTimerRequest(text: string): TimerRequest | null {
  const lowered = text.toLowerCase();
  
  // Check if this is a timer-related request
  if (!/(timer|minuteur|chrono)/i.test(lowered)) {
    return null;
  }
  
  // Patterns: "timer 5 minutes", "minuteur de 30 secondes", "chrono 2 heures"
  const patterns = [
    // "timer 5 minutes", "minuteur de 30 secondes"
    /(?:timer|minuteur|chrono)(?:\s+de)?\s+(\d+)\s*(min|minute|sec|seconde|h|heure)s?/i,
    // "5 minutes timer", "30 secondes chrono"
    /(\d+)\s*(min|minute|sec|seconde|h|heure)s?\s+(?:timer|minuteur|chrono)/i,
    // "timer de 5 min"
    /(?:timer|minuteur|chrono)\s+de\s+(\d+)\s*(min|minute|sec|seconde|h|heure)s?/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      
      let seconds = 0;
      if (unit.startsWith('h')) {
        seconds = amount * 3600;
      } else if (unit.startsWith('min') || unit === 'm') {
        seconds = amount * 60;
      } else {
        seconds = amount;
      }
      
      // Validate duration (1 second to 24 hours)
      if (seconds < 1 || seconds > 86400) {
        return null;
      }
      
      // Extract optional label: "pour les pâtes", "pour le gâteau"
      const labelMatch = text.match(/pour\s+(.+?)(?:\s+de\s+\d|\s+dans|$)/i);
      
      return {
        durationSeconds: seconds,
        label: labelMatch?.[1]?.trim(),
      };
    }
  }
  
  return null;
}

/**
 * Format duration in human-readable French.
 */
export function formatDuration(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (mins > 0) {
      return `${hours} heure${hours > 1 ? 's' : ''} et ${mins} minute${mins > 1 ? 's' : ''}`;
    }
    return `${hours} heure${hours > 1 ? 's' : ''}`;
  } else if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs > 0) {
      return `${mins} minute${mins > 1 ? 's' : ''} et ${secs} seconde${secs > 1 ? 's' : ''}`;
    }
    return `${mins} minute${mins > 1 ? 's' : ''}`;
  } else {
    return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
  }
}

/**
 * Check if text is a timer cancellation request.
 */
export function isTimerCancelRequest(text: string): boolean {
  const lowered = text.toLowerCase();
  return (
    (lowered.includes('annule') || lowered.includes('arrête') || lowered.includes('stop')) &&
    (lowered.includes('timer') || lowered.includes('minuteur') || lowered.includes('chrono'))
  );
}
