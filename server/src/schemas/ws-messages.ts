/**
 * Zod schemas for WebSocket message validation
 * 
 * All inbound (client → server) messages are validated before processing.
 */

import { z } from 'zod';

// =============================================================================
// Inbound Messages (Client → Server)
// =============================================================================

export const AudioChunkMessageSchema = z.object({
  type: z.literal('audio_chunk'),
  data: z.string(), // base64 audio chunk
});

export const AudioEndMessageSchema = z.object({
  type: z.literal('audio_end'),
});

export const TextMessageSchema = z.object({
  type: z.literal('text_message'),
  text: z.string().min(1).max(10000),
});

export const CancelMessageSchema = z.object({
  type: z.literal('cancel'),
});

export const InterruptMessageSchema = z.object({
  type: z.literal('interrupt'),
});

export const StartListeningMessageSchema = z.object({
  type: z.literal('start_listening'),
});

export const StopListeningMessageSchema = z.object({
  type: z.literal('stop_listening'),
});

export const AudioMessageSchema = z.object({
  type: z.literal('audio_message'),
  audio: z.string(), // base64 full audio
  format: z.string(),
});

export const PingMessageSchema = z.object({
  type: z.literal('ping'),
});

export const KeywordCheckMessageSchema = z.object({
  type: z.literal('keyword_check'),
  audio: z.string(), // base64 audio
  format: z.string(),
});

export const MemoryContextMessageSchema = z.object({
  type: z.literal('memory_context'),
  memory: z.string().max(8000), // formatted memory string from client
});

// Union of all inbound messages
export const InboundMessageSchema = z.discriminatedUnion('type', [
  AudioChunkMessageSchema,
  AudioEndMessageSchema,
  TextMessageSchema,
  CancelMessageSchema,
  InterruptMessageSchema,
  StartListeningMessageSchema,
  StopListeningMessageSchema,
  AudioMessageSchema,
  PingMessageSchema,
  KeywordCheckMessageSchema,
  MemoryContextMessageSchema,
]);

// Type exports
export type AudioChunkMessage = z.infer<typeof AudioChunkMessageSchema>;
export type AudioEndMessage = z.infer<typeof AudioEndMessageSchema>;
export type TextMessage = z.infer<typeof TextMessageSchema>;
export type CancelMessage = z.infer<typeof CancelMessageSchema>;
export type InterruptMessage = z.infer<typeof InterruptMessageSchema>;
export type StartListeningMessage = z.infer<typeof StartListeningMessageSchema>;
export type StopListeningMessage = z.infer<typeof StopListeningMessageSchema>;
export type AudioMessage = z.infer<typeof AudioMessageSchema>;
export type PingMessage = z.infer<typeof PingMessageSchema>;
export type KeywordCheckMessage = z.infer<typeof KeywordCheckMessageSchema>;
export type MemoryContextMessage = z.infer<typeof MemoryContextMessageSchema>;
export type InboundMessage = z.infer<typeof InboundMessageSchema>;
