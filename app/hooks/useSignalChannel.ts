"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SignalMessage } from "../lib/takoyaki";

type ConnectionState = "connecting" | "online" | "local";

export const SIGNAL_RELAY_URL_KEY = "tako-signal-relay-url";

function resolveRelayUrl(room: string): string | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const queryOverride = params.get("signalRelay")?.trim();
  const stored = localStorage.getItem(SIGNAL_RELAY_URL_KEY)?.trim();
  const buildTime = import.meta.env.VITE_SIGNAL_RELAY_URL?.trim();

  let raw = queryOverride || stored || buildTime || "";
  if (!raw && (window.location.hostname === "localhost" || window.location.hostname.endsWith(".chatgpt.site"))) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    raw = `${protocol}//${window.location.host}/api/ws`;
  }
  if (!raw) return null;

  try {
    const url = new URL(raw, window.location.origin);
    if (url.protocol === "https:") url.protocol = "wss:";
    if (url.protocol === "http:") url.protocol = "ws:";
    if (url.protocol !== "ws:" && url.protocol !== "wss:") return null;
    if (!url.pathname || url.pathname === "/") url.pathname = "/ws";
    url.searchParams.set("room", room);
    return url.toString();
  } catch {
    return null;
  }
}

export function useSignalChannel(room: string, onMessage: (message: SignalMessage) => void) {
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const callbackRef = useRef(onMessage);
  const seenRef = useRef(new Set<string>());
  const pendingRef = useRef<SignalMessage[]>([]);
  const dataFrameRef = useRef<HTMLIFrameElement | null>(null);
  const latestRef = useRef<SignalMessage | null>(null);
  const peerIdRef = useRef(`tako-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => { callbackRef.current = onMessage; }, [onMessage]);

  useEffect(() => {
    let disposed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let presenceTimer: ReturnType<typeof setInterval> | undefined;
    let localFallback: ReturnType<typeof setTimeout> | undefined;
    pendingRef.current = [];
    setConnection("connecting");

    const channel = new BroadcastChannel(`tako-signal-${room}`);
    channelRef.current = channel;

    const deliver = (message: SignalMessage) => {
      if (!message?.id || message.room !== room || seenRef.current.has(message.id)) return;
      seenRef.current.add(message.id);
      if (seenRef.current.size > 300) seenRef.current.clear();
      callbackRef.current(message);
    };

    channel.onmessage = event => deliver(event.data as SignalMessage);

    const relayUrl = resolveRelayUrl(room);

    if (relayUrl) {
      const connect = () => {
        if (disposed) return;
        const socket = new WebSocket(relayUrl);
        socketRef.current = socket;
        socket.onopen = () => {
          if (disposed) return;
          setConnection("online");
          const pending = pendingRef.current.splice(0);
          for (const message of pending) {
            try { socket.send(JSON.stringify(message)); } catch { /* reconnect will retry */ }
          }
        };
        socket.onmessage = event => {
          try { deliver(JSON.parse(String(event.data)) as SignalMessage); } catch { /* malformed relay traffic */ }
        };
        socket.onerror = () => socket.close();
        socket.onclose = () => {
          if (!disposed) {
            setConnection("local");
            reconnectTimer = setTimeout(connect, 1000);
          }
        };
      };
      connect();
    } else {
      // Legacy fallback for deployments that have not configured the WebSocket relay yet.
      // Once SIGNAL_RELAY_URL_KEY / VITE_SIGNAL_RELAY_URL is set, VDO.Ninja is video-only.
      const dataFrame = document.createElement("iframe");
      dataFrame.title = "TAKO SIGNAL legacy P2P relay";
      dataFrame.tabIndex = -1;
      dataFrame.setAttribute("aria-hidden", "true");
      dataFrame.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-10px;bottom:0;border:0";
      dataFrame.src = "https://vdo.ninja/?room=tako-signal-" + encodeURIComponent(room) + "&cleanish&dataonly&label=tako-signal";
      document.body.appendChild(dataFrame);
      dataFrameRef.current = dataFrame;

      const postVdoData = (data: Record<string, unknown>) => {
        dataFrame.contentWindow?.postMessage({ sendData: data }, "https://vdo.ninja");
      };
      const sendViaVdo = (message: SignalMessage) => postVdoData({ takoSignal: message });
      const sendPresence = (type: "ping" | "pong") => {
        postVdoData({ takoSignalPresence: { type, peerId: peerIdRef.current, room } });
      };
      const onVdoMessage = (event: MessageEvent) => {
        if (event.origin !== "https://vdo.ninja" || event.source !== dataFrame.contentWindow) return;
        const payload = event.data?.dataReceived?.takoSignal as SignalMessage | undefined;
        if (payload) { setConnection("online"); deliver(payload); }
        const presence = event.data?.dataReceived?.takoSignalPresence as { type?: string; peerId?: string; room?: string } | undefined;
        if (presence?.room === room && presence.peerId && presence.peerId !== peerIdRef.current) {
          setConnection("online");
          if (presence.type === "ping") sendPresence("pong");
        }
        if (event.data?.action === "guest-connected") {
          setConnection("online");
          sendPresence("ping");
          if (latestRef.current?.room === room) sendViaVdo(latestRef.current);
        }
      };
      window.addEventListener("message", onVdoMessage);
      dataFrame.addEventListener("load", () => sendPresence("ping"));
      presenceTimer = setInterval(() => sendPresence("ping"), 3000);
      localFallback = setTimeout(() => setConnection(current => current === "connecting" ? "local" : current), 8000);

      return () => {
        disposed = true;
        if (localFallback) clearTimeout(localFallback);
        if (presenceTimer) clearInterval(presenceTimer);
        window.removeEventListener("message", onVdoMessage);
        dataFrame.remove();
        if (dataFrameRef.current === dataFrame) dataFrameRef.current = null;
        channel.close();
        socketRef.current?.close();
      };
    }

    localFallback = setTimeout(() => setConnection(current => current === "connecting" ? "local" : current), 8000);
    return () => {
      disposed = true;
      if (localFallback) clearTimeout(localFallback);
      if (presenceTimer) clearInterval(presenceTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      channel.close();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [room, connectionAttempt]);

  const send = useCallback((message: SignalMessage) => {
    seenRef.current.add(message.id);
    latestRef.current = message;
    channelRef.current?.postMessage(message);

    const transmit = () => {
      const socket = socketRef.current;
      if (socket?.readyState === WebSocket.OPEN) {
        try { socket.send(JSON.stringify(message)); return; } catch { /* queue below */ }
      }

      const dataFrame = dataFrameRef.current;
      if (dataFrame?.contentWindow) {
        dataFrame.contentWindow.postMessage({ sendData: { takoSignal: message } }, "https://vdo.ninja");
        return;
      }

      if (!pendingRef.current.some(item => item.id === message.id)) {
        pendingRef.current = [...pendingRef.current.slice(-7), message];
      }
    };

    transmit();
    window.setTimeout(transmit, 90);
    window.setTimeout(transmit, 280);
    window.setTimeout(transmit, 700);
  }, []);

  const reconnect = useCallback(() => {
    setConnection("connecting");
    setConnectionAttempt(attempt => attempt + 1);
  }, []);

  return { connection, send, reconnect };
}
