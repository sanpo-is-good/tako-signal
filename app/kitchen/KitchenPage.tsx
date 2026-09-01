"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ConnectionPill } from "../components/ConnectionPill";
import { SignalPlate } from "../components/SignalPlate";
import { useSignalChannel } from "../hooks/useSignalChannel";
import {
  ACTIONS,
  DEFAULT_ROOM,
  HOLE_OFFSETS_KEY,
  parseHoleOffsets,
  sanitizeRoom,
  type ActionKind,
  type HoleOffsets,
  type SignalMessage,
} from "../lib/takoyaki";

type TransformState = { x: number; y: number; scale: number; rotate: number };
const DEFAULT_TRANSFORM: TransformState = { x: 0, y: 0, scale: 1, rotate: 0 };
const SIGNAL_DURATION_MS = 1800;

export default function KitchenPage() {
  const [room, setRoom] = useState(DEFAULT_ROOM);
  const [roomInput, setRoomInput] = useState(DEFAULT_ROOM);
  const [current, setCurrent] = useState<SignalMessage | null>(null);
  const [queue, setQueue] = useState<SignalMessage[]>([]);
  const [calibration, setCalibration] = useState(false);
  const [projectorMode, setProjectorMode] = useState(false);
  const [testHole, setTestHole] = useState(6);
  const [testAction, setTestAction] = useState<ActionKind>("turn");
  const [transform, setTransform] = useState<TransformState>(DEFAULT_TRANSFORM);
  const [holeOffsets, setHoleOffsets] = useState<HoleOffsets>({});
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialRoom = sanitizeRoom(params.get("room") || localStorage.getItem("tako-room") || DEFAULT_ROOM);
    const savedTransform = localStorage.getItem("tako-projector-transform");
    setRoom(initialRoom);
    setRoomInput(initialRoom);
    setHoleOffsets(parseHoleOffsets(localStorage.getItem(HOLE_OFFSETS_KEY)));
    if (savedTransform) {
      try { setTransform({ ...DEFAULT_TRANSFORM, ...JSON.parse(savedTransform) }); } catch { /* use defaults */ }
    }

    const syncOffsets = (event: StorageEvent) => {
      if (event.key === HOLE_OFFSETS_KEY) setHoleOffsets(parseHoleOffsets(event.newValue));
    };
    window.addEventListener("storage", syncOffsets);
    return () => window.removeEventListener("storage", syncOffsets);
  }, []);

  const onMessage = useCallback((message: SignalMessage) => {
    if (message.role === "player" && message.kind === "request" && message.hole && message.action) {
      setQueue(items => items.some(item => item.id === message.id) ? items : [...items, message]);
    }
  }, []);

  const { connection } = useSignalChannel(room, onMessage);

  useEffect(() => {
    if (current || queue.length === 0) return;
    setCurrent(queue[0]);
    setQueue(items => items.slice(1));
  }, [current, queue]);

  useEffect(() => {
    if (!current) return;
    const timer = window.setTimeout(() => setCurrent(null), SIGNAL_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [current]);

  useEffect(() => {
    const onFullscreen = () => setProjectorMode(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  const applyRoom = () => {
    const next = sanitizeRoom(roomInput);
    setRoom(next);
    setRoomInput(next);
    setCurrent(null);
    setQueue([]);
    localStorage.setItem("tako-room", next);
    window.history.replaceState(null, "", `/kitchen?room=${encodeURIComponent(next)}`);
  };

  const updateTransform = (key: keyof TransformState, value: number) => {
    const next = { ...transform, [key]: value };
    setTransform(next);
    localStorage.setItem("tako-projector-transform", JSON.stringify(next));
  };

  const updateHoleOffset = (hole: number, x: number, y: number) => {
    const next = { ...holeOffsets, [hole]: { x, y } };
    setHoleOffsets(next);
    localStorage.setItem(HOLE_OFFSETS_KEY, JSON.stringify(next));
  };

  const enterProjector = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setProjectorMode(true);
    } catch {
      setProjectorMode(true);
    }
  };

  const activeHole = current?.hole || (calibration ? testHole : undefined);
  const activeAction = current?.action || testAction;

  return (
    <main className={`app-shell kitchen-shell auto-kitchen ${projectorMode ? "projector-mode" : ""}`}>
      <header className="app-header kitchen-header">
        <Link href="/" className="wordmark"><span className="wordmark-dot" />TAKO SIGNAL</Link>
        <div className="header-center"><span>AUTO PROJECTOR</span><b>/</b><span>ROOM {room.toUpperCase()}</span></div>
        <div className="header-actions">
          <ConnectionPill connection={connection} />
          <button className="icon-button" onClick={() => setSettingsOpen(value => !value)} aria-label="設定を開く">⚙</button>
        </div>
      </header>

      {settingsOpen && (
        <section className="settings-drawer kitchen-settings">
          <label><span>ルームID</span><div className="inline-field"><input value={roomInput} onChange={event => setRoomInput(event.target.value)} /><button onClick={applyRoom}>接続</button></div></label>
          <div className="settings-note">連続した合図は順番に並び、1件ずつ自動で表示されます。職人のボタン操作は必要ありません。</div>
        </section>
      )}

      <section className="kitchen-workspace">
        <div className="projection-stage">
          <div className="projection-meta">
            <span>AUTOMATIC PROJECTOR OUTPUT</span>
            <b>{current ? `HOLE ${String(current.hole).padStart(2, "0")} / ${ACTIONS[current.action!].short}` : calibration ? "CALIBRATION" : "STANDBY"}</b>
          </div>
          <SignalPlate
            activeHole={activeHole}
            activeAction={activeAction}
            cueId={current?.id}
            calibration={calibration}
            interactive={calibration}
            onSelect={setTestHole}
            holeOffsets={holeOffsets}
            onHolePositionChange={calibration ? updateHoleOffset : undefined}
            transform={transform}
          />
          {!current && !calibration && <div className="standby-mark"><span /><p>WAITING FOR SIGNAL</p></div>}
        </div>

        <aside className="operator-panel auto-operator">
          <div className="operator-title">
            <div><p className="micro-label">NO-TOUCH OPERATION</p><h1>自動投影</h1></div>
            <span className="operator-state">自動受付中</span>
          </div>

          <section className={`current-command ${current ? "active" : ""}`}>
            <p className="micro-label">CURRENT SIGNAL</p>
            {current ? (
              <>
                <span className={`request-mode request-mode-${current.gameMode || "control"}`}>{current.gameMode === "mischief" ? "おまかせ＋邪魔" : "完全操縦"}</span>
                <div className="command-big"><span>穴</span><strong>{String(current.hole).padStart(2, "0")}</strong><em>{ACTIONS[current.action!].label}</em></div>
                <p>{ACTIONS[current.action!].instruction}</p>
              </>
            ) : (
              <div className="empty-command"><span>○</span><p>操作は不要です<br />次の光を自動で待っています</p></div>
            )}
          </section>

          <p className="auto-dismiss-note">届いた光は約1.8秒ずつ表示されます。連続タップは順番待ちに入り、同じ場所への指示も毎回光ります。</p>
          {queue.length > 0 && <p className="auto-queue-count">次の合図　{queue.length}件</p>}

          <details className="calibration-panel" open={calibration}>
            <summary onClick={event => { event.preventDefault(); setCalibration(value => !value); }}>
              <span>設営時の位置合わせ</span><b>{calibration ? "閉じる" : "開く"}</b>
            </summary>
            {calibration && (
              <div className="calibration-controls">
                <div className="test-actions">
                  {(["batter", "turn", "serve"] as ActionKind[]).map(kind => <button className={testAction === kind ? "active" : ""} key={kind} onClick={() => setTestAction(kind)}>{ACTIONS[kind].short}</button>)}
                </div>
                <label><span>左右 <b>{transform.x}px</b></span><input type="range" min="-240" max="240" value={transform.x} onChange={event => updateTransform("x", Number(event.target.value))} /></label>
                <label><span>上下 <b>{transform.y}px</b></span><input type="range" min="-160" max="160" value={transform.y} onChange={event => updateTransform("y", Number(event.target.value))} /></label>
                <label><span>大きさ <b>{transform.scale.toFixed(2)}</b></span><input type="range" min="0.55" max="1.45" step="0.01" value={transform.scale} onChange={event => updateTransform("scale", Number(event.target.value))} /></label>
                <label><span>回転 <b>{transform.rotate}°</b></span><input type="range" min="-25" max="25" value={transform.rotate} onChange={event => updateTransform("rotate", Number(event.target.value))} /></label>
                <Link className="open-debug-link" href="/debug" target="_blank">20穴を個別に調整する ↗</Link>
                <button className="reset-calibration" onClick={() => { setTransform(DEFAULT_TRANSFORM); localStorage.removeItem("tako-projector-transform"); }}>全体位置をリセット</button>
              </div>
            )}
          </details>

          <button className="projector-button" onClick={enterProjector}>投影を全画面にする <span>↗</span></button>
          <p className="operator-hint">全画面にしたあとは操作不要です。Escで戻ります。</p>
        </aside>
      </section>
    </main>
  );
}
