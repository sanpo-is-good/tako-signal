"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SignalPlate } from "../components/SignalPlate";
import {
  HOLES,
  HOLE_OFFSETS_KEY,
  parseHoleOffsets,
  type HoleOffsets,
} from "../lib/takoyaki";

export default function DebugPage() {
  const [streamId, setStreamId] = useState("takokuri1");
  const [selectedHole, setSelectedHole] = useState(1);
  const [holeOffsets, setHoleOffsets] = useState<HoleOffsets>({});

  useEffect(() => {
    setStreamId(localStorage.getItem("tako-stream") || "takokuri1");
    setHoleOffsets(parseHoleOffsets(localStorage.getItem(HOLE_OFFSETS_KEY)));
  }, []);

  const selectedBase = HOLES.find(hole => hole.id === selectedHole)!;
  const selectedOffset = holeOffsets[selectedHole] || { x: 0, y: 0 };
  const selectedPosition = useMemo(() => ({
    x: selectedBase.x + selectedOffset.x,
    y: selectedBase.y + selectedOffset.y,
  }), [selectedBase, selectedOffset]);

  const saveOffsets = (next: HoleOffsets) => {
    setHoleOffsets(next);
    localStorage.setItem(HOLE_OFFSETS_KEY, JSON.stringify(next));
  };

  const updateHole = (hole: number, x: number, y: number) => {
    saveOffsets({ ...holeOffsets, [hole]: { x, y } });
  };

  const setAbsolutePosition = (axis: "x" | "y", value: number) => {
    const current = holeOffsets[selectedHole] || { x: 0, y: 0 };
    const base = HOLES.find(hole => hole.id === selectedHole)!;
    updateHole(selectedHole, axis === "x" ? value - base.x : current.x, axis === "y" ? value - base.y : current.y);
  };

  const nudge = (x: number, y: number) => {
    const current = holeOffsets[selectedHole] || { x: 0, y: 0 };
    updateHole(selectedHole, current.x + x, current.y + y);
  };

  const resetSelected = () => {
    const next = { ...holeOffsets };
    delete next[selectedHole];
    saveOffsets(next);
  };

  return (
    <main className="debug-shell">
      <header className="debug-header">
        <div>
          <Link href="/" className="wordmark"><span className="wordmark-dot" />TAKO SIGNAL</Link>
          <span className="debug-badge">POSITION LAB</span>
        </div>
        <nav><Link href="/player">お客さん画面</Link><Link href="/kitchen">職人画面</Link></nav>
      </header>

      <section className="debug-layout">
        <div className="debug-stage">
          <div className="debug-stage-title">
            <div><p className="micro-label">LIVE ALIGNMENT / 4 × 5</p><h1>丸を実物の穴へ重ねる</h1></div>
            <p>番号を直接ドラッグできます。変更はこの端末に自動保存されます。</p>
          </div>
          <div className="debug-plate-wrap">
            <SignalPlate
              streamId={streamId}
              selectedHole={selectedHole}
              activeHole={selectedHole}
              activeAction="turn"
              interactive
              calibration
              onSelect={setSelectedHole}
              holeOffsets={holeOffsets}
              onHolePositionChange={updateHole}
            />
          </div>
        </div>

        <aside className="debug-console">
          <div className="debug-console-head">
            <span>SELECTED HOLE</span>
            <strong>{String(selectedHole).padStart(2, "0")}</strong>
          </div>

          <label className="debug-stream">
            <span>VDO.Ninja Stream ID</span>
            <input value={streamId} onChange={event => { setStreamId(event.target.value); localStorage.setItem("tako-stream", event.target.value); }} />
          </label>

          <div className="debug-position-readout">
            <div><span>X</span><strong>{selectedPosition.x.toFixed(1)}%</strong></div>
            <div><span>Y</span><strong>{selectedPosition.y.toFixed(1)}%</strong></div>
          </div>

          <label className="debug-range">
            <span>左右位置 <b>{selectedPosition.x.toFixed(1)}%</b></span>
            <input type="range" min="4" max="96" step="0.1" value={selectedPosition.x} onChange={event => setAbsolutePosition("x", Number(event.target.value))} />
          </label>
          <label className="debug-range">
            <span>上下位置 <b>{selectedPosition.y.toFixed(1)}%</b></span>
            <input type="range" min="4" max="96" step="0.1" value={selectedPosition.y} onChange={event => setAbsolutePosition("y", Number(event.target.value))} />
          </label>

          <div className="nudge-grid" aria-label="微調整">
            <button onClick={() => nudge(0, -0.25)}>↑</button>
            <button onClick={() => nudge(-0.25, 0)}>←</button>
            <button onClick={() => nudge(0.25, 0)}>→</button>
            <button onClick={() => nudge(0, 0.25)}>↓</button>
          </div>

          <div className="debug-hole-list">
            {HOLES.map(hole => <button className={selectedHole === hole.id ? "active" : ""} key={hole.id} onClick={() => setSelectedHole(hole.id)}>{String(hole.id).padStart(2, "0")}</button>)}
          </div>

          <button className="debug-reset-one" onClick={resetSelected}>この穴だけ初期位置へ</button>
          <button className="debug-reset-all" onClick={() => saveOffsets({})}>20穴すべてをリセット</button>

          <p className="debug-note"><i /> 調整値はお客さん画面と職人画面に反映されます。同じ端末の別タブなら、再読み込みなしでも同期します。</p>
        </aside>
      </section>
    </main>
  );
}
