"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

const LIVE_LOCK_KEY = "tako-live-lock";

type SentSignal = {
  id: string;
  hole: number;
  action: ActionKind;
};

export default function PlayerPage() {
  const [room, setRoom] = useState(DEFAULT_ROOM);
  const [roomInput, setRoomInput] = useState(DEFAULT_ROOM);
  const [streamId, setStreamId] = useState("takokuri1");
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [selectedHole, setSelectedHole] = useState<number>();
  const [mode, setMode] = useState<GameMode>("control");
  const [action, setAction] = useState<ActionKind>("batter");
  const [holeOffsets, setHoleOffsets] = useState<HoleOffsets>({});
  const [sentSignal, setSentSignal] = useState<SentSignal | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsLocked, setSettingsLocked] = useState(false);
  const unlockTimer = useRef<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialRoom = sanitizeRoom(params.get("room") || localStorage.getItem("tako-room") || DEFAULT_ROOM);
    const initialStream = params.get("stream") || localStorage.getItem("tako-stream") || "takokuri1";
    setRoom(initialRoom);
    setRoomInput(initialRoom);
    setStreamId(initialStream);
    setSettingsLocked(localStorage.getItem(LIVE_LOCK_KEY) === "1");
    setHoleOffsets(parseHoleOffsets(localStorage.getItem(HOLE_OFFSETS_KEY)));
    const savedMode = localStorage.getItem("tako-game-mode");
    if (savedMode === "control" || savedMode === "mischief") {
      setMode(savedMode);
      setAction(savedMode === "control" ? "batter" : "mischiefSpin");
    }
    const syncOffsets = (event: StorageEvent) => {
      if (event.key === HOLE_OFFSETS_KEY) setHoleOffsets(parseHoleOffsets(event.newValue));
      if (event.key === LIVE_LOCK_KEY) {
        const locked = event.newValue === "1";
        setSettingsLocked(locked);
        if (locked) setSettingsOpen(false);
      }
    };
    window.addEventListener("storage", syncOffsets);
    return () => window.removeEventListener("storage", syncOffsets);
  }, []);

  useEffect(() => {
    if (!sentSignal) return;
    const timer = window.setTimeout(() => setSentSignal(null), 900);
    return () => window.clearTimeout(timer);
  }, [sentSignal]);

  useEffect(() => () => {
    if (unlockTimer.current !== null) window.clearTimeout(unlockTimer.current);
  }, []);

  const { connection, send } = useSignalChannel(room, () => {});

  const sendOpinion = (hole: number) => {
    const message = createMessage("request", "player", room, { hole, action, gameMode: mode });
    send(message);
    setSelectedHole(hole);
    setSentSignal({ id: message.id, hole, action });
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
    const basePath = window.location.pathname.startsWith("/tako-signal/") ? "/tako-signal" : "";
    history.replaceState(null, "", `${basePath}/player?room=${encodeURIComponent(next)}`);
  };

  const saveStream = (value: string) => {
    setStreamId(value);
    setVideoEnabled(false);
    localStorage.setItem("tako-stream", value);
  };

  const toggleVideo = () => {
    if (!streamId.trim()) return;
    setVideoEnabled(value => !value);
  };

  const enableLiveLock = () => {
    localStorage.setItem(LIVE_LOCK_KEY, "1");
    setSettingsLocked(true);
    setSettingsOpen(false);
  };

  const disableLiveLock = () => {
    localStorage.removeItem(LIVE_LOCK_KEY);
    setSettingsLocked(false);
  };

  const startUnlockPress = () => {
    if (unlockTimer.current !== null) window.clearTimeout(unlockTimer.current);
    unlockTimer.current = window.setTimeout(() => {
      disableLiveLock();
      unlockTimer.current = null;
    }, 2000);
  };

  const cancelUnlockPress = () => {
    if (unlockTimer.current !== null) window.clearTimeout(unlockTimer.current);
    unlockTimer.current = null;
  };

  return (
    <main className="app-shell player-shell ipad-player opinion-player">
      <header className="app-header show-header player-show-header">
        <div className="show-header__brand">
          <span className="show-header__mascot" aria-hidden="true">🐙</span>
          <div className="show-header__brand-copy">
            {settingsLocked ? (
              <span className="wordmark"><span className="wordmark-dot" />TAKO SIGNAL</span>
            ) : (
              <Link href="/" className="wordmark"><span className="wordmark-dot" />TAKO SIGNAL</Link>
            )}
            <span className="show-header__subtitle">TAKOYAKI CONTROL CONSOLE</span>
          </div>
        </div>

        <div className="show-header__center">
          <span className="show-chip">ROOM {room.toUpperCase()}</span>
          <span className={`show-chip ${settingsLocked ? "live" : "setup"}`}>{settingsLocked ? "LIVE LOCK" : "SETUP"}</span>
        </div>

        <div className="show-header__actions">
          <ConnectionPill connection={connection} />
          {settingsLocked ? (
            <button
              className="show-live-unlock"
              onPointerDown={startUnlockPress}
              onPointerUp={cancelUnlockPress}
              onPointerCancel={cancelUnlockPress}
              onPointerLeave={cancelUnlockPress}
              aria-label="2秒長押しで本番モードを解除"
            >
              <strong>LIVE 🔒</strong>
              <small>2秒長押しで解除</small>
            </button>
          ) : (
            <button className="show-settings-button" onClick={() => setSettingsOpen(value => !value)} aria-label="設定を開く">⚙</button>
          )}
        </div>
      </header>

      {settingsOpen && !settingsLocked && (
        <section className="settings-drawer">
          <label><span>ルームID</span><div className="inline-field"><input value={roomInput} onChange={event => setRoomInput(event.target.value)} /><button onClick={applyRoom}>接続</button></div></label>
          <label>
            <span>VDO.Ninja Stream ID</span>
            <div className="inline-field">
              <input value={streamId} onChange={event => saveStream(event.target.value)} placeholder="takokuri1" />
              <button onClick={toggleVideo} disabled={!streamId.trim()}>{videoEnabled ? "映像を停止" : "映像を再生"}</button>
            </div>
          </label>
          <div className="settings-note">
            {videoEnabled ? "ライブ映像を再生中です。設定を開いている間は映像上の再生ボタンを直接操作できます。" : "Stream IDを確認して「映像を再生」を押してください。"}
            {" "}位置調整画面と投影画面も同じルームIDを使います。 <Link href="/tutorial">遊び方を見る</Link>
          </div>
          <div className="show-settings-footer">
            <p>本番モードにすると設定を閉じ、⚙を隠して誤操作を防ぎます。解除はヘッダーの LIVE LOCK を2秒長押しします。</p>
            <button className="show-live-lock-button" onClick={enableLiveLock}>🔒 本番モードを開始</button>
          </div>
        </section>
      )}

      <section className="player-workspace">
        <div className="live-panel opinion-live-panel">
          <div className="opinion-plate-frame">
            <SignalPlate
              streamId={streamId}
              videoEnabled={videoEnabled}
              selectedHole={selectedHole}
              activeHole={sentSignal?.hole}
              activeAction={sentSignal?.action}
              cueId={sentSignal?.id}
              interactive={!settingsOpen}
              interactionDisabled={settingsOpen}
              traceMode={!settingsOpen && action === "batter"}
              onSelect={sendOpinion}
              holeOffsets={holeOffsets}
            />
          </div>

        </div>

        <PlayerControls
          mode={mode}
          action={action}
          onModeChange={changeMode}
          onActionChange={setAction}
        />
      </section>
    </main>
  );
}
