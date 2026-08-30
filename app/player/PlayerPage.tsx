"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConnectionPill } from "../components/ConnectionPill";
import { SignalPlate } from "../components/SignalPlate";
import { useSignalChannel } from "../hooks/useSignalChannel";
import {
  ACTIONS,
  DEFAULT_ROOM,
  createMessage,
  sanitizeRoom,
  type ActionKind,
  type SignalMessage,
} from "../lib/takoyaki";

type PendingState = {
  requestId: string;
  hole: number;
  action: ActionKind;
  status: "sending" | "accepted";
};

export default function PlayerPage() {
  const [room, setRoom] = useState(DEFAULT_ROOM);
  const [roomInput, setRoomInput] = useState(DEFAULT_ROOM);
  const [streamId, setStreamId] = useState("");
  const [selectedHole, setSelectedHole] = useState(6);
  const [action, setAction] = useState<ActionKind>("turn");
  const [pending, setPending] = useState<PendingState | null>(null);
  const [lastResult, setLastResult] = useState<{ hole: number; status: "completed" | "skipped" } | null>(null);
  const [kitchenSeen, setKitchenSeen] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [, setClock] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialRoom = sanitizeRoom(params.get("room") || localStorage.getItem("tako-room") || DEFAULT_ROOM);
    const initialStream = params.get("stream") || localStorage.getItem("tako-stream") || "";
    setRoom(initialRoom);
    setRoomInput(initialRoom);
    setStreamId(initialStream);
  }, []);

  const onMessage = useCallback((message: SignalMessage) => {
    if (message.role === "kitchen" && message.kind === "presence") setKitchenSeen(Date.now());
    if (message.kind === "accepted" && message.requestId) {
      setPending(current => {
        if (!current || current.requestId !== message.requestId) return current;
        return { ...current, status: "accepted" };
      });
    }
    if ((message.kind === "completed" || message.kind === "skipped") && message.requestId) {
      const outcome = message.kind;
      setPending(current => {
        if (!current || current.requestId !== message.requestId) return current;
        setLastResult({ hole: current.hole, status: outcome });
        return null;
      });
    }
  }, []);

  const { connection, send } = useSignalChannel(room, onMessage);
  const kitchenOnline = Date.now() - kitchenSeen < 8000;

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 2000);
    return () => clearInterval(timer);
  }, []);

  const submit = () => {
    if (pending) return;
    const message = createMessage("request", "player", room, { hole: selectedHole, action });
    setPending({ requestId: message.id, hole: selectedHole, action, status: "sending" });
    setLastResult(null);
    send(message);
  };

  const applyRoom = () => {
    const next = sanitizeRoom(roomInput);
    setRoom(next);
    setRoomInput(next);
    localStorage.setItem("tako-room", next);
    history.replaceState(null, "", `/player?room=${encodeURIComponent(next)}`);
  };

  const saveStream = (value: string) => {
    setStreamId(value);
    localStorage.setItem("tako-stream", value);
  };

  const statusText = useMemo(() => {
    if (pending?.status === "accepted") return `穴 ${pending.hole}：職人が実行中`;
    if (pending) return `穴 ${pending.hole}：光の指示を送信中`;
    if (lastResult?.status === "completed") return `穴 ${lastResult.hole}：完了しました`;
    if (lastResult?.status === "skipped") return `穴 ${lastResult.hole}：今回はスキップ`;
    return "穴と動作を選んでください";
  }, [pending, lastResult]);

  return (
    <main className="app-shell player-shell">
      <header className="app-header">
        <Link href="/" className="wordmark"><span className="wordmark-dot" />TAKO SIGNAL</Link>
        <div className="header-center"><span>PLAYER</span><b>/</b><span>ROOM {room.toUpperCase()}</span></div>
        <div className="header-actions">
          <ConnectionPill connection={connection} />
          <button className="icon-button" onClick={() => setSettingsOpen(value => !value)} aria-label="設定を開く">⚙</button>
        </div>
      </header>

      {settingsOpen && (
        <section className="settings-drawer">
          <label><span>ルームID</span><div className="inline-field"><input value={roomInput} onChange={event => setRoomInput(event.target.value)} /><button onClick={applyRoom}>接続</button></div></label>
          <label><span>VDO.Ninja Stream ID</span><input value={streamId} onChange={event => saveStream(event.target.value)} placeholder="例：tako-camera-01" /></label>
          <div className="settings-note">調理場画面も同じルームIDにします。Stream IDが空の場合はシミュレーション映像を表示します。</div>
        </section>
      )}

      <section className="player-workspace">
        <div className="live-panel">
          <div className="panel-heading">
            <div><p className="micro-label">LIVE / OSAKA KITCHEN</p><h1>焼き場のいま</h1></div>
            <span className={`kitchen-presence ${kitchenOnline ? "present" : ""}`}><i />{kitchenOnline ? "職人接続中" : "職人画面を待機中"}</span>
          </div>

          <SignalPlate
            streamId={streamId}
            selectedHole={selectedHole}
            activeHole={pending?.hole}
            activeAction={pending?.action}
            interactive
            onSelect={setSelectedHole}
          />

          <div className={`activity-banner ${pending ? "is-busy" : ""} ${lastResult?.status || ""}`}>
            <span className="activity-index">{pending ? "●" : lastResult ? "✓" : "○"}</span>
            <div><small>STATUS</small><strong>{statusText}</strong></div>
          </div>
        </div>

        <aside className="control-panel">
          <div className="control-step">
            <span className="step-index">01</span>
            <div><p className="micro-label">SELECT ACTION</p><h2>動作を選ぶ</h2></div>
          </div>

          <div className="action-tabs">
            {(Object.keys(ACTIONS) as ActionKind[]).map(kind => (
              <button className={action === kind ? "active" : ""} key={kind} onClick={() => setAction(kind)}>
                <span>{ACTIONS[kind].short}</span>{ACTIONS[kind].label}
              </button>
            ))}
          </div>

          <div className="control-step second-step">
            <span className="step-index">02</span>
            <div><p className="micro-label">SELECT POSITION</p><h2>穴を選ぶ</h2></div>
          </div>

          <div className="hole-keypad">
            {Array.from({ length: 16 }, (_, index) => index + 1).map(hole => (
              <button className={selectedHole === hole ? "active" : ""} key={hole} onClick={() => setSelectedHole(hole)} aria-label={`穴 ${hole}`}>
                {String(hole).padStart(2, "0")}
              </button>
            ))}
          </div>

          <div className="command-summary">
            <span>COMMAND</span>
            <strong>HOLE {String(selectedHole).padStart(2, "0")} / {ACTIONS[action].short}</strong>
          </div>

          <button className="send-command" onClick={submit} disabled={Boolean(pending)}>
            <span>{pending ? "実行を待っています" : "光の指示を送る"}</span><b aria-hidden="true">→</b>
          </button>

          <Link className="open-kitchen-link" href={`/kitchen?room=${room}`} target="_blank">調理場画面を別タブで開く ↗</Link>
        </aside>
      </section>
    </main>
  );
}
