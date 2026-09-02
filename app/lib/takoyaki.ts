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
  | "mischiefWait"
  | "mischiefRush"
  | "add";
export type Role = "player" | "kitchen";
export type MessageKind = "request" | "accepted" | "completed" | "skipped" | "cancelled" | "presence" | "paused" | "tetris";
export type TetrisBlock = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export interface TetrisProjectionState {
  cells: Array<TetrisBlock | null>;
  score: number;
  lines: number;
  status: "ready" | "running" | "paused" | "gameover";
}

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
  tetris?: TetrisProjectionState;
}

export interface HolePosition { id: number; x: number; y: number }
export type HoleOffsets = Record<number, { x: number; y: number }>;

export const HOLES: HolePosition[] = [
  { id: 1, x: 14, y: 20 }, { id: 2, x: 32, y: 20 }, { id: 3, x: 50, y: 20 }, { id: 4, x: 68, y: 20 }, { id: 5, x: 86, y: 20 },
  { id: 6, x: 14, y: 40 }, { id: 7, x: 32, y: 40 }, { id: 8, x: 50, y: 40 }, { id: 9, x: 68, y: 40 }, { id: 10, x: 86, y: 40 },
  { id: 11, x: 14, y: 60 }, { id: 12, x: 32, y: 60 }, { id: 13, x: 50, y: 60 }, { id: 14, x: 68, y: 60 }, { id: 15, x: 86, y: 60 },
  { id: 16, x: 14, y: 80 }, { id: 17, x: 32, y: 80 }, { id: 18, x: 50, y: 80 }, { id: 19, x: 68, y: 80 }, { id: 20, x: 86, y: 80 },
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
  mischiefWait: { label: "まだ焼いて！", short: "WAIT", instruction: "意見の合図：もう少し焼いてほしい", glyph: "待", effect: "turn" },
  serve: { label: "焼き上げる", short: "SERVE", instruction: "指定のたこ焼きを取り出す", glyph: "上", effect: "serve" },
};
export const ACTION_ICONS: Record<ActionKind, string> = {
  batter: "/icons/batter.png", octopus: "/icons/octopus.png", tenkasu: "/icons/tenkasu.png", greenOnion: "/icons/green-onion.png", turn: "/icons/turn.png", serve: "/icons/serve.png",
  mischiefSpin: "/icons/turn.png", mischiefTenkasu: "/icons/tenkasu.png", mischiefWait: "/icons/batter.png", mischiefRush: "/icons/serve.png", add: "/icons/octopus.png",
};
export function resolveAssetPath(path: string): string {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/tako-signal") ? `/tako-signal` : path;
}
export const CONTROL_ACTIONS: ActionKind[] = ["batter", "octopus", "tenkasu", "greenOnion", "turn", "serve"];
export const MISCHIEF_ACTIONS: ActionKind[] = ["mischiefSpin", "mischiefTenkasu", "mischiefWait", "mischiefRush"];
export const HOLE_OFFSETS_KEY = "tako-hole-offsets-v2";

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
