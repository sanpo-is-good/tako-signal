"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConnectionPill } from "../components/ConnectionPill";
import { PlayerControls } from "../components/PlayerControls";
import { SignalPlate } from "../components/SignalPlate";
import { useSignalChannel } from "../hooks/useSignalChannel";
import {
  ACTIONS,
  DEFAULT_ROOM,
  HOLE_OFFSETS_KEY,
  TRACE_CUE_DURATION_MS,
  createMessage,
  parseHoleOffsets,
  sanitizeRoom,
  supportsTrace,
  type ActionKind,
  type GameMode,
  type HoleOffsets,
} from "../lib/takoyaki";

type SentSignal = { id: string; hole: number; action: ActionKind };

export default function PlayerPage() {
  const [room, setRoom] = useState(DEFAULT_ROOM);
  const [roomInput, setRoomInput] = useState(DEFAULT_ROOM);
  const [streamId, setStreamId] = useState("takokuri1");
  const [selectedHole, setSelectedHole] = useState<number>();
  const [mode, setMode] = useState<GameMode>("control");
  const [action, setAction] = useState<ActionKind>("batter");
  const [holeOffsets, setHoleOffsets] = useState<HoleOffsets>({});
  const [sentSignal, setSentSignal] = useState<SentSignal | null>(null);
  const [traceCues, setTraceCues] = useState<SentSignal[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialRoom = sanitizeRoom(params.get("room") || localStorage.getItem("tako-room") || DEFAULT_ROOM);
    setRoom(initialRoom);
    setRoomInput(initialRoom);
    setStreamId(params.get("stream") || localStorage.getItem("tako-stream") || "takokuri1");
    setHoleOffsets(parseHoleOffsets(localStorage.getItem(HOLE_OFFSETS_KEY)));
    const onStorage = (event: StorageEvent) => {
      if (event.key === HOLE_OFFSETS_KEY) setHoleOffsets(parseHoleOffsets(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!sentSignal) return;
    const timer = window.setTimeout(() => setSentSignal(null), supportsTrace(sentSignal.action) ? TRACE_CUE_DURATION_MS : 1200);
    return () => window.clearTimeout(timer);
  }, [sentSignal]);

  const { connection, send } = useSignalChannel(room, () => {});

  const sendOpinion = (hole: number) => {
    const message = createMessage("request", "player", room, { hole, action, gameMode: mode });
    send(message);
    if (mode === "control" && supportsTrace(action)) {
      const cue = { id: message.id, hole, action };
      setTraceCues(cues => [...cues.filter(item => item.hole !== hole), cue]);
      window.setTimeout(() => setTraceCues(cues => cues.filter(item => item.id !== message.id)), TRACE_CUE_DURATION_MS);
    }
    setSelectedHole(hole);
    setSentSignal({ id: message.id, hole, action });
  };

  const changeMode = (nextMode: GameMode) => {
    setMode(nextMode);
    setAction(nextMode === "control" ? "batter" : "mischiefSpin");
    setSelectedHole(undefined);
    setTraceCues([]);
  };

  const changeAction = (nextAction: ActionKind) => {
    setAction(nextAction);
    setSelectedHole(undefined);
  };

  const applySettings = () => {
    const next = sanitizeRoom(roomInput);
    setRoom(next);
    localStorage.setItem("tako-room", next);
    localStorage.setItem("tako-stream", streamId);
    setSettingsOpen(false);
  };

  const traceMode = !settingsOpen && mode === "control" && supportsTrace(action);

  return (
    <main className="tk-cooking">
      <header className="tk-gamebar">
        <div className="tk-life"><span>ライフ</span><b aria-label="ライフ10">♥♥♥♥♥♥♥♥♥♥</b><small>10 / 10</small></div>
        <div className="tk-connection"><ConnectionPill connection={connection} /><span>職人へ即時送信</span></div>
        <div className="tk-gamebar-actions">
          <button onClick={() => setSettingsOpen(value => !value)} aria-label="接続設定">•••</button>
          <Link href="/">ゲームをやめる</Link>
        </div>
      </header>

      {settingsOpen && (
        <section className="tk-settings">
          <label>ROOM<input value={roomInput} onChange={event => setRoomInput(event.target.value)} /></label>
          <label>VDO.NINJA STREAM<input value={streamId} onChange={event => setStreamId(event.target.value)} /></label>
          <button onClick={applySettings}>反映する</button>
          <Link href="/debug">横5×縦4 位置調整 ↗</Link>
          <Link href={`/kitchen?room=${encodeURIComponent(room)}`}>投映画面 ↗</Link>
        </section>
      )}

      <section className="tk-cooking-stage">
        <div className="tk-video-label"><span><i /> LIVE</span><b>CAM 01 · 職人の手元</b></div>
        <SignalPlate
          streamId={streamId}
          videoEnabled
          selectedHole={selectedHole}
          activeHole={traceMode ? undefined : sentSignal?.hole}
          activeCues={traceCues}
          activeAction={sentSignal?.action}
          cueId={sentSignal?.id}
          interactive={!settingsOpen}
          interactionDisabled={settingsOpen}
          traceMode={traceMode}
          onSelect={sendOpinion}
          holeOffsets={holeOffsets}
        />
        <div className="tk-last-signal">
          <span>最後の指示：<b>{sentSignal ? ACTIONS[sentSignal.action].label : "—"}</b></span>
          <strong>{sentSignal ? `穴 ${String(sentSignal.hole).padStart(2, "0")} に送信しました` : "映像の穴をタップ"}</strong>
        </div>
      </section>

      <PlayerControls mode={mode} action={action} onModeChange={changeMode} onActionChange={changeAction} />
    </main>
  );
}
