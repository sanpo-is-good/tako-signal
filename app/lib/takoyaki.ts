export type ActionKind = "turn" | "add" | "serve";
export type Role = "player" | "kitchen";
export type MessageKind = "request" | "accepted" | "completed" | "skipped" | "cancelled" | "presence" | "paused";

export interface SignalMessage {
  id: string;
  kind: MessageKind;
  room: string;
  role: Role;
  timestamp: number;
  requestId?: string;
  hole?: number;
  action?: ActionKind;
  paused?: boolean;
}

export interface HolePosition { id: number; x: number; y: number }

export const HOLES: HolePosition[] = [
  { id: 1, x: 23, y: 23 }, { id: 2, x: 41, y: 21 }, { id: 3, x: 59, y: 21 }, { id: 4, x: 77, y: 23 },
  { id: 5, x: 21, y: 41 }, { id: 6, x: 40, y: 40 }, { id: 7, x: 60, y: 40 }, { id: 8, x: 79, y: 41 },
  { id: 9, x: 21, y: 59 }, { id: 10, x: 40, y: 60 }, { id: 11, x: 60, y: 60 }, { id: 12, x: 79, y: 59 },
  { id: 13, x: 23, y: 77 }, { id: 14, x: 41, y: 79 }, { id: 15, x: 59, y: 79 }, { id: 16, x: 77, y: 77 },
];

export const ACTIONS: Record<ActionKind, { label: string; short: string; instruction: string }> = {
  turn: { label: "回す", short: "TURN", instruction: "回転リング：このたこ焼きを回す" },
  add: { label: "足す", short: "ADD", instruction: "波紋：生地や具を足す" },
  serve: { label: "上げる", short: "SERVE", instruction: "拡大リング：焼き上げて取り出す" },
};

export const DEFAULT_ROOM = "tako-01";

export function createMessage(kind: MessageKind, role: Role, room: string, extra: Partial<SignalMessage> = {}): SignalMessage {
  return { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`, kind, role, room, timestamp: Date.now(), ...extra };
}

export function sanitizeRoom(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32) || DEFAULT_ROOM;
}
