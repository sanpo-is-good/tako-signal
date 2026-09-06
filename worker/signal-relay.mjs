import { DurableObject } from "cloudflare:workers";

const MAX_MESSAGE_BYTES = 32 * 1024;
const ROOM_PATTERN = /^[a-z0-9-]{1,32}$/;

function sanitizeRoom(value) {
  const room = String(value || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32);
  return ROOM_PATTERN.test(room) ? room : "tako-01";
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return jsonResponse({ ok: true, service: "tako-signal-relay" });
    }

    if (url.pathname !== "/ws") {
      return jsonResponse({ error: "not_found" }, 404);
    }

    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return jsonResponse({ error: "websocket_required" }, 426);
    }

    const room = sanitizeRoom(url.searchParams.get("room"));
    const id = env.ROOMS.idFromName(room);
    const stub = env.ROOMS.get(id);
    return stub.fetch(request);
  },
};

export class SignalRoom extends DurableObject {
  async fetch(request) {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return jsonResponse({ error: "websocket_required" }, 426);
    }

    const url = new URL(request.url);
    const room = sanitizeRoom(url.searchParams.get("room"));
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server, [room]);
    server.serializeAttachment({ room, connectedAt: Date.now() });

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(socket, rawMessage) {
    const text = typeof rawMessage === "string" ? rawMessage : new TextDecoder().decode(rawMessage);
    if (new TextEncoder().encode(text).byteLength > MAX_MESSAGE_BYTES) {
      socket.close(1009, "message too large");
      return;
    }

    let message;
    try {
      message = JSON.parse(text);
    } catch {
      return;
    }

    const attachment = socket.deserializeAttachment?.() || {};
    const room = sanitizeRoom(attachment.room);
    if (!message || typeof message.id !== "string" || message.room !== room) return;

    for (const peer of this.ctx.getWebSockets(room)) {
      if (peer === socket || peer.readyState !== WebSocket.OPEN) continue;
      try {
        peer.send(text);
      } catch {
        // A disconnected peer will be removed by the runtime.
      }
    }
  }

  async webSocketClose(socket, code, reason) {
    try {
      socket.close(code, reason);
    } catch {
      // The close handshake may already be complete.
    }
  }

  async webSocketError(socket) {
    try {
      socket.close(1011, "relay error");
    } catch {
      // Ignore sockets that are already gone.
    }
  }
}
