"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DEFAULT_TETRIS_CALIBRATION,
  TETRIS_CALIBRATION_KEY,
  TETRIS_CELL_COUNT, TETRIS_COLS, TETRIS_ROWS,
  type TetrisCalibration,
  parseTetrisCalibration,
} from "../lib/tetris";

const controls: Array<{ key: keyof TetrisCalibration; label: string; min: number; max: number; step: number }> = [
  { key: "x", label: "左右", min: -600, max: 600, step: 1 },
  { key: "y", label: "上下", min: -400, max: 400, step: 1 },
  { key: "scale", label: "全体サイズ", min: 0.3, max: 2, step: 0.01 },
  { key: "gapX", label: "横の間隔", min: 0, max: 120, step: 1 },
  { key: "gapY", label: "縦の間隔", min: 0, max: 120, step: 1 },
  { key: "diameter", label: "丸の大きさ", min: 20, max: 180, step: 1 },
];

export default function TetrisAdjustPage() {
  const [calibration, setCalibration] = useState<TetrisCalibration>(DEFAULT_TETRIS_CALIBRATION);

  useEffect(() => {
    setCalibration(parseTetrisCalibration(localStorage.getItem(TETRIS_CALIBRATION_KEY)));
  }, []);

  const update = (key: keyof TetrisCalibration, value: number) => {
    const next = { ...calibration, [key]: value };
    setCalibration(next);
    localStorage.setItem(TETRIS_CALIBRATION_KEY, JSON.stringify(next));
  };

  const reset = () => {
    setCalibration(DEFAULT_TETRIS_CALIBRATION);
    localStorage.setItem(TETRIS_CALIBRATION_KEY, JSON.stringify(DEFAULT_TETRIS_CALIBRATION));
  };

  return (
    <main className="tetris-adjust-shell">
      <header className="tetris-adjust-header">
        <Link href="/tetris-projector" className="wordmark"><span className="wordmark-dot" />TAKO TETRIS</Link>
        <b>5 × 4 POSITION</b>
        <Link href="/tetris-projector">投映画面 ↗</Link>
      </header>
      <section className="tetris-adjust-layout">
        <div className="tetris-adjust-stage">
          <div className="tetris-adjust-grid" style={{
            transform: `translate(${calibration.x}px, ${calibration.y}px) scale(${calibration.scale})`,
            gap: `${calibration.gapY}px ${calibration.gapX}px`,
            gridTemplateColumns: `repeat(${TETRIS_COLS}, ${calibration.diameter}px)`,
            gridTemplateRows: `repeat(${TETRIS_ROWS}, ${calibration.diameter}px)`,
          }}>
            {Array.from({ length: TETRIS_CELL_COUNT }, (_, index) => <span key={index}><b>{index + 1}</b></span>)}
          </div>
        </div>
        <aside className="tetris-adjust-panel">
          <div><small>PROJECTOR CALIBRATION</small><h1>丸を鉄板の穴へ合わせる</h1></div>
          {controls.map(control => (
            <label key={control.key}>
              <span>{control.label}<b>{calibration[control.key]}</b></span>
              <input type="range" min={control.min} max={control.max} step={control.step} value={calibration[control.key]} onChange={event => update(control.key, Number(event.target.value))} />
            </label>
          ))}
          <button onClick={reset}>リセット</button>
        </aside>
      </section>
    </main>
  );
}
