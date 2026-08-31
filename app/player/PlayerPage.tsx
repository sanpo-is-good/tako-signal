"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
} from "../lib/takoyaki";

type SentSignal = {
  hole: number;
  action: ActionKind;
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
  const [sentSignal, setSentSignal] = useState<SentSignal | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  useEffect(() => {
    if (!sentSignal) return;
    const timer = window.setTimeout(() => setSentSignal(null), 1600);
    return () => window.clearTimeout(timer);
  }, [sentSignal]);

  const { connection, send } = useSignalChannel(room, () => {});

  const submit = () => {
    const message = createMessage("request", "player", room, { hole: selectedHole, action, gameMode: mode });
    send(message);
    setSentSignal({ hole: selectedHole, action });

    if (mode === "control" && CONTROL_ACTIONS.includes(action)) {
      setRecipeProgress(items => items.includes(action) ? items : [...items, action]);
      const index = CONTROL_ACTIONS.indexOf(action);
      const next = CONTROL_ACTIONS[index + 1];
      if (next) setAction(next);
    }
  };

  const changeMode = (nextMode: GameMode) => {
    setMode(nextMode);
    setAction(nextMode === "control" ? "batter" : "mischiefSpin");
    setRecipeProgress([]);
    setSentSignal(null);
    localStorage.setItem("tako-game-mode", nextMode);
  };

  const changeHole = (hole: number) => {
    if (hole !== selectedHole && mode === "control") {
      setRecipeProgress([]);
      setAction("batter");
    }
    setSelectedHole(hole);
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

  return (
    <main className="app-shell player-shell ipad-player">
      <header className="app-header">
        <Link href="/" className="wordmark"><span className="wordmark-dot" />TAKO SIGNAL</Link>
        <div className="header-center"><span>TOUCH PLAYER</span><b>/</b><span>ROOM {room.toUpperCase()}</span></div>
        <div className="header-actions">
          <ConnectionPill connection={connection} />
          <button className="icon-button" onClick={() => setSettingsOpen(value => !value)} aria-label="設定を開く">⚙</button>
        </div>
      </header>

      {settingsOpen && (
        <section className="settings-drawer">
          <label><span>ルームID</span><div className="inline-field"><input value={roomInput} onChange={event => setRoomInput(event.target.value)} /><button onClick={applyRoom}>接続</button></div></label>
          <label><span>VDO.Ninja Stream ID</span><input value={streamId} onChange={event => saveStream(event.target.value)} placeholder="takokuri1" /></label>
          <div className="settings-note">位置調整画面と投影画面も同じルームIDを使います。</div>
        </section>
      )}

      <section className="player-workspace">
        <div className="live-panel">
          <div className="panel-heading">
            <div><p className="micro-label">LIVE TAKOYAKI</p><h1>映像を見て、光で動かす</h1></div>
            <span className="touch-guide">穴をタップして選べます</span>
          </div>

          <SignalPlate
            streamId={streamId}
            selectedHole={selectedHole}
            activeHole={sentSignal?.hole}
            activeAction={sentSignal?.action}
            interactive
            onSelect={changeHole}
            holeOffsets={holeOffsets}
          />

          <div className={`activity-banner touch-status ${sentSignal ? "is-busy" : ""}`}>
            <span className="activity-index">{sentSignal ? "✓" : "○"}</span>
            <div>
              <small>{sentSignal ? "SIGNAL SENT" : "READY"}</small>
              <strong>{sentSignal ? `穴 ${sentSignal.hole}を「${ACTIONS[sentSignal.action].label}」で光らせました` : "ライブ映像を見ながら操作してください"}</strong>
            </div>
          </div>
        </div>

        <PlayerControls
          mode={mode}
          action={action}
          selectedHole={selectedHole}
          signalSent={Boolean(sentSignal)}
          progress={recipeProgress}
          onModeChange={changeMode}
          onActionChange={setAction}
          onHoleChange={changeHole}
          onSend={submit}
        />
      </section>
    </main>
  );
}
