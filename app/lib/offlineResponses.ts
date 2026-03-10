/**
 * offlineResponses — Local responses for common queries when offline.
 * Provides basic functionality without requiring network access.
 * US-038: Offline Graceful Mode
 */

/**
 * Attempts to provide a local response for common queries.
 * Returns null if no local response is available (requires network).
 */
export function getOfflineResponse(text: string): string | null {
  const lowered = text.toLowerCase().trim();

  // Time queries
  if (
    lowered.includes('quelle heure') ||
    lowered.includes("l'heure") ||
    lowered.includes('heure qu') ||
    lowered.includes('what time') ||
    lowered.includes('the time')
  ) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    if (minutes === 0) {
      return `Il est ${hours} heures pile.`;
    } else if (minutes === 30) {
      return `Il est ${hours} heures et demie.`;
    } else if (minutes === 15) {
      return `Il est ${hours} heures et quart.`;
    } else if (minutes === 45) {
      return `Il est ${hours + 1} heures moins le quart.`;
    } else {
      return `Il est ${hours} heures ${minutes}.`;
    }
  }

  // Date queries
  if (
    lowered.includes('quel jour') ||
    lowered.includes('quelle date') ||
    lowered.includes('on est le') ||
    lowered.includes('date aujourd') ||
    lowered.includes('what day') ||
    lowered.includes("today's date")
  ) {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    const dateStr = new Date().toLocaleDateString('fr-FR', options);
    return `Nous sommes le ${dateStr}.`;
  }

  // Day of week
  if (
    lowered.includes('jour de la semaine') ||
    lowered.includes('on est quel jour') ||
    lowered.includes('quel jour sommes') ||
    lowered.includes('quel jour on est')
  ) {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
    const dayStr = new Date().toLocaleDateString('fr-FR', options);
    return `Nous sommes ${dayStr}.`;
  }

  // No local response available
  return null;
}

/**
 * Default offline message when no local response is available.
 */
export const OFFLINE_DEFAULT_MESSAGE = 
  "Je suis hors connexion. Vérifie ton réseau internet et réessaye.";

/**
 * Message shown when transitioning back online.
 */
export const ONLINE_RESTORED_MESSAGE = 
  "La connexion est rétablie. Je suis prête à t'aider.";
