"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ConnectionPill } from "../components/ConnectionPill";
import { useSignalChannel } from "../hooks/useSignalChannel";
import {
  DEFAULT_ROOM,
  sanitizeRoom,
  type SignalMessage,
  type TetrisProjectionState,
} from "../lib/takoyaki";
import {
  DEFAULT_TETRIS_CALIBRATION_A,
  TETRIS_CALIBRATION_KEY_A,
  TETRIS_COLS,
  TETRIS_PLATE_CELL_COUNT,
  TETRIS_PLATE_ROWS,
  parseTetrisCalibration,
  type TetrisCalibration,
} from "../lib/tetris";

const EMPTY_PROJECTION: TetrisProjectionState = {
  cells: Array(TETRIS_PLATE_CELL_COUNT).fill(null),
  score: 0,
  lines: 0,
  status: "ready",
};

function PlateOutput({ cells, calibration }: { cells: TetrisProjectionState["cells"]; calibration: TetrisCalibration }) {
  return (
    <div
      className="tk-projection-plate plate-a"
      style={{ transform: `translate(${calibration.x}px, ${calibration.y}px) rotate(${calibration.rotate}deg) scale(${calibration.scale})` }}
      aria-label="横5×縦4に90度回転した鉄板"
    >
      <div className="tk-projection-grid" style={{
        gap: `${calibration.gapY}px ${calibration.gapX}px`,
        gridTemplateColumns: `repeat(${TETRIS_COLS}, ${calibration.diameter}px)`,
        gridTemplateRows: `repeat(${TETRIS_PLATE_ROWS}, ${calibration.diameter}px)`,
      }}>
        {cells.map((kind, index) => <span key={index} className={kind ? `projection-block block-${kind.toLowerCase()}` : ""} />)}
      </div>
    </div>
  );
}

export default function TetrisProjectorPage() {
  const [room, setRoom] = useState(DEFAULT_ROOM);
  const [projection, setProjection] = useState<TetrisProjectionState>(EMPTY_PROJECTION);
  const [fullscreen, setFullscreen] = useState(false);
  const [plateA, setPlateA] = useState<TetrisCalibration>(DEFAULT_TETRIS_CALIBRATION_A);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRoom(sanitizeRoom(params.get("room") || localStorage.getItem("tako-room") || DEFAULT_ROOM));
    setPlateA(parseTetrisCalibration(localStorage.getItem(TETRIS_CALIBRATION_KEY_A), DEFAULT_TETRIS_CALIBRATION_A));
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    const onStorage = (event: StorageEvent) => {
      if (event.key === TETRIS_CALIBRATION_KEY_A) setPlateA(parseTetrisCalibration(event.newValue, DEFAULT_TETRIS_CALIBRATION_A));
    };
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("storage", onStorage);
    return () => { document.removeEventListener("fullscreenchange", onFullscreen); window.removeEventListener("storage", onStorage); };
  }, []);

  const onMessage = useCallback((message: SignalMessage) => {
    if (message.role === "player" && message.kind === "tetris" && message.tetris) setProjection(message.tetris);
  }, []);
  const { connection, reconnect } = useSignalChannel(room, onMessage);

  const changeRoom = (value: string) => {
    const next = sanitizeRoom(value);
    setRoom(next);
    setProjection(EMPTY_PROJECTION);
    localStorage.setItem("tako-room", next);
  };

  const enterFullscreen = async () => {
    try { await document.documentElement.requestFullscreen(); } catch { setFullscreen(true); }
  };

  return (
    <main className={`tk-projector ${fullscreen ? "is-fullscreen" : ""}`}>
      <header className="tk-projector-bar">
        <Link href="/tetris">TAKOYAKI TETRIS</Link>
        <label><span>ROOM</span><input value={room} onChange={event => changeRoom(event.target.value)} /></label>
        <ConnectionPill connection={connection} onReconnect={reconnect} />
        <div><span>SCORE {String(projection.score).padStart(6, "0")}</span><span>LINES {String(projection.lines).padStart(3, "0")}</span></div>
        <Link href="/tetris-adjust">位置調整</Link>
        <button onClick={enterFullscreen}>全画面 ↗</button>
      </header>
      <section className="tk-projector-stage">
        <PlateOutput cells={projection.cells.slice(0, TETRIS_PLATE_CELL_COUNT)} calibration={plateA} />
      </section>
    </main>
  );
}
