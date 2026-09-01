"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SignalMessage } from "../lib/takoyaki";

type ConnectionState = "connecting" | "online" | "local";

export function useSignalChannel(room: string, onMessage: (message: SignalMessage) => void) {
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const channelRef = useRef<BroadcastChannel | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const callbackRef = useRef(onMessage);
  const seenRef = useRef(new Set<string>());
  const pendingRef = useRef<SignalMessage[]>([]);

  useEffect(() => { callbackRef.current = onMessage; }, [onMessage]);

  useEffect(() => {
    let disposed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    pendingRef.current = [];
    const channel = new BroadcastChannel(`tako-signal-${room}`);
    channelRef.current = channel;

    const deliver = (message: SignalMessage) => {
      if (!message?.id || message.room !== room || seenRef.current.has(message.id)) return;
      seenRef.current.add(message.id);
      if (seenRef.current.size > 300) seenRef.current.clear();
      callbackRef.current(message);
    };

    channel.onmessage = event => deliver(event.data as SignalMessage);

    const connect = () => {
      if (disposed) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(`${protocol}//${window.location.host}/api/ws?room=${encodeURIComponent(room)}`);
      socketRef.current = socket;
      socket.onopen = () => {
        setConnection("online");
        const pending = pendingRef.current.splice(0);
        for (const message of pending) socket.send(JSON.stringify(message));
      };
      socket.onmessage = event => { try { deliver(JSON.parse(event.data) as SignalMessage); } catch { /* malformed relay traffic */ } };
      socket.onerror = () => socket.close();
      socket.onclose = () => {
        if (!disposed) { setConnection("local"); reconnectTimer = setTimeout(connect, 250); }
      };
    };

    connect();
    const localFallback = setTimeout(() => setConnection(current => current === "connecting" ? "local" : current), 1800);
    return () => {
      disposed = true;
      clearTimeout(localFallback);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      channel.close();
      socketRef.current?.close();
    };
  }, [room]);

  const send = useCallback((message: SignalMessage) => {
    seenRef.current.add(message.id);
    channelRef.current?.postMessage(message);
    const transmit = () => {
      const socket = socketRef.current;
      if (socket?.readyState === WebSocket.OPEN) {
        try { socket.send(JSON.stringify(message)); return; } catch { /* retry below */ }
      }
      if (!pendingRef.current.some(item => item.id === message.id)) {
        pendingRef.current = [...pendingRef.current.slice(-7), message];
      }
    };
    transmit();
    window.setTimeout(transmit, 90);
    window.setTimeout(transmit, 280);
  }, []);

  return { connection, send };
}
