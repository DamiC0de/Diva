/**
 * EL-013 — WebSocket hook for real-time communication with API Gateway.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WSMessage {
  type: string;
  [key: string]: unknown;
}

interface UseWebSocketOptions {
  url: string;
  token?: string;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxRetries?: number;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    url,
    token,
    autoReconnect = true,
    reconnectDelay = 2000,
    maxRetries = 5,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);

  const connect = useCallback(() => {
    const wsUrl = token ? `${url}?token=${token}` : url;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setConnectionState('connecting');

    ws.onopen = () => {
      setConnectionState('connected');
      retriesRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as WSMessage;
        setLastMessage(data);
      } catch {
        // Binary audio data — handle separately
      }
    };

    ws.onclose = () => {
      setConnectionState('disconnected');
      wsRef.current = null;

      if (autoReconnect && retriesRef.current < maxRetries) {
        retriesRef.current += 1;
        const delay = reconnectDelay * Math.pow(2, retriesRef.current - 1);
        setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      setConnectionState('error');
    };
  }, [url, token, autoReconnect, reconnectDelay, maxRetries]);

  const send = useCallback((message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendBinary = useCallback((data: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  useEffect(() => {
    // Don't connect until we have a token
    if (!token) return;
    connect();
    return () => disconnect();
  }, [connect, disconnect, token]);

  return {
    connectionState,
    lastMessage,
    send,
    sendBinary,
    disconnect,
    reconnect: connect,
  };
}
