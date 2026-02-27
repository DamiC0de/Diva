/**
 * EL-031 — Widget shared types
 */

export interface WidgetData {
  nextEvent?: {
    title: string;
    time: string;    // ISO date
    location?: string;
  };
  weather?: {
    temp: number;
    description: string;
    icon: string;    // SF Symbol name or emoji
  };
  unreadEmails: number;
  lastUpdate: string; // ISO date
}

export interface LiveActivityState {
  status: 'listening' | 'transcribing' | 'thinking' | 'responding' | 'done';
  text?: string;     // Current transcription or response preview
  startedAt: string;
}

// App Groups keys (same as keyboard)
export const WIDGET_KEYS = {
  NEXT_EVENT: 'widget.nextEvent',
  WEATHER: 'widget.weather',
  UNREAD_EMAILS: 'widget.unreadEmails',
  LAST_UPDATE: 'widget.lastUpdate',
} as const;

// Deep link schemes
export const DEEP_LINKS = {
  conversation: 'elio://conversation',
  services: 'elio://services',
  settings: 'elio://settings',
  ptt: 'elio://conversation?mode=ptt',
} as const;
