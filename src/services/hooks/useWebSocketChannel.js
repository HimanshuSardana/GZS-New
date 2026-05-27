import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const WS_BASE = (() => {
  const api = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return api.replace(/^http/, 'ws');
})();

function getToken() {
  return localStorage.getItem('gzs_access_token') || '';
}

/**
 * useWebSocketChannel
 *
 * Opens a WebSocket to /ws/community/{branch}/{channel} and delivers
 * incoming messages via the `onMessage` callback.
 *
 * Also updates the React Query cache for ['community', 'messages', branch, channel]
 * if a queryClient is available, enabling optimistic sharing between hooks.
 *
 * Returns { sendMessage, readyStateRef }
 *
 * @param {string|null} branch      - community branch slug; falsy disables the hook
 * @param {string|null} channel     - channel slug; falsy disables the hook
 * @param {object}      [options]
 * @param {function}    [options.onMessage] - called with each incoming parsed message
 */
export function useWebSocketChannel(branch, channel, { onMessage } = {}) {
  const queryClient = useQueryClient();
  const wsRef = useRef(null);
  const retryRef = useRef(null);
  const retryCount = useRef(0);
  const readyStateRef = useRef(WebSocket.CLOSED);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!branch || !channel) return;

    const url = `${WS_BASE}/ws/community/${branch}/${channel}?token=${getToken()}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    readyStateRef.current = WebSocket.CONNECTING;

    ws.onopen = () => {
      retryCount.current = 0;
      readyStateRef.current = WebSocket.OPEN;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type !== 'message') return;

        // Notify caller
        onMessageRef.current?.(msg);

        // Also keep React Query cache in sync
        queryClient.setQueryData(
          ['community', 'messages', branch, channel],
          (prev) => {
            const list = Array.isArray(prev) ? prev : [];
            const isDup = list.some(
              (m) => m.timestamp === msg.timestamp && m.sender_id === msg.sender_id,
            );
            return isDup ? list : [...list, msg];
          },
        );
      } catch {
        // Malformed frame — ignore
      }
    };

    ws.onclose = () => {
      readyStateRef.current = WebSocket.CLOSED;
      // Exponential backoff: 1s, 2s, 4s, 8s … capped at 30s
      const delay = Math.min(1000 * 2 ** retryCount.current, 30_000);
      retryCount.current += 1;
      retryRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [branch, channel, queryClient]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback(
    (content, senderId) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ content, sender_id: senderId }));
      }
    },
    [],
  );

  return { sendMessage, readyStateRef };
}

/**
 * useWebSocketDM
 *
 * Opens a WebSocket to /ws/dm/{conversationId} and keeps the
 * React Query cache for ['conversation', conversationId] live.
 */
export function useWebSocketDM(conversationId) {
  const queryClient = useQueryClient();
  const wsRef = useRef(null);
  const retryRef = useRef(null);
  const retryCount = useRef(0);

  const connect = useCallback(() => {
    if (!conversationId) return;

    const url = `${WS_BASE}/ws/dm/${conversationId}?token=${getToken()}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryCount.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type !== 'dm') return;

        queryClient.setQueryData(
          ['conversation', conversationId],
          (prev) => {
            const list = Array.isArray(prev) ? prev : [];
            const isDup = list.some(
              (m) => m.timestamp === msg.timestamp && m.sender_id === msg.sender_id,
            );
            return isDup ? list : [...list, msg];
          },
        );
      } catch {
        // Malformed frame — ignore
      }
    };

    ws.onclose = () => {
      const delay = Math.min(1000 * 2 ** retryCount.current, 30_000);
      retryCount.current += 1;
      retryRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, [conversationId, queryClient]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback(
    (content, senderId) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ content, sender_id: senderId }));
      }
    },
    [],
  );

  return { sendMessage };
}
