/** Cloudflare Worker entry point for TAKO SIGNAL. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

type WorkerSocket = WebSocket & { accept(): void };
type WebSocketPairConstructor = new () => { 0: WebSocket; 1: WorkerSocket };
const relayRooms = new Map<string, Set<WorkerSocket>>();

function relayConnection(request: Request, room: string): Response {
  const Pair = (globalThis as unknown as { WebSocketPair: WebSocketPairConstructor }).WebSocketPair;
  const pair = new Pair();
  const client = pair[0];
  const server = pair[1];
  const sockets = relayRooms.get(room) || new Set<WorkerSocket>();
  sockets.add(server);
  relayRooms.set(room, sockets);
  server.accept();

  const remove = () => {
    sockets.delete(server);
    if (sockets.size === 0) relayRooms.delete(room);
  };

  server.addEventListener("message", event => {
    if (typeof event.data !== "string" || event.data.length > 4096) return;
    try {
      const message = JSON.parse(event.data) as { room?: string };
      if (message.room !== room) return;
      for (const socket of sockets) {
        if (socket !== server && socket.readyState === WebSocket.OPEN) socket.send(event.data);
      }
    } catch {
      server.close(1003, "Invalid message");
    }
  });
  server.addEventListener("close", remove);
  server.addEventListener("error", remove);

  return new Response(null, { status: 101, webSocket: client } as ResponseInit & { webSocket: WebSocket });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/ws") {
      const room = (url.searchParams.get("room") || "").toLowerCase();
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
        return new Response("WebSocket upgrade required", { status: 426 });
      }
      if (!/^[a-z0-9-]{1,32}$/.test(room)) {
        return new Response("Invalid room", { status: 400 });
      }
      return relayConnection(request, room);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
