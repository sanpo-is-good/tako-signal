"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DEFAULT_TETRIS_CALIBRATION_A,
  DEFAULT_TETRIS_CALIBRATION_B,
  TETRIS_CALIBRATION_KEY_A,
  TETRIS_CALIBRATION_KEY_B,
  TETRIS_COLS,
  TETRIS_PLATE_CELL_COUNT,
  TETRIS_PLATE_ROWS,
  parseTetrisCalibration,
  type TetrisCalibration,
} from "../lib/tetris";

type PlateId = "A" | "B";
const controls: Array<{ key: keyof TetrisCalibration; label: string; min: number; max: number; step: number }> = [
  { key: "x", label: "左右", min: -700, max: 700, step: 1 },
  { key: "y", label: "上下", min: -450, max: 450, step: 1 },
  { key: "scale", label: "全体サイズ", min: 0.25, max: 2, step: 0.01 },
  { key: "rotate", label: "回転", min: -30, max: 30, step: 0.1 },
  { key: "gapX", label: "横の間隔", min: 0, max: 120, step: 1 },
  { key: "gapY", label: "縦の間隔", min: 0, max: 120, step: 1 },
  { key: "diameter", label: "丸の大きさ", min: 20, max: 180, step: 1 },
];

function PlatePreview({ id, calibration, selected }: { id: PlateId; calibration: TetrisCalibration; selected: boolean }) {
  return (
    <div className={`tk-adjust-plate plate-${id.toLowerCase()} ${selected ? "selected" : ""}`} style={{ transform: `translate(${calibration.x}px, ${calibration.y}px) rotate(${calibration.rotate}deg) scale(${calibration.scale})` }}>
      <b>PLATE {id}</b>
      <div style={{
        gap: `${calibration.gapY}px ${calibration.gapX}px`,
        gridTemplateColumns: `repeat(${TETRIS_COLS}, ${calibration.diameter}px)`,
        gridTemplateRows: `repeat(${TETRIS_PLATE_ROWS}, ${calibration.diameter}px)`,
      }}>
        {Array.from({ length: TETRIS_PLATE_CELL_COUNT }, (_, index) => <span key={index}>{id}{String(index + 1).padStart(2, "0")}</span>)}
      </div>
    </div>
  );
}

export default function TetrisAdjustPage() {
  const [selected, setSelected] = useState<PlateId>("A");
  const [plateA, setPlateA] = useState<TetrisCalibration>(DEFAULT_TETRIS_CALIBRATION_A);
  const [plateB, setPlateB] = useState<TetrisCalibration>(DEFAULT_TETRIS_CALIBRATION_B);

  useEffect(() => {
    setPlateA(parseTetrisCalibration(localStorage.getItem(TETRIS_CALIBRATION_KEY_A), DEFAULT_TETRIS_CALIBRATION_A));
    setPlateB(parseTetrisCalibration(localStorage.getItem(TETRIS_CALIBRATION_KEY_B), DEFAULT_TETRIS_CALIBRATION_B));
  }, []);

  const calibration = selected === "A" ? plateA : plateB;
  const update = (key: keyof TetrisCalibration, value: number) => {
    const next = { ...calibration, [key]: value };
    if (selected === "A") setPlateA(next); else setPlateB(next);
    localStorage.setItem(selected === "A" ? TETRIS_CALIBRATION_KEY_A : TETRIS_CALIBRATION_KEY_B, JSON.stringify(next));
  };

  const reset = () => {
    const next = selected === "A" ? DEFAULT_TETRIS_CALIBRATION_A : DEFAULT_TETRIS_CALIBRATION_B;
    if (selected === "A") setPlateA(next); else setPlateB(next);
    localStorage.setItem(selected === "A" ? TETRIS_CALIBRATION_KEY_A : TETRIS_CALIBRATION_KEY_B, JSON.stringify(next));
  };

  return (
    <main className="tk-adjust">
      <header className="tk-adjust-head">
        <Link href="/tetris">TAKOYAKI TETRIS</Link>
        <b>PROJECTOR CALIBRATION · 2 PLATES</b>
        <Link href="/tetris-projector">投映画面 ↗</Link>
      </header>
      <section className="tk-adjust-layout">
        <div className="tk-adjust-stage">
          <PlatePreview id="A" calibration={plateA} selected={selected === "A"} />
          <PlatePreview id="B" calibration={plateB} selected={selected === "B"} />
        </div>
        <aside className="tk-adjust-panel">
          <div className="tk-plate-tabs">
            <button className={selected === "A" ? "active" : ""} onClick={() => setSelected("A")}>鉄板 A</button>
            <button className={selected === "B" ? "active" : ""} onClick={() => setSelected("B")}>鉄板 B</button>
          </div>
          <div><small>SELECTED PLATE {selected}</small><h1>丸を実物の穴へ合わせる</h1><p>鉄板AとBの値は別々に保存されます。</p></div>
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
          <button className="tk-adjust-reset" onClick={reset}>鉄板 {selected} をリセット</button>
        </aside>
      </section>
    </main>
  );
}
