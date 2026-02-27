/**
 * EL-017 — Gmail Integration Service
 *
 * Handles email operations via Gmail API (OAuth2).
 * Exposed as Claude tool calls.
 */

import type { FastifyBaseLogger } from 'fastify';
import type Anthropic from '@anthropic-ai/sdk';

// Gmail API response types
interface GmailMessage {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  body?: string;
}

interface GmailListResult {
  messages: GmailMessage[];
  total: number;
}

// Tool definitions for Claude
export const GMAIL_TOOLS: Anthropic.Tool[] = [
  {
    name: 'gmail_list_unread',
    description: 'Liste les emails non lus de la boîte Gmail',
    input_schema: {
      type: 'object' as const,
      properties: {
        max_results: { type: 'number' as const, description: 'Nombre max de résultats (défaut 5)' },
      },
      required: [],
    },
  },
  {
    name: 'gmail_read',
    description: 'Lit le contenu complet d\'un email spécifique',
    input_schema: {
      type: 'object' as const,
      properties: {
        message_id: { type: 'string' as const, description: 'ID du message à lire' },
      },
      required: ['message_id'],
    },
  },
  {
    name: 'gmail_send',
    description: 'Envoie un nouvel email. TOUJOURS demander confirmation à l\'utilisateur avant d\'envoyer.',
    input_schema: {
      type: 'object' as const,
      properties: {
        to: { type: 'string' as const, description: 'Adresse email du destinataire' },
        subject: { type: 'string' as const, description: 'Objet de l\'email' },
        body: { type: 'string' as const, description: 'Corps de l\'email' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'gmail_reply',
    description: 'Répond à un email existant. TOUJOURS demander confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        message_id: { type: 'string' as const, description: 'ID du message auquel répondre' },
        body: { type: 'string' as const, description: 'Corps de la réponse' },
      },
      required: ['message_id', 'body'],
    },
  },
];

export class GmailService {
  private logger: FastifyBaseLogger;

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger;
  }

  /**
   * Get OAuth2 token for a user from connected_services.
   */
  private async getToken(_userId: string): Promise<string> {
    // TODO: fetch from Supabase connected_services
    // Decrypt AES-256 credentials
    // Refresh if expired using refresh_token
    throw new Error('Gmail not connected. Connecte Gmail dans les paramètres.');
  }

  /**
   * List unread emails.
   */
  async listUnread(userId: string, maxResults = 5): Promise<GmailListResult> {
    const token = await this.getToken(userId);

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=${maxResults}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status}`);
    }

    const data = await response.json() as { messages?: { id: string }[]; resultSizeEstimate: number };

    if (!data.messages?.length) {
      return { messages: [], total: 0 };
    }

    // Fetch details for each message
    const messages: GmailMessage[] = await Promise.all(
      data.messages.map(async (msg: { id: string }) => this.getMessage(userId, msg.id)),
    );

    return { messages, total: data.resultSizeEstimate };
  }

  /**
   * Get a single message by ID.
   */
  async getMessage(userId: string, messageId: string): Promise<GmailMessage> {
    const token = await this.getToken(userId);

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status}`);
    }

    const data = await response.json() as {
      id: string;
      snippet: string;
      payload: { headers: { name: string; value: string }[] };
    };

    const headers = data.payload.headers;
    const getHeader = (name: string) => headers.find((h) => h.name === name)?.value ?? '';

    return {
      id: data.id,
      from: getHeader('From'),
      subject: getHeader('Subject'),
      date: getHeader('Date'),
      snippet: data.snippet,
    };
  }

  /**
   * Send an email.
   */
  async sendEmail(userId: string, to: string, subject: string, body: string): Promise<{ id: string }> {
    const token = await this.getToken(userId);

    const raw = this.createRawEmail(to, subject, body);

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gmail send error: ${response.status}`);
    }

    const result = await response.json() as { id: string };
    this.logger.info({ msg: 'Email sent', to, subject, messageId: result.id });
    return result;
  }

  /**
   * Reply to an email.
   */
  async replyEmail(userId: string, messageId: string, body: string): Promise<{ id: string }> {
    const original = await this.getMessage(userId, messageId);
    return this.sendEmail(userId, original.from, `Re: ${original.subject}`, body);
  }

  /**
   * Create raw RFC 2822 email for Gmail API.
   */
  private createRawEmail(to: string, subject: string, body: string): string {
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].join('\r\n');

    return Buffer.from(email).toString('base64url');
  }

  /**
   * Execute a tool call from Claude.
   */
  async executeTool(
    userId: string,
    toolName: string,
    input: Record<string, unknown>,
  ): Promise<string> {
    try {
      switch (toolName) {
        case 'gmail_list_unread': {
          const result = await this.listUnread(userId, (input.max_results as number) ?? 5);
          if (result.messages.length === 0) {
            return 'Aucun email non lu.';
          }
          return result.messages
            .map((m, i) => `${i + 1}. De: ${m.from} — ${m.subject} (${m.snippet.slice(0, 80)}...)`)
            .join('\n');
        }
        case 'gmail_read': {
          const msg = await this.getMessage(userId, input.message_id as string);
          return `De: ${msg.from}\nSujet: ${msg.subject}\nDate: ${msg.date}\n\n${msg.snippet}`;
        }
        case 'gmail_send': {
          const sent = await this.sendEmail(
            userId,
            input.to as string,
            input.subject as string,
            input.body as string,
          );
          return `Email envoyé avec succès (ID: ${sent.id})`;
        }
        case 'gmail_reply': {
          const replied = await this.replyEmail(userId, input.message_id as string, input.body as string);
          return `Réponse envoyée (ID: ${replied.id})`;
        }
        default:
          return `Outil inconnu: ${toolName}`;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      return `Erreur Gmail: ${message}`;
    }
  }
}
