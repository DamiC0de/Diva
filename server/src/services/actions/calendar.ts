/**
 * EL-018 — Google Calendar Integration
 *
 * CRUD events via Google Calendar API (OAuth2, shared with Gmail).
 */

import type { FastifyBaseLogger } from 'fastify';
import type Anthropic from '@anthropic-ai/sdk';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

export const CALENDAR_TOOLS: Anthropic.Tool[] = [
  {
    name: 'calendar_today',
    description: 'Liste les événements d\'aujourd\'hui',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'calendar_upcoming',
    description: 'Liste les événements des N prochains jours',
    input_schema: {
      type: 'object' as const,
      properties: {
        days: { type: 'number' as const, description: 'Nombre de jours (défaut 7)' },
      },
      required: [],
    },
  },
  {
    name: 'calendar_create',
    description: 'Crée un événement dans l\'agenda. TOUJOURS demander confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' as const, description: 'Titre de l\'événement' },
        start: { type: 'string' as const, description: 'Date/heure de début (ISO 8601)' },
        end: { type: 'string' as const, description: 'Date/heure de fin (ISO 8601, optionnel)' },
        description: { type: 'string' as const, description: 'Description (optionnel)' },
        location: { type: 'string' as const, description: 'Lieu (optionnel)' },
      },
      required: ['title', 'start'],
    },
  },
  {
    name: 'calendar_delete',
    description: 'Supprime un événement. TOUJOURS demander confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        event_id: { type: 'string' as const, description: 'ID de l\'événement à supprimer' },
      },
      required: ['event_id'],
    },
  },
];

export class CalendarService {
  private logger: FastifyBaseLogger;

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger;
  }

  private async getToken(_userId: string): Promise<string> {
    // TODO: same OAuth token as Gmail (shared Google OAuth)
    throw new Error('Google Calendar non connecté. Connecte Google dans les paramètres.');
  }

  private getTimezone(_userId: string): string {
    // TODO: from user settings
    return 'Europe/Paris';
  }

  async getEventsForDay(userId: string, date: Date): Promise<CalendarEvent[]> {
    const token = await this.getToken(userId);
    const tz = this.getTimezone(userId);

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const params = new URLSearchParams({
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      timeZone: tz,
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) throw new Error(`Calendar API error: ${response.status}`);

    const data = await response.json() as {
      items: { id: string; summary: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string }; description?: string; location?: string }[];
    };

    return (data.items ?? []).map((item) => ({
      id: item.id,
      title: item.summary,
      start: item.start.dateTime ?? item.start.date ?? '',
      end: item.end.dateTime ?? item.end.date ?? '',
      description: item.description,
      location: item.location,
    }));
  }

  async getUpcomingEvents(userId: string, days = 7): Promise<CalendarEvent[]> {
    const token = await this.getToken(userId);
    const tz = this.getTimezone(userId);

    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    const params = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      timeZone: tz,
      maxResults: '20',
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) throw new Error(`Calendar API error: ${response.status}`);

    const data = await response.json() as {
      items: { id: string; summary: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string }; description?: string; location?: string }[];
    };

    return (data.items ?? []).map((item) => ({
      id: item.id,
      title: item.summary,
      start: item.start.dateTime ?? item.start.date ?? '',
      end: item.end.dateTime ?? item.end.date ?? '',
      description: item.description,
      location: item.location,
    }));
  }

  async createEvent(
    userId: string,
    title: string,
    start: string,
    end?: string,
    description?: string,
    location?: string,
  ): Promise<CalendarEvent> {
    const token = await this.getToken(userId);
    const tz = this.getTimezone(userId);

    // Default: 1 hour event
    const endTime = end ?? new Date(new Date(start).getTime() + 3600000).toISOString();

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: title,
          start: { dateTime: start, timeZone: tz },
          end: { dateTime: endTime, timeZone: tz },
          description,
          location,
        }),
      },
    );

    if (!response.ok) throw new Error(`Calendar create error: ${response.status}`);

    const item = await response.json() as { id: string; summary: string; start: { dateTime: string }; end: { dateTime: string } };
    this.logger.info({ msg: 'Event created', title, start });

    return {
      id: item.id,
      title: item.summary,
      start: item.start.dateTime,
      end: item.end.dateTime,
    };
  }

  async deleteEvent(userId: string, eventId: string): Promise<void> {
    const token = await this.getToken(userId);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) throw new Error(`Calendar delete error: ${response.status}`);
    this.logger.info({ msg: 'Event deleted', eventId });
  }

  async executeTool(userId: string, toolName: string, input: Record<string, unknown>): Promise<string> {
    try {
      switch (toolName) {
        case 'calendar_today': {
          const events = await this.getEventsForDay(userId, new Date());
          if (events.length === 0) return 'Aucun événement aujourd\'hui. Journée libre !';
          return events
            .map((e) => {
              const time = new Date(e.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              return `• ${time} — ${e.title}${e.location ? ` (${e.location})` : ''}`;
            })
            .join('\n');
        }
        case 'calendar_upcoming': {
          const days = (input.days as number) ?? 7;
          const events = await this.getUpcomingEvents(userId, days);
          if (events.length === 0) return `Aucun événement dans les ${days} prochains jours.`;
          return events
            .map((e) => {
              const date = new Date(e.start).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
              const time = new Date(e.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              return `• ${date} ${time} — ${e.title}`;
            })
            .join('\n');
        }
        case 'calendar_create': {
          const event = await this.createEvent(
            userId,
            input.title as string,
            input.start as string,
            input.end as string | undefined,
            input.description as string | undefined,
            input.location as string | undefined,
          );
          return `Événement créé : "${event.title}" le ${new Date(event.start).toLocaleDateString('fr-FR')}`;
        }
        case 'calendar_delete': {
          await this.deleteEvent(userId, input.event_id as string);
          return 'Événement supprimé.';
        }
        default:
          return `Outil inconnu: ${toolName}`;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      return `Erreur Calendar: ${message}`;
    }
  }
}
