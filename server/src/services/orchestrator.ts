/**
 * EL-009 — Request Orchestrator
 *
 * Coordinates the full voice pipeline:
 * Audio in → STT → Claude → (Actions) → TTS → Audio out
 *
 * Manages request lifecycle, state machine, timeouts, and cancellation.
 */

import { randomUUID } from 'node:crypto';
import type { FastifyBaseLogger } from 'fastify';
import type { WebSocket } from 'ws';
import { LLMService } from './llm.js';

// Request states
export enum RequestState {
  RECEIVING_AUDIO = 'receiving_audio',
  TRANSCRIBING = 'transcribing',
  THINKING = 'thinking',
  EXECUTING_ACTION = 'executing_action',
  SYNTHESIZING = 'synthesizing',
  STREAMING_AUDIO = 'streaming_audio',
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled',
}

// WebSocket message types (client → server)
interface AudioChunkMessage {
  type: 'audio_chunk';
  data: string; // base64 audio
}

interface AudioEndMessage {
  type: 'audio_end';
}

interface TextMessage {
  type: 'text_message';
  text: string;
}

interface CancelMessage {
  type: 'cancel';
}

type ClientMessage = AudioChunkMessage | AudioEndMessage | TextMessage | CancelMessage;

// WebSocket message types (server → client)
interface StateChangeEvent {
  type: 'state_change';
  state: RequestState;
  requestId: string;
}

interface TranscriptEvent {
  type: 'transcript';
  text: string;
  requestId: string;
}

interface TextResponseEvent {
  type: 'text_response';
  text: string;
  requestId: string;
  isPartial: boolean;
}

interface AudioChunkEvent {
  type: 'audio_chunk';
  data: string; // base64
  chunkIndex: number;
  isLast: boolean;
  requestId: string;
}

interface ErrorEvent {
  type: 'error';
  message: string;
  requestId: string;
}

type ServerEvent =
  | StateChangeEvent
  | TranscriptEvent
  | TextResponseEvent
  | AudioChunkEvent
  | ErrorEvent;

// STT/TTS interfaces (Redis-based workers)
interface STTResult {
  text: string;
  language: string;
  duration_ms: number;
}

interface TTSResult {
  audio_base64: string;
  duration_ms: number;
}

// Redis client interface
interface RedisClient {
  lpush(key: string, value: string): Promise<number>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
}

interface OrchestratorConfig {
  globalTimeoutMs: number;
  maxConcurrentPerUser: number;
  sttQueueName: string;
  sttResultPrefix: string;
  ttsQueueName: string;
  ttsResultPrefix: string;
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  globalTimeoutMs: 15_000,
  maxConcurrentPerUser: 1,
  sttQueueName: 'stt:jobs',
  sttResultPrefix: 'stt:result:',
  ttsQueueName: 'tts:jobs',
  ttsResultPrefix: 'tts:result:',
};

interface ActiveRequest {
  id: string;
  userId: string;
  state: RequestState;
  audioChunks: string[];
  startTime: number;
  timeoutHandle?: ReturnType<typeof setTimeout>;
  cancelled: boolean;
}

export class Orchestrator {
  private logger: FastifyBaseLogger;
  private llm: LLMService;
  private redis: RedisClient | null;
  private config: OrchestratorConfig;
  private activeRequests: Map<string, ActiveRequest> = new Map();
  private userActiveRequest: Map<string, string> = new Map(); // userId → requestId

  constructor(
    logger: FastifyBaseLogger,
    redis: RedisClient | null = null,
    config: Partial<OrchestratorConfig> = {},
  ) {
    this.logger = logger;
    this.llm = new LLMService(logger);
    this.redis = redis;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Handle a new WebSocket connection.
   */
  handleConnection(socket: WebSocket, userId: string): void {
    this.logger.info({ msg: 'Client connected to orchestrator', userId });

    socket.on('message', (raw: Buffer) => {
      try {
        const message = JSON.parse(raw.toString()) as ClientMessage;
        this.handleClientMessage(socket, userId, message);
      } catch {
        this.sendEvent(socket, {
          type: 'error',
          message: 'Invalid message format',
          requestId: 'unknown',
        });
      }
    });

    socket.on('close', () => {
      this.logger.info({ msg: 'Client disconnected', userId });
      this.cancelUserRequest(userId);
    });

    // Welcome
    this.sendEvent(socket, {
      type: 'state_change',
      state: RequestState.COMPLETED,
      requestId: 'init',
    });
  }

  private handleClientMessage(
    socket: WebSocket,
    userId: string,
    message: ClientMessage,
  ): void {
    switch (message.type) {
      case 'audio_chunk':
        this.handleAudioChunk(socket, userId, message.data);
        break;
      case 'audio_end':
        this.handleAudioEnd(socket, userId);
        break;
      case 'text_message':
        this.handleTextMessage(socket, userId, message.text);
        break;
      case 'cancel':
        this.cancelUserRequest(userId);
        break;
    }
  }

  private handleAudioChunk(
    socket: WebSocket,
    userId: string,
    audioData: string,
  ): void {
    let request = this.getOrCreateRequest(socket, userId);

    if (request.state !== RequestState.RECEIVING_AUDIO) {
      // New request — cancel the old one
      this.cancelRequest(request.id);
      request = this.createRequest(socket, userId);
    }

    request.audioChunks.push(audioData);
  }

  private async handleAudioEnd(
    socket: WebSocket,
    userId: string,
  ): Promise<void> {
    const request = this.activeRequests.get(
      this.userActiveRequest.get(userId) ?? '',
    );
    if (!request || request.audioChunks.length === 0) return;

    // Concat audio and process
    const fullAudio = request.audioChunks.join('');
    await this.processVoiceRequest(socket, request, fullAudio);
  }

  private async handleTextMessage(
    socket: WebSocket,
    userId: string,
    text: string,
  ): Promise<void> {
    // Cancel any existing request
    this.cancelUserRequest(userId);

    const request = this.createRequest(socket, userId);
    await this.processTextRequest(socket, request, text);
  }

  /**
   * Process a voice request: STT → LLM → TTS
   */
  private async processVoiceRequest(
    socket: WebSocket,
    request: ActiveRequest,
    audioBase64: string,
  ): Promise<void> {
    try {
      // 1. STT
      this.setState(socket, request, RequestState.TRANSCRIBING);
      const transcript = await this.transcribe(request.id, audioBase64);

      if (request.cancelled) return;

      this.sendEvent(socket, {
        type: 'transcript',
        text: transcript.text,
        requestId: request.id,
      });

      if (!transcript.text.trim()) {
        this.setState(socket, request, RequestState.COMPLETED);
        return;
      }

      // 2. LLM → TTS
      await this.processTextRequest(socket, request, transcript.text);
    } catch (error) {
      this.handleError(socket, request, error);
    }
  }

  /**
   * Process a text request: LLM → TTS
   */
  private async processTextRequest(
    socket: WebSocket,
    request: ActiveRequest,
    text: string,
  ): Promise<void> {
    try {
      // 1. LLM
      this.setState(socket, request, RequestState.THINKING);

      const llmResult = await this.llm.chat({
        userId: request.userId,
        message: text,
        history: [], // TODO: load from Supabase
        memories: [], // TODO: RAG from pgvector
      });

      if (request.cancelled) return;

      this.sendEvent(socket, {
        type: 'text_response',
        text: llmResult.text,
        requestId: request.id,
        isPartial: false,
      });

      // 2. TTS
      if (llmResult.text.trim()) {
        this.setState(socket, request, RequestState.SYNTHESIZING);
        const ttsResult = await this.synthesize(request.id, llmResult.text);

        if (request.cancelled) return;

        this.setState(socket, request, RequestState.STREAMING_AUDIO);
        this.sendEvent(socket, {
          type: 'audio_chunk',
          data: ttsResult.audio_base64,
          chunkIndex: 0,
          isLast: true,
          requestId: request.id,
        });
      }

      this.setState(socket, request, RequestState.COMPLETED);
      this.cleanupRequest(request.id);
    } catch (error) {
      this.handleError(socket, request, error);
    }
  }

  /**
   * Send audio to STT worker via Redis.
   */
  private async transcribe(jobId: string, audioBase64: string): Promise<STTResult> {
    if (!this.redis) {
      // Fallback: return mock for development
      this.logger.warn('No Redis — returning mock STT result');
      return { text: '[mock transcription]', language: 'fr', duration_ms: 0 };
    }

    const job = JSON.stringify({ job_id: jobId, audio_base64: audioBase64 });
    await this.redis.lpush(this.config.sttQueueName, job);

    // Poll for result
    return this.pollResult<STTResult>(
      `${this.config.sttResultPrefix}${jobId}`,
      10_000,
    );
  }

  /**
   * Send text to TTS worker via Redis.
   */
  private async synthesize(jobId: string, text: string): Promise<TTSResult> {
    if (!this.redis) {
      this.logger.warn('No Redis — returning mock TTS result');
      return { audio_base64: '', duration_ms: 0 };
    }

    const job = JSON.stringify({ job_id: jobId, text, streaming: false });
    await this.redis.lpush(this.config.ttsQueueName, job);

    return this.pollResult<TTSResult>(
      `${this.config.ttsResultPrefix}${jobId}`,
      10_000,
    );
  }

  /**
   * Poll Redis for a result with timeout.
   */
  private async pollResult<T>(key: string, timeoutMs: number): Promise<T> {
    const start = Date.now();
    const pollInterval = 50;

    while (Date.now() - start < timeoutMs) {
      const result = await this.redis!.get(key);
      if (result) {
        await this.redis!.del(key);
        const parsed = JSON.parse(result) as T & { status?: string; error?: string };
        if (parsed.status === 'error') {
          throw new Error(parsed.error ?? 'Worker error');
        }
        return parsed;
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Timeout waiting for result: ${key}`);
  }

  // --- State management ---

  private createRequest(socket: WebSocket, userId: string): ActiveRequest {
    const request: ActiveRequest = {
      id: randomUUID(),
      userId,
      state: RequestState.RECEIVING_AUDIO,
      audioChunks: [],
      startTime: Date.now(),
      cancelled: false,
    };

    // Global timeout
    request.timeoutHandle = setTimeout(() => {
      this.handleError(socket, request, new Error('Request timeout'));
    }, this.config.globalTimeoutMs);

    this.activeRequests.set(request.id, request);
    this.userActiveRequest.set(userId, request.id);

    this.sendEvent(socket, {
      type: 'state_change',
      state: RequestState.RECEIVING_AUDIO,
      requestId: request.id,
    });

    return request;
  }

  private getOrCreateRequest(socket: WebSocket, userId: string): ActiveRequest {
    const existingId = this.userActiveRequest.get(userId);
    if (existingId) {
      const existing = this.activeRequests.get(existingId);
      if (existing && !existing.cancelled) return existing;
    }
    return this.createRequest(socket, userId);
  }

  private setState(
    socket: WebSocket,
    request: ActiveRequest,
    state: RequestState,
  ): void {
    request.state = state;
    this.sendEvent(socket, {
      type: 'state_change',
      state,
      requestId: request.id,
    });

    this.logger.info({
      msg: 'State change',
      requestId: request.id,
      state,
      elapsed: Date.now() - request.startTime,
    });
  }

  private cancelUserRequest(userId: string): void {
    const requestId = this.userActiveRequest.get(userId);
    if (requestId) this.cancelRequest(requestId);
  }

  private cancelRequest(requestId: string): void {
    const request = this.activeRequests.get(requestId);
    if (request) {
      request.cancelled = true;
      this.cleanupRequest(requestId);
    }
  }

  private cleanupRequest(requestId: string): void {
    const request = this.activeRequests.get(requestId);
    if (request?.timeoutHandle) {
      clearTimeout(request.timeoutHandle);
    }
    this.activeRequests.delete(requestId);
    if (request) {
      this.userActiveRequest.delete(request.userId);
    }
  }

  private handleError(
    socket: WebSocket,
    request: ActiveRequest,
    error: unknown,
  ): void {
    const message = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error({ msg: 'Pipeline error', requestId: request.id, error: message });

    request.state = RequestState.ERROR;
    this.sendEvent(socket, {
      type: 'error',
      message: 'Désolé, une erreur est survenue. Réessaie.',
      requestId: request.id,
    });

    this.cleanupRequest(request.id);
  }

  private sendEvent(socket: WebSocket, event: ServerEvent): void {
    if (socket.readyState === 1) { // WebSocket.OPEN
      socket.send(JSON.stringify(event));
    }
  }
}
