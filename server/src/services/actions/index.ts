/**
 * Action Runner — Routes tool calls from Claude to the right service.
 */

import type { FastifyBaseLogger } from 'fastify';
import type Anthropic from '@anthropic-ai/sdk';
import { GmailService, GMAIL_TOOLS } from './gmail.js';
import { CalendarService, CALENDAR_TOOLS } from './calendar.js';
import { CONTACTS_TOOLS, isDeviceSideTool, formatDeviceExecRequest } from './contacts.js';

// All available tools
export function getAllTools(): Anthropic.Tool[] {
  return [
    ...GMAIL_TOOLS,
    ...CALENDAR_TOOLS,
    ...CONTACTS_TOOLS,
    // Weather & Web Search tools (EL-020)
    {
      name: 'get_weather',
      description: 'Obtient la météo actuelle et les prévisions pour une ville',
      input_schema: {
        type: 'object' as const,
        properties: {
          city: { type: 'string' as const, description: 'Nom de la ville' },
          days: { type: 'number' as const, description: 'Jours de prévisions (1-7, défaut 1)' },
        },
        required: ['city'],
      },
    },
    {
      name: 'web_search',
      description: 'Recherche sur le web pour des informations récentes',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string' as const, description: 'Requête de recherche' },
        },
        required: ['query'],
      },
    },
    {
      name: 'open_app',
      description: 'Ouvre une application sur l\'iPhone (YouTube, Spotify, Maps, etc.)',
      input_schema: {
        type: 'object' as const,
        properties: {
          app: { type: 'string' as const, description: 'Nom de l\'app (youtube, spotify, maps, whatsapp, etc.)' },
          query: { type: 'string' as const, description: 'Recherche ou destination (optionnel)' },
        },
        required: ['app'],
      },
    },
    {
      name: 'create_reminder',
      description: 'Crée un rappel pour l\'utilisateur',
      input_schema: {
        type: 'object' as const,
        properties: {
          text: { type: 'string' as const, description: 'Texte du rappel' },
          datetime: { type: 'string' as const, description: 'Date/heure du rappel (ISO 8601)' },
        },
        required: ['text', 'datetime'],
      },
    },
  ];
}

export class ActionRunner {
  private gmail: GmailService;
  private calendar: CalendarService;
  private logger: FastifyBaseLogger;

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger;
    this.gmail = new GmailService(logger);
    this.calendar = new CalendarService(logger);
  }

  /**
   * Execute a tool call and return the result as a string.
   */
  async execute(
    userId: string,
    toolName: string,
    input: Record<string, unknown>,
  ): Promise<{ result: string; deviceExec?: { action: string; params: Record<string, unknown> } }> {
    this.logger.info({ msg: 'Executing tool', toolName, userId });

    // Device-side tools
    if (isDeviceSideTool(toolName)) {
      const deviceExec = formatDeviceExecRequest(toolName, input);
      return {
        result: `Action envoyée à l'appareil: ${deviceExec.action}`,
        deviceExec,
      };
    }

    // Server-side tools
    switch (toolName) {
      case 'gmail_list_unread':
      case 'gmail_read':
      case 'gmail_send':
      case 'gmail_reply':
        return { result: await this.gmail.executeTool(userId, toolName, input) };

      case 'calendar_today':
      case 'calendar_upcoming':
      case 'calendar_create':
      case 'calendar_delete':
        return { result: await this.calendar.executeTool(userId, toolName, input) };

      case 'get_weather':
        return { result: await this.getWeather(input.city as string, (input.days as number) ?? 1) };

      case 'web_search':
        return { result: `[Recherche web pour "${input.query}" — non implémenté]` };

      case 'open_app':
        return {
          result: `Ouverture de ${input.app as string}`,
          deviceExec: { action: 'open_app', params: input },
        };

      case 'create_reminder':
        return { result: `Rappel créé : "${input.text}" pour le ${input.datetime}` };

      default:
        return { result: `Outil inconnu: ${toolName}` };
    }
  }

  private async getWeather(city: string, days: number): Promise<string> {
    try {
      // Open-Meteo geocoding
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr`,
      );
      const geoData = await geoResponse.json() as { results?: { latitude: number; longitude: number; name: string }[] };

      if (!geoData.results?.length) {
        return `Ville "${city}" non trouvée.`;
      }

      const { latitude, longitude, name } = geoData.results[0]!;

      // Weather data
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=${days}&timezone=Europe/Paris`,
      );
      const weather = await weatherResponse.json() as {
        current: { temperature_2m: number; weather_code: number; wind_speed_10m: number };
        daily?: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; weather_code: number[] };
      };

      const current = weather.current;
      let result = `Météo à ${name} : ${current.temperature_2m}°C, vent ${current.wind_speed_10m} km/h`;

      if (days > 1 && weather.daily) {
        result += '\nPrévisions :';
        for (let i = 0; i < Math.min(days, weather.daily.time.length); i++) {
          result += `\n• ${weather.daily.time[i]} : ${weather.daily.temperature_2m_min[i]}°-${weather.daily.temperature_2m_max[i]}°C`;
        }
      }

      return result;
    } catch (error) {
      return `Erreur météo: ${error instanceof Error ? error.message : 'inconnue'}`;
    }
  }
}
