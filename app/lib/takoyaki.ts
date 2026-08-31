export type GameMode = "control" | "mischief";
export type CueEffect = "turn" | "add" | "serve";
export type ActionKind =
  | "batter"
  | "octopus"
  | "tenkasu"
  | "greenOnion"
  | "turn"
  | "serve"
  | "mischiefSpin"
  | "mischiefTenkasu"
  | "mischiefRush"
  | "add";
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
  gameMode?: GameMode;
  action?: ActionKind;
  paused?: boolean;
}

export interface HolePosition { id: number; x: number; y: number }
export type HoleOffsets = Record<number, { x: number; y: number }>;

export const HOLES: HolePosition[] = [
  { id: 1, x: 20, y: 14 }, { id: 2, x: 40, y: 14 }, { id: 3, x: 60, y: 14 }, { id: 4, x: 80, y: 14 },
  { id: 5, x: 20, y: 32 }, { id: 6, x: 40, y: 32 }, { id: 7, x: 60, y: 32 }, { id: 8, x: 80, y: 32 },
  { id: 9, x: 20, y: 50 }, { id: 10, x: 40, y: 50 }, { id: 11, x: 60, y: 50 }, { id: 12, x: 80, y: 50 },
  { id: 13, x: 20, y: 68 }, { id: 14, x: 40, y: 68 }, { id: 15, x: 60, y: 68 }, { id: 16, x: 80, y: 68 },
  { id: 17, x: 20, y: 86 }, { id: 18, x: 40, y: 86 }, { id: 19, x: 60, y: 86 }, { id: 20, x: 80, y: 86 },
];

export const ACTIONS: Record<ActionKind, { label: string; short: string; instruction: string; glyph: string; effect: CueEffect }> = {
  batter: { label: "生地を入れる", short: "KIJI", instruction: "指定の穴へ生地を注ぐ", glyph: "生", effect: "add" },
  octopus: { label: "たこを入れる", short: "TAKO", instruction: "指定の穴へたこを一つ入れる", glyph: "蛸", effect: "add" },
  tenkasu: { label: "天かすを入れる", short: "TEN", instruction: "指定の穴へ天かすを入れる", glyph: "天", effect: "add" },
  greenOnion: { label: "ねぎを入れる", short: "NEGI", instruction: "指定の穴へねぎを散らす", glyph: "葱", effect: "add" },
  turn: { label: "くるっと回す", short: "TURN", instruction: "指定のたこ焼きを回す", glyph: "回", effect: "turn" },
  mischiefSpin: { label: "もっと回して！", short: "SPIN", instruction: "遊びの合図：指定のたこ焼きをいつもより回す", glyph: "廻", effect: "turn" },
  mischiefTenkasu: { label: "追い天かす！", short: "EXTRA", instruction: "遊びの合図：指定の穴へ天かすを少し追加する", glyph: "追", effect: "add" },
  mischiefRush: { label: "焼けたふり！", short: "RUSH", instruction: "遊びの合図：焼けたふりをして職人を急かす", glyph: "急", effect: "serve" },
  add: { label: "具を足す", short: "ADD", instruction: "指定の穴へ具を足す", glyph: "足", effect: "add" },
  serve: { label: "焼き上げる", short: "SERVE", instruction: "指定のたこ焼きを取り出す", glyph: "上", effect: "serve" },
};
export const CONTROL_ACTIONS: ActionKind[] = ["batter", "octopus", "tenkasu", "greenOnion", "turn", "serve"];
export const MISCHIEF_ACTIONS: ActionKind[] = ["mischiefSpin", "mischiefTenkasu", "mischiefRush"];
export const HOLE_OFFSETS_KEY = "tako-hole-offsets-v1";

export function parseHoleOffsets(value: string | null): HoleOffsets {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as HoleOffsets;
    return Object.fromEntries(Object.entries(parsed).filter(([, offset]) => Number.isFinite(offset?.x) && Number.isFinite(offset?.y))) as HoleOffsets;
  } catch {
    return {};
  }
}

export const DEFAULT_ROOM = "tako-01";

export function createMessage(kind: MessageKind, role: Role, room: string, extra: Partial<SignalMessage> = {}): SignalMessage {
  return { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`, kind, role, room, timestamp: Date.now(), ...extra };
}

export function sanitizeRoom(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32) || DEFAULT_ROOM;
}
