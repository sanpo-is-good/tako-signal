"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ConnectionPill } from "../components/ConnectionPill";
import { useSignalChannel } from "../hooks/useSignalChannel";
import { DEFAULT_ROOM, createMessage, sanitizeRoom } from "../lib/takoyaki";

const COLS = 10;
const ROWS = 20;
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
const spawn = (kind: PieceKind): Piece => ({ kind, rotation: 0, x: 3, y: 0 });

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

export default function TetrisPage() {
  const [streamId, setStreamId] = useState("takokuri1");
  const [room, setRoom] = useState(DEFAULT_ROOM);
  const [game, setGame] = useState<GameState>(() => newGame());
  const { connection, send } = useSignalChannel(room, () => {});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setStreamId(params.get("stream") || localStorage.getItem("tako-stream") || "takokuri1");
    setRoom(sanitizeRoom(params.get("room") || localStorage.getItem("tako-room") || DEFAULT_ROOM));
  }, []);

  useEffect(() => {
    if (game.status !== "running") return;
    const speed = Math.max(140, 650 - Math.floor(game.lines / 5) * 55);
    const timer = window.setInterval(() => setGame(stepDown), speed);
    return () => window.clearInterval(timer);
  }, [game.status, game.lines]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
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

  const toggleGame = () => {
    setGame(state => {
      if (state.status === "ready") return { ...state, status: "running" };
      if (state.status === "gameover") return newGame("running");
      return { ...state, status: state.status === "running" ? "paused" : "running" };
    });
  };

  const videoUrl = "https://vdo.ninja/?view=" + encodeURIComponent(streamId.trim()) + "&cleanoutput&autoplay&muted";

  return (
    <main className="tetris-shell">
      <header className="tetris-header">
        <Link href="/" className="wordmark"><span className="wordmark-dot" />TAKO SIGNAL</Link>
        <div><span>ALTERNATIVE GAME</span><b>VIDEO TETRIS</b></div>
        <div className="tetris-header-buttons">
          <ConnectionPill connection={connection} />
          <Link href={"/tetris-projector?room=" + encodeURIComponent(room)}>PROJECTOR ↗</Link>
          <button onClick={() => setGame(newGame("running"))}>RESTART</button>
        </div>
      </header>

      <section className="tetris-layout">
        <div className="tetris-board-column">
          <div className="tetris-board-head">
            <div><p>VDO.NINJA / PLAY FIELD</p><h1>映像を見ながら、投影を動かす。</h1></div>
            <div className="tetris-source-fields">
              <label><span>ROOM ID</span><input value={room} onChange={event => { const value = sanitizeRoom(event.target.value); setRoom(value); localStorage.setItem("tako-room", value); }} /></label>
              <label><span>STREAM ID</span><input value={streamId} onChange={event => { setStreamId(event.target.value); localStorage.setItem("tako-stream", event.target.value); }} /></label>
            </div>
          </div>

          <div className="tetris-board player-video-board" aria-label="投影されたテトリスを確認するVDO.Ninja映像">
            {streamId.trim() ? <iframe className="tetris-video" src={videoUrl} title="VDO.Ninja game field" allow="autoplay; fullscreen" /> : <div className="tetris-video-placeholder">NO VIDEO SIGNAL</div>}
            <div className="tetris-scanlines" />
            <div className="tetris-grid player-tetris-grid" aria-hidden="true">
              {Array.from({ length: ROWS * COLS }, (_, index) => <span key={index} className="tetris-cell" />)}
            </div>
            {game.status !== "running" && (
              <button className="tetris-overlay" onClick={toggleGame}>
                <small>{game.status === "gameover" ? "GAME OVER" : game.status === "paused" ? "PAUSED" : "VIDEO TETRIS"}</small>
                <strong>{game.status === "gameover" ? "もう一度" : game.status === "paused" ? "つづける" : "タップして開始"}</strong>
              </button>
            )}
          </div>
        </div>

        <aside className="tetris-console">
          <div className="tetris-scoreboard">
            <div><span>SCORE</span><strong>{String(game.score).padStart(6, "0")}</strong></div>
            <div><span>LINES</span><strong>{String(game.lines).padStart(2, "0")}</strong></div>
          </div>

          <section className="tetris-projection-note">
            <p>PROJECTION ONLY</p>
            <strong>ブロックは投映画面だけに表示</strong>
            <small>実物へ投影されたブロックを、VDO.Ninja映像で見ながら操作します。</small>
            <Link href={"/tetris-projector?room=" + encodeURIComponent(room)}>投映画面を開く ↗</Link>
          </section>

          <div className="tetris-touch-controls" aria-label="テトリス操作">
            <button className="rotate" onPointerDown={event => { event.preventDefault(); tap(rotatePiece); }}><span>↻</span><b>回転</b></button>
            <button onPointerDown={event => { event.preventDefault(); tap(state => moveSide(state, -1)); }}><span>←</span><b>左</b></button>
            <button onPointerDown={event => { event.preventDefault(); tap(stepDown); }}><span>↓</span><b>下</b></button>
            <button onPointerDown={event => { event.preventDefault(); tap(state => moveSide(state, 1)); }}><span>→</span><b>右</b></button>
            <button className="drop" onPointerDown={event => { event.preventDefault(); tap(hardDrop); }}><span>⇊</span><b>一気に落とす</b></button>
          </div>

          <button className="tetris-pause" onClick={toggleGame}>{game.status === "running" ? "一時停止" : game.status === "gameover" ? "もう一度遊ぶ" : "ゲームを始める"}</button>
          <p className="tetris-key-hint">KEYBOARD　← → ↓ / ↑ ROTATE / SPACE DROP / P PAUSE</p>
        </aside>
      </section>
    </main>
  );
}
