"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ConnectionPill } from "../components/ConnectionPill";
import { useSignalChannel } from "../hooks/useSignalChannel";
import { DEFAULT_ROOM, createMessage, sanitizeRoom } from "../lib/takoyaki";
import { TETRIS_COLS as COLS, TETRIS_ROWS as ROWS } from "../lib/tetris";

const LIVE_LOCK_KEY = "tako-live-lock";
const KINDS = ["I", "O", "T", "S", "Z", "J", "L"] as const;
type PieceKind = (typeof KINDS)[number];
type Cell = PieceKind | null;
type Board = Cell[][];
type Status = "ready" | "running" | "paused" | "gameover";
type Point = readonly [number, number];

interface Piece {
  kind: PieceKind;
  rotation: number;
  x: number;
  y: number;
}

interface GameState {
  board: Board;
  active: Piece;
  next: PieceKind;
  score: number;
  lines: number;
  status: Status;
}

const BASE_CELLS: Record<PieceKind, Point[]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

const EMPTY_BOARD = () => Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
const randomKind = () => KINDS[Math.floor(Math.random() * KINDS.length)];
const spawn = (kind: PieceKind): Piece => ({ kind, rotation: 0, x: Math.max(0, Math.floor((COLS - 4) / 2)), y: 0 });

function pieceCells(piece: Piece): Point[] {
  if (piece.kind === "O") return BASE_CELLS.O;
  let points = BASE_CELLS[piece.kind].map(([x, y]) => [x, y] as Point);
  for (let turn = 0; turn < piece.rotation % 4; turn += 1) {
    points = points.map(([x, y]) => [3 - y, x] as Point);
  }
  return points;
}

function collides(board: Board, piece: Piece) {
  return pieceCells(piece).some(([dx, dy]) => {
    const x = piece.x + dx;
    const y = piece.y + dy;
    return x < 0 || x >= COLS || y >= ROWS || (y >= 0 && Boolean(board[y][x]));
  });
}

function newGame(status: Status = "ready"): GameState {
  const first = randomKind();
  return { board: EMPTY_BOARD(), active: spawn(first), next: randomKind(), score: 0, lines: 0, status };
}

function lockPiece(state: GameState): GameState {
  const merged = state.board.map(row => [...row]);
  pieceCells(state.active).forEach(([dx, dy]) => {
    const x = state.active.x + dx;
    const y = state.active.y + dy;
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) merged[y][x] = state.active.kind;
  });

  const remaining = merged.filter(row => row.some(cell => cell === null));
  const cleared = ROWS - remaining.length;
  const board = [
    ...Array.from({ length: cleared }, () => Array<Cell>(COLS).fill(null)),
    ...remaining,
  ];
  const active = spawn(state.next);
  const gameover = collides(board, active);

  return {
    board,
    active,
    next: randomKind(),
    score: state.score + (cleared ? [0, 100, 300, 500, 800][cleared] : 0),
    lines: state.lines + cleared,
    status: gameover ? "gameover" : state.status,
  };
}

function stepDown(state: GameState): GameState {
  if (state.status !== "running") return state;
  const moved = { ...state.active, y: state.active.y + 1 };
  return collides(state.board, moved) ? lockPiece(state) : { ...state, active: moved };
}

function moveSide(state: GameState, direction: -1 | 1): GameState {
  if (state.status !== "running") return state;
  const moved = { ...state.active, x: state.active.x + direction };
  return collides(state.board, moved) ? state : { ...state, active: moved };
}

function rotatePiece(state: GameState): GameState {
  if (state.status !== "running") return state;
  const rotated = { ...state.active, rotation: (state.active.rotation + 1) % 4 };
  for (const offset of [0, -1, 1, -2, 2]) {
    const kicked = { ...rotated, x: rotated.x + offset };
    if (!collides(state.board, kicked)) return { ...state, active: kicked };
  }
  return state;
}

function hardDrop(state: GameState): GameState {
  if (state.status !== "running") return state;
  let active = state.active;
  let distance = 0;
  while (!collides(state.board, { ...active, y: active.y + 1 })) {
    active = { ...active, y: active.y + 1 };
    distance += 1;
  }
  return lockPiece({ ...state, active, score: state.score + distance * 2 });
}

function PiecePreview({ kind }: { kind?: PieceKind }) {
  const occupied = new Set(kind ? pieceCells({ kind, rotation: 0, x: 0, y: 0 }).map(([x, y]) => `${x}-${y}`) : []);
  return (
    <div className="arcade-piece-preview" aria-hidden="true">
      {Array.from({ length: 16 }, (_, index) => {
        const x = index % 4;
        const y = Math.floor(index / 4);
        return <span key={index} className={occupied.has(`${x}-${y}`) && kind ? `block-${kind.toLowerCase()}` : ""} />;
      })}
    </div>
  );
}

export default function TetrisPage() {
  const [streamId, setStreamId] = useState("takokuri1");
  const [room, setRoom] = useState(DEFAULT_ROOM);
  const [game, setGame] = useState<GameState>(() => newGame());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsLocked, setSettingsLocked] = useState(false);
  const [holdKind, setHoldKind] = useState<PieceKind>();
  const [elapsed, setElapsed] = useState(0);
  const unlockTimer = useRef<number | null>(null);
  const { connection, send } = useSignalChannel(room, () => {});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setStreamId(params.get("stream") || localStorage.getItem("tako-stream") || "takokuri1");
    setRoom(sanitizeRoom(params.get("room") || localStorage.getItem("tako-room") || DEFAULT_ROOM));
    setSettingsLocked(localStorage.getItem(LIVE_LOCK_KEY) === "1");

    const syncLock = (event: StorageEvent) => {
      if (event.key !== LIVE_LOCK_KEY) return;
      const locked = event.newValue === "1";
      setSettingsLocked(locked);
      if (locked) setSettingsOpen(false);
    };
    window.addEventListener("storage", syncLock);
    return () => window.removeEventListener("storage", syncLock);
  }, []);

  useEffect(() => {
    if (game.status !== "running") return;
    const speed = Math.max(140, 650 - Math.floor(game.lines / 5) * 55);
    const timer = window.setInterval(() => setGame(stepDown), speed);
    return () => window.clearInterval(timer);
  }, [game.status, game.lines]);

  useEffect(() => {
    if (game.status !== "running") return;
    const timer = window.setInterval(() => setElapsed(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [game.status]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (settingsOpen) return;
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(event.key)) event.preventDefault();
      if (event.key === "ArrowLeft") setGame(state => moveSide(state, -1));
      if (event.key === "ArrowRight") setGame(state => moveSide(state, 1));
      if (event.key === "ArrowDown") setGame(stepDown);
      if (event.key === "ArrowUp") setGame(rotatePiece);
      if (event.key === " ") setGame(hardDrop);
      if (event.key.toLowerCase() === "p") setGame(state => ({ ...state, status: state.status === "running" ? "paused" : state.status === "paused" ? "running" : state.status }));
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [settingsOpen]);

  useEffect(() => () => {
    if (unlockTimer.current !== null) window.clearTimeout(unlockTimer.current);
  }, []);

  const projectionCells = useMemo(() => {
    const cells = game.board.flat();
    pieceCells(game.active).forEach(([dx, dy]) => {
      const x = game.active.x + dx;
      const y = game.active.y + dy;
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) cells[y * COLS + x] = game.active.kind;
    });
    return cells;
  }, [game]);

  useEffect(() => {
    send(createMessage("tetris", "player", room, {
      tetris: { cells: projectionCells, score: game.score, lines: game.lines, status: game.status },
    }));
  }, [game.lines, game.score, game.status, projectionCells, room, send]);

  const tap = (action: (state: GameState) => GameState) => {
    navigator.vibrate?.(8);
    setGame(action);
  };

  const restartGame = () => {
    setGame(newGame("running"));
    setHoldKind(undefined);
    setElapsed(0);
  };

  const toggleGame = () => {
    if (game.status === "gameover") { restartGame(); return; }
    setGame(state => {
      if (state.status === "ready") return { ...state, status: "running" };
      return { ...state, status: state.status === "running" ? "paused" : "running" };
    });
  };

  const holdPiece = () => {
    if (game.status !== "running") return;
    const outgoing = game.active.kind;
    const incoming = holdKind || game.next;
    setHoldKind(outgoing);
    setGame(state => {
      const active = spawn(incoming);
      const candidate = { ...state, active, next: holdKind ? state.next : randomKind() };
      return collides(candidate.board, active) ? { ...candidate, status: "gameover" } : candidate;
    });
  };

  const enableLiveLock = () => {
    localStorage.setItem(LIVE_LOCK_KEY, "1");
    setSettingsLocked(true);
    setSettingsOpen(false);
  };

  const disableLiveLock = () => {
    localStorage.removeItem(LIVE_LOCK_KEY);
    setSettingsLocked(false);
  };

  const startUnlockPress = () => {
    if (unlockTimer.current !== null) window.clearTimeout(unlockTimer.current);
    unlockTimer.current = window.setTimeout(() => {
      disableLiveLock();
      unlockTimer.current = null;
    }, 2000);
  };

  const cancelUnlockPress = () => {
    if (unlockTimer.current !== null) window.clearTimeout(unlockTimer.current);
    unlockTimer.current = null;
  };

  const level = Math.min(99, Math.floor(game.lines / 4) + 1);
  const time = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}’${String(elapsed % 60).padStart(2, "0")}`;
  const videoUrl = "https://vdo.ninja/?view=" + encodeURIComponent(streamId.trim()) + "&cleanoutput&noaudio";

  return (
    <main className={`tk-tetris ${settingsOpen ? "tetris-settings-open" : ""}`}>
      <header className="tk-tetris-top">
        {settingsLocked ? (
          <span className="tk-tetris-title"><strong>TAKOYAKI TETRIS</strong><small>5 × 8 · 40 CELLS</small></span>
        ) : (
          <Link href="/" className="tk-tetris-title"><strong>TAKOYAKI TETRIS</strong><small>5 × 8 · 40 CELLS</small></Link>
        )}
        <div className="tk-tetris-top-actions">
          <span className="tk-tetris-room">ROOM {room.toUpperCase()}</span>
          <ConnectionPill connection={connection} />
          {settingsLocked ? (
            <button
              className="takotris-live-unlock"
              onPointerDown={startUnlockPress}
              onPointerUp={cancelUnlockPress}
              onPointerCancel={cancelUnlockPress}
              onPointerLeave={cancelUnlockPress}
              aria-label="2秒長押しで本番モードを解除"
            ><strong>LIVE 🔒</strong><small>2秒長押し</small></button>
          ) : (
            <button className="tk-tetris-settings-button" onClick={() => setSettingsOpen(value => !value)} aria-label="設定">•••</button>
          )}
          <Link className="tk-tetris-exit" href="/">ゲームをやめる</Link>
        </div>
      </header>

      {settingsOpen && !settingsLocked && <section className="tetris-settings tk-tetris-settings">
        <label><span>ROOM</span><input value={room} onChange={event => { const value = sanitizeRoom(event.target.value); setRoom(value); localStorage.setItem("tako-room", value); }} /></label>
        <label><span>STREAM</span><input value={streamId} onChange={event => { setStreamId(event.target.value); localStorage.setItem("tako-stream", event.target.value); }} /></label>
        <div><Link href={"/tetris-projector?room=" + encodeURIComponent(room)}>2面投影</Link><Link href="/tetris-adjust">2面位置調整</Link></div>
        <div className="show-settings-footer">
          <p>鉄板A・Bを別々に調整できます。本番モードでは設定を封印します。</p>
          <button className="show-live-lock-button" onClick={enableLiveLock}>🔒 本番モードを開始</button>
        </div>
      </section>}

      <section className="tk-tetris-body">
        <div className="tk-tetris-play">
          <aside className="tk-tetris-left">
            <button className="tk-tetris-panel tk-hold" onPointerDown={event => { event.preventDefault(); holdPiece(); }} aria-label="ホールド">
              <span>HOLD</span><PiecePreview kind={holdKind} /><small>TAP TO HOLD</small>
            </button>
            <dl className="tk-tetris-panel tk-tetris-stats">
              <div><dt>SCORE</dt><dd>{String(game.score).padStart(6, "0")}</dd></div>
              <div><dt>LINES</dt><dd>{String(game.lines).padStart(3, "0")}</dd></div>
              <div><dt>LEVEL</dt><dd>{String(level).padStart(2, "0")}</dd></div>
              <div><dt>TIME</dt><dd>{time}</dd></div>
            </dl>
          </aside>

          <section className="tk-tetris-field">
            <div className="tk-field-label"><span>PLAY FIELD</span><b><i /> LIVE · 2 PLATES</b></div>
            <div className="tetris-board player-video-board" aria-label="投影されたテトリスを確認するVDO.Ninja映像">
              {streamId.trim() ? <iframe className="tetris-video" src={videoUrl} title="VDO.Ninja game field" allow="autoplay; fullscreen; picture-in-picture" /> : <div className="tetris-video-placeholder">NO SIGNAL</div>}
              <div className="tetris-scanlines" />
              <div className="tetris-grid player-tetris-grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }} aria-hidden="true">
                {Array.from({ length: ROWS * COLS }, (_, cellIndex) => <span key={cellIndex} className="tetris-cell" />)}
              </div>
              {game.status !== "running" && (
                <button className="tetris-overlay tk-tetris-overlay" onClick={toggleGame}>
                  <small>{game.status === "gameover" ? "GAME OVER" : game.status === "paused" ? "PAUSED" : "READY"}</small>
                  <strong>{game.status === "gameover" ? "RETRY" : game.status === "paused" ? "CONTINUE" : "START"}</strong>
                </button>
              )}
            </div>
          </section>

          <aside className="tk-tetris-right">
            <div className="tk-tetris-panel tk-next">
              <span>NEXT</span><PiecePreview kind={game.next} />
              <div className="tk-next-fade"><i /><i /><i /><i /></div>
            </div>
            <div className="tk-tetris-panel tk-session">
              <span>SESSION</span>
              <strong>{game.status === "running" ? "ACTIVE" : game.status.toUpperCase()}</strong>
              <small>PROJECTION ONLINE</small>
            </div>
            <button className="tk-new-game" onClick={restartGame}>↺ NEW GAME</button>
          </aside>
        </div>

        <div className="tk-tetris-controls">
          <button aria-label="左" onPointerDown={event => { event.preventDefault(); tap(state => moveSide(state, -1)); }}><span>←</span><small>LEFT</small></button>
          <button aria-label="右" onPointerDown={event => { event.preventDefault(); tap(state => moveSide(state, 1)); }}><span>→</span><small>RIGHT</small></button>
          <button className="rotate" aria-label="回転" onPointerDown={event => { event.preventDefault(); tap(rotatePiece); }}><span>↻</span><small>ROTATE</small></button>
          <button aria-label="下" onPointerDown={event => { event.preventDefault(); tap(stepDown); }}><span>↓</span><small>SOFT DROP</small></button>
          <button className="drop" aria-label="一気に落とす" onPointerDown={event => { event.preventDefault(); tap(hardDrop); }}><span>↓↓</span><small>HARD DROP</small></button>
        </div>
      </section>
    </main>
  );
}
