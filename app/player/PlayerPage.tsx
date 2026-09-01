"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConnectionPill } from "../components/ConnectionPill";
import { PlayerControls } from "../components/PlayerControls";
import { SignalPlate } from "../components/SignalPlate";
import { useSignalChannel } from "../hooks/useSignalChannel";
import {
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
  const [selectedHole, setSelectedHole] = useState<number>();
  const [mode, setMode] = useState<GameMode>("control");
  const [action, setAction] = useState<ActionKind>("batter");
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
    const timer = window.setTimeout(() => setSentSignal(null), 1700);
    return () => window.clearTimeout(timer);
  }, [sentSignal]);

  const { connection, send } = useSignalChannel(room, () => {});

  const sendOpinion = (hole: number) => {
    const message = createMessage("request", "player", room, { hole, action, gameMode: mode });
    send(message);
    setSelectedHole(hole);
    setSentSignal({ hole, action });
  };

  const changeMode = (nextMode: GameMode) => {
    setMode(nextMode);
    setAction(nextMode === "control" ? "batter" : "mischiefSpin");
    setSelectedHole(undefined);
    setSentSignal(null);
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

  return (
    <main className="app-shell player-shell ipad-player opinion-player">
      <header className="app-header">
        <Link href="/" className="wordmark"><span className="wordmark-dot" />TAKO SIGNAL</Link>
        <div className="header-center"><span>TAP YOUR OPINION</span><b>/</b><span>ROOM {room.toUpperCase()}</span></div>
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
        <div className="live-panel opinion-live-panel">
          <div className="panel-heading">
            <div><p className="micro-label">TEPPAN 4 × 5 / LIVE</p><h1>意見を選んで、たこ焼きにタッチ</h1></div>
            <span className={`mode-chip mode-chip-${mode}`}>{mode === "control" ? "完全操縦" : "おまかせ"}</span>
          </div>

          <div className="opinion-plate-frame">
            <SignalPlate
              streamId={streamId}
              selectedHole={selectedHole}
              activeHole={sentSignal?.hole}
              activeAction={sentSignal?.action}
              interactive
              onSelect={sendOpinion}
              holeOffsets={holeOffsets}
            />
          </div>

          <div className="tap-live-hint">
            <span>◎</span>
            <p><strong>たこ焼きを直接タップ</strong><small>選んだ意見が、その場所の光になります</small></p>
          </div>
        </div>

        <PlayerControls
          mode={mode}
          action={action}
          lastHole={selectedHole}
          signalSent={Boolean(sentSignal)}
          onModeChange={changeMode}
          onActionChange={setAction}
        />
      </section>
    </main>
  );
}
