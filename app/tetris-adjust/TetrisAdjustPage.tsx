"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DEFAULT_TETRIS_CALIBRATION_A,
  TETRIS_CALIBRATION_KEY_A,
  TETRIS_COLS,
  TETRIS_PLATE_CELL_COUNT,
  TETRIS_PLATE_ROWS,
  parseTetrisCalibration,
  type TetrisCalibration,
} from "../lib/tetris";

const controls: Array<{ key: keyof TetrisCalibration; label: string; min: number; max: number; step: number }> = [
  { key: "x", label: "左右", min: -700, max: 700, step: 1 },
  { key: "y", label: "上下", min: -450, max: 450, step: 1 },
  { key: "scale", label: "全体サイズ", min: 0.25, max: 2, step: 0.01 },
  { key: "rotate", label: "回転", min: -180, max: 180, step: 0.1 },
  { key: "gapX", label: "横の間隔", min: 0, max: 120, step: 1 },
  { key: "gapY", label: "縦の間隔", min: 0, max: 120, step: 1 },
  { key: "diameter", label: "丸の大きさ", min: 20, max: 180, step: 1 },
];

function PlatePreview({ calibration }: { calibration: TetrisCalibration }) {
  return (
    <div className="tk-adjust-plate plate-a selected" style={{ transform: `translate(${calibration.x}px, ${calibration.y}px) rotate(${calibration.rotate}deg) scale(${calibration.scale})` }}>
      <b>PROJECTED AS 横5 × 縦4</b>
      <div style={{
        gap: `${calibration.gapY}px ${calibration.gapX}px`,
        gridTemplateColumns: `repeat(${TETRIS_COLS}, ${calibration.diameter}px)`,
        gridTemplateRows: `repeat(${TETRIS_PLATE_ROWS}, ${calibration.diameter}px)`,
      }}>
        {Array.from({ length: TETRIS_PLATE_CELL_COUNT }, (_, index) => <span key={index}>{String(index + 1).padStart(2, "0")}</span>)}
      </div>
    </div>
  );
}

export default function TetrisAdjustPage() {
  const [plateA, setPlateA] = useState<TetrisCalibration>(DEFAULT_TETRIS_CALIBRATION_A);

  useEffect(() => {
    setPlateA(parseTetrisCalibration(localStorage.getItem(TETRIS_CALIBRATION_KEY_A), DEFAULT_TETRIS_CALIBRATION_A));
  }, []);

  const calibration = plateA;
  const update = (key: keyof TetrisCalibration, value: number) => {
    const nextCalibration = { ...calibration, [key]: value };
    setPlateA(nextCalibration);
    localStorage.setItem(TETRIS_CALIBRATION_KEY_A, JSON.stringify(nextCalibration));
  };

  const reset = () => {
    setPlateA(DEFAULT_TETRIS_CALIBRATION_A);
    localStorage.setItem(TETRIS_CALIBRATION_KEY_A, JSON.stringify(DEFAULT_TETRIS_CALIBRATION_A));
  };

  return (
    <main className="tk-adjust">
      <header className="tk-adjust-head">
        <Link href="/tetris">TAKOYAKI TETRIS</Link>
        <b>PROJECTOR CALIBRATION · 横5 × 縦4</b>
        <Link href="/tetris-projector">投映画面 ↗</Link>
      </header>
      <section className="tk-adjust-layout">
        <div className="tk-adjust-stage">
          <PlatePreview calibration={plateA} />
        </div>
        <aside className="tk-adjust-panel">
          <div><small>90° ROTATED · 20 CELLS</small><h1>横向きの鉄板へ合わせる</h1><p>縦5×横4のゲーム盤を90度回転し、横5×縦4で投影します。</p></div>
          {controls.map(control => (
            <label key={control.key}>
              <span>{control.label}<b>{Number(calibration[control.key]).toFixed(control.step < 1 ? 1 : 0)}</b></span>
              <input type="range" min={control.min} max={control.max} step={control.step} value={calibration[control.key]} onChange={event => update(control.key, Number(event.target.value))} />
            </label>
          ))}
          <div className="tk-nudge">
            <button onClick={() => update("y", calibration.y - 1)}>↑</button>
            <button onClick={() => update("x", calibration.x - 1)}>←</button>
            <button onClick={() => update("x", calibration.x + 1)}>→</button>
            <button onClick={() => update("y", calibration.y + 1)}>↓</button>
          </div>
          <button className="tk-adjust-reset" onClick={reset}>位置をリセット</button>
        </aside>
      </section>
    </main>
  );
}
