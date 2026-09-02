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
import { DEFAULT_TETRIS_CALIBRATION, TETRIS_CALIBRATION_KEY, TETRIS_CELL_COUNT, TETRIS_COLS, TETRIS_ROWS, parseTetrisCalibration, type TetrisCalibration } from "../lib/tetris";

const EMPTY_PROJECTION: TetrisProjectionState = {
  cells: Array(TETRIS_CELL_COUNT).fill(null),
  score: 0,
  lines: 0,
  status: "ready",
};

export default function TetrisProjectorPage() {
  const [room, setRoom] = useState(DEFAULT_ROOM);
  const [projection, setProjection] = useState<TetrisProjectionState>(EMPTY_PROJECTION);
  const [fullscreen, setFullscreen] = useState(false);
  const [calibration, setCalibration] = useState<TetrisCalibration>(DEFAULT_TETRIS_CALIBRATION);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRoom(sanitizeRoom(params.get("room") || localStorage.getItem("tako-room") || DEFAULT_ROOM));
    setCalibration(parseTetrisCalibration(localStorage.getItem(TETRIS_CALIBRATION_KEY)));
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    const onStorage = (event: StorageEvent) => { if (event.key === TETRIS_CALIBRATION_KEY) setCalibration(parseTetrisCalibration(event.newValue)); };
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("storage", onStorage);
    return () => { document.removeEventListener("fullscreenchange", onFullscreen); window.removeEventListener("storage", onStorage); };
  }, []);

  const onMessage = useCallback((message: SignalMessage) => {
    if (message.role === "player" && message.kind === "tetris" && message.tetris) {
      setProjection(message.tetris);
    }
  }, []);

  const { connection } = useSignalChannel(room, onMessage);

  const changeRoom = (value: string) => {
    const next = sanitizeRoom(value);
    setRoom(next);
    setProjection(EMPTY_PROJECTION);
    localStorage.setItem("tako-room", next);
    const basePath = window.location.pathname.startsWith("/tako-signal/") ? "/tako-signal" : "";
    history.replaceState(null, "", basePath + "/tetris-projector?room=" + encodeURIComponent(next));
  };

  const enterFullscreen = async () => {
    try { await document.documentElement.requestFullscreen(); } catch { setFullscreen(true); }
  };

  return (
    <main className={"tetris-projector-shell " + (fullscreen ? "is-fullscreen" : "")}>
      <header className="tetris-projector-controls">
        <Link href="/tetris" className="wordmark"><span className="wordmark-dot" />VIDEO TETRIS</Link>
        <label><span>ROOM</span><input value={room} onChange={event => changeRoom(event.target.value)} /></label>
        <ConnectionPill connection={connection} />
        <Link href="/tetris-adjust">位置調整</Link>
        <div><span>SCORE {String(projection.score).padStart(6, "0")}</span><span>LINES {String(projection.lines).padStart(2, "0")}</span></div>
        <button onClick={enterFullscreen}>投影を全画面にする ↗</button>
      </header>

      <section className="tetris-projection-stage" aria-label="テトリスのプロジェクション出力">
        <div className="tetris-projection-grid" style={{ transform: `translate(${calibration.x}px, ${calibration.y}px) scale(${calibration.scale})`, gap: `${calibration.gapY}px ${calibration.gapX}px`, gridTemplateColumns: `repeat(${TETRIS_COLS}, ${calibration.diameter}px)`, gridTemplateRows: `repeat(${TETRIS_ROWS}, ${calibration.diameter}px)` }}>
          {projection.cells.map((kind, index) => (
            <span key={index} className={kind ? "projection-block block-" + kind.toLowerCase() : ""} />
          ))}
        </div>
      </section>
    </main>
  );
}
