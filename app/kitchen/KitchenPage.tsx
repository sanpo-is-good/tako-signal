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
  createMessage,
  parseHoleOffsets,
  sanitizeRoom,
  type ActionKind,
  type HoleOffsets,
  type SignalMessage,
} from "../lib/takoyaki";

type TransformState = { x: number; y: number; scale: number; rotate: number };
const DEFAULT_TRANSFORM: TransformState = { x: 0, y: 0, scale: 1, rotate: 0 };

export default function KitchenPage() {
  const [room, setRoom] = useState(DEFAULT_ROOM);
  const [roomInput, setRoomInput] = useState(DEFAULT_ROOM);
  const [queue, setQueue] = useState<SignalMessage[]>([]);
  const [current, setCurrent] = useState<SignalMessage | null>(null);
  const [history, setHistory] = useState<SignalMessage[]>([]);
  const [paused, setPaused] = useState(false);
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
    if (savedTransform) {
      try { setTransform({ ...DEFAULT_TRANSFORM, ...JSON.parse(savedTransform) }); } catch { /* use defaults */ }
    }
  }, []);
  useEffect(() => {
    setHoleOffsets(parseHoleOffsets(localStorage.getItem(HOLE_OFFSETS_KEY)));
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

  const { connection, send } = useSignalChannel(room, onMessage);

  useEffect(() => {
    const announce = () => send(createMessage("presence", "kitchen", room));
    announce();
    const timer = setInterval(announce, 3000);
    return () => clearInterval(timer);
  }, [room, send]);

  useEffect(() => {
    if (paused || current || queue.length === 0) return;
    const next = queue[0];
    setQueue(items => items.slice(1));
    setCurrent(next);
    send(createMessage("accepted", "kitchen", room, {
      requestId: next.id,
      hole: next.hole,
      action: next.action,
      gameMode: next.gameMode,
    }));
  }, [paused, current, queue, room, send]);

  const finish = useCallback((kind: "completed" | "skipped") => {
    if (!current) return;
    send(createMessage(kind, "kitchen", room, {
      requestId: current.id,
      hole: current.hole,
      action: current.action,
      gameMode: current.gameMode,
    }));
    setHistory(items => [{ ...current, kind }, ...items].slice(0, 6));
    setCurrent(null);
  }, [current, room, send]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Space") { event.preventDefault(); finish("completed"); }
      if (event.code === "Escape" && current && !document.fullscreenElement) finish("skipped");
      if (event.code === "KeyP") setPaused(value => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, current]);

  useEffect(() => {
    const onFullscreen = () => setProjectorMode(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  const applyRoom = () => {
    const next = sanitizeRoom(roomInput);
    setRoom(next);
    setRoomInput(next);
    setQueue([]);
    setCurrent(null);
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

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    send(createMessage("paused", "kitchen", room, { paused: next }));
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
    <main className={`app-shell kitchen-shell ${projectorMode ? "projector-mode" : ""}`}>
      <header className="app-header kitchen-header">
        <Link href="/" className="wordmark"><span className="wordmark-dot" />TAKO SIGNAL</Link>
        <div className="header-center"><span>KITCHEN</span><b>/</b><span>ROOM {room.toUpperCase()}</span></div>
        <div className="header-actions">
          <ConnectionPill connection={connection} />
          <button className="icon-button" onClick={() => setSettingsOpen(value => !value)} aria-label="設定を開く">⚙</button>
        </div>
      </header>

      {settingsOpen && (
        <section className="settings-drawer kitchen-settings">
          <label><span>ルームID</span><div className="inline-field"><input value={roomInput} onChange={event => setRoomInput(event.target.value)} /><button onClick={applyRoom}>接続</button></div></label>
          <div className="settings-note">プレイヤー画面と同じルームIDを使います。SpaceキーまたはUSBフットスイッチで完了できます。</div>
        </section>
      )}

      <section className="kitchen-workspace">
        <div className="projection-stage">
          <div className="projection-meta">
            <span>PROJECTOR OUTPUT</span>
            <b>{current ? `HOLE ${String(current.hole).padStart(2, "0")} / ${ACTIONS[current.action!].short}` : calibration ? "CALIBRATION" : "STANDBY"}</b>
          </div>
          <SignalPlate
            activeHole={activeHole}
            activeAction={activeAction}
            calibration={calibration}
            interactive={calibration}
            onSelect={setTestHole}
            holeOffsets={holeOffsets}
            onHolePositionChange={calibration ? updateHoleOffset : undefined}
            transform={transform}
          />
          {paused && <div className="projection-paused">PAUSED</div>}
          {!current && !calibration && !paused && <div className="standby-mark"><span /><p>WAITING FOR SIGNAL</p></div>}
        </div>

        <aside className="operator-panel">
          <div className="operator-title">
            <div><p className="micro-label">OPERATOR CONSOLE</p><h1>職人コントロール</h1></div>
            <span className={paused ? "operator-state paused" : "operator-state"}>{paused ? "一時停止" : "受付中"}</span>
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
              <div className="empty-command"><span>○</span><p>プレイヤーからの<br />指示を待っています</p></div>
            )}
          </section>

          <div className="operator-buttons">
            <button className="complete-button" onClick={() => finish("completed")} disabled={!current}><span>完了</span><kbd>SPACE</kbd></button>
            <button className="skip-button" onClick={() => finish("skipped")} disabled={!current}>スキップ</button>
          </div>

          <button className={`pause-button ${paused ? "active" : ""}`} onClick={togglePause}>{paused ? "受付を再開する" : "新しい指示を一時停止"}</button>

          <section className="queue-section">
            <div className="queue-title"><span>次の指示</span><b>{queue.length}</b></div>
            <div className="queue-list">
              {queue.length === 0 ? <p>待機キューは空です</p> : queue.slice(0, 3).map(item => (
                <div key={item.id}><strong>{String(item.hole).padStart(2, "0")}</strong><span>{ACTIONS[item.action!].label}</span></div>
              ))}
            </div>
          </section>

          <details className="calibration-panel" open={calibration}>
            <summary onClick={event => { event.preventDefault(); setCalibration(value => !value); }}>
              <span>投影位置の校正</span><b>{calibration ? "閉じる" : "開く"}</b>
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
                <button className="reset-calibration" onClick={() => { setTransform(DEFAULT_TRANSFORM); localStorage.removeItem("tako-projector-transform"); }}>位置をリセット</button>
              </div>
            )}
          </details>

          <button className="projector-button" onClick={enterProjector}>投影を全画面にする <span>↗</span></button>
          <p className="operator-hint">全画面中も Space＝完了、P＝一時停止。Escで戻ります。</p>
        </aside>
      </section>
    </main>
  );
}
