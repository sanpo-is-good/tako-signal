"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConnectionPill } from "../components/ConnectionPill";
import { PlayerControls } from "../components/PlayerControls";
import { SignalPlate } from "../components/SignalPlate";
import { useSignalChannel } from "../hooks/useSignalChannel";
import {
  ACTIONS,
  CONTROL_ACTIONS,
  DEFAULT_ROOM,
  HOLE_OFFSETS_KEY,
  createMessage,
  parseHoleOffsets,
  sanitizeRoom,
  type ActionKind,
  type GameMode,
  type HoleOffsets,
  type SignalMessage,
} from "../lib/takoyaki";

type PendingState = {
  requestId: string;
  hole: number;
  action: ActionKind;
  gameMode: GameMode;
  status: "sending" | "accepted";
};

export default function PlayerPage() {
  const [room, setRoom] = useState(DEFAULT_ROOM);
  const [roomInput, setRoomInput] = useState(DEFAULT_ROOM);
  const [streamId, setStreamId] = useState("takokuri1");
  const [selectedHole, setSelectedHole] = useState(6);
  const [mode, setMode] = useState<GameMode>("control");
  const [action, setAction] = useState<ActionKind>("batter");
  const [recipeProgress, setRecipeProgress] = useState<ActionKind[]>([]);
  const [holeOffsets, setHoleOffsets] = useState<HoleOffsets>({});
  const [pending, setPending] = useState<PendingState | null>(null);
  const [lastResult, setLastResult] = useState<{ hole: number; status: "completed" | "skipped" } | null>(null);
  const [kitchenSeen, setKitchenSeen] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [, setClock] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialRoom = sanitizeRoom(params.get("room") || localStorage.getItem("tako-room") || DEFAULT_ROOM);
    const initialStream = params.get("stream") || localStorage.getItem("tako-stream") || "takokuri1";
    setRoom(initialRoom);
    setRoomInput(initialRoom);
    setStreamId(initialStream);
    setHoleOffsets(parseHoleOffsets(localStorage.getItem(HOLE_OFFSETS_KEY)));
    const savedMode = localStorage.getItem("tako-game-mode");
    if (savedMode === "control" || savedMode === "mischief") {
      setMode(savedMode);
      setAction(savedMode === "control" ? "batter" : "mischiefSpin");
    }
    const syncOffsets = (event: StorageEvent) => {
      if (event.key === HOLE_OFFSETS_KEY) setHoleOffsets(parseHoleOffsets(event.newValue));
    };
    window.addEventListener("storage", syncOffsets);
    return () => window.removeEventListener("storage", syncOffsets);
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
        if (outcome === "completed" && current.gameMode === "control" && CONTROL_ACTIONS.includes(current.action)) {
          setRecipeProgress(items => items.includes(current.action) ? items : [...items, current.action]);
        }
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
    const message = createMessage("request", "player", room, { hole: selectedHole, action, gameMode: mode });
    setPending({ requestId: message.id, hole: selectedHole, action, gameMode: mode, status: "sending" });
    setLastResult(null);
    send(message);
  };

  const changeMode = (nextMode: GameMode) => {
    setMode(nextMode);
    setAction(nextMode === "control" ? "batter" : "mischiefSpin");
    setLastResult(null);
    localStorage.setItem("tako-game-mode", nextMode);
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
    return mode === "control" ? "レシピの一手と穴を選んでください" : "邪魔の合図と穴を選んでください";
  }, [pending, lastResult, mode]);

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
          <label><span>VDO.Ninja Stream ID</span><input value={streamId} onChange={event => saveStream(event.target.value)} placeholder="takokuri1" /></label>
          <div className="settings-note">標準映像は takokuri1 です。調理場画面も同じルームIDにします。Stream IDが空の場合はシミュレーション映像を表示します。</div>
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
            holeOffsets={holeOffsets}
          />

          <div className={`activity-banner ${pending ? "is-busy" : ""} ${lastResult?.status || ""}`}>
            <span className="activity-index">{pending ? "●" : lastResult ? "✓" : "○"}</span>
            <div><small>STATUS</small><strong>{statusText}</strong></div>
          </div>
        </div>

        <PlayerControls
          mode={mode}
          action={action}
          selectedHole={selectedHole}
          pending={Boolean(pending)}
          progress={recipeProgress}
          room={room}
          onModeChange={changeMode}
          onActionChange={setAction}
          onHoleChange={setSelectedHole}
          onSend={submit}
        />
      </section>
    </main>
  );
}
