/**
 * EL-019 — Contacts iOS (device-side execution)
 *
 * Contact search runs ON THE DEVICE (not server).
 * The server sends a device-exec request via WebSocket,
 * and the app responds with results.
 */

import type Anthropic from '@anthropic-ai/sdk';

export const CONTACTS_TOOLS: Anthropic.Tool[] = [
  {
    name: 'contact_search',
    description: 'Recherche un contact dans le répertoire de l\'utilisateur (exécuté sur l\'iPhone)',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' as const, description: 'Nom ou prénom à rechercher' },
      },
      required: ['query'],
    },
  },
  {
    name: 'call_contact',
    description: 'Lance un appel téléphonique vers un contact (ouvre le dialer iOS)',
    input_schema: {
      type: 'object' as const,
      properties: {
        phone_number: { type: 'string' as const, description: 'Numéro de téléphone' },
        contact_name: { type: 'string' as const, description: 'Nom du contact (pour confirmation)' },
      },
      required: ['phone_number'],
    },
  },
];

/**
 * These tools require device-side execution.
 * The orchestrator sends a `device_exec` WS message to the app,
 * and the app executes the action locally (expo-contacts, Linking.openURL).
 *
 * Server-side handler just formats the request.
 */
export function isDeviceSideTool(toolName: string): boolean {
  return ['contact_search', 'call_contact'].includes(toolName);
}

export function formatDeviceExecRequest(
  toolName: string,
  input: Record<string, unknown>,
): { action: string; params: Record<string, unknown> } {
  switch (toolName) {
    case 'contact_search':
      return { action: 'search_contacts', params: { query: input.query } };
    case 'call_contact':
      return { action: 'open_url', params: { url: `tel://${input.phone_number as string}` } };
    default:
      return { action: toolName, params: input };
  }
}
