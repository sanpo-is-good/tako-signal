"use client";

import {
  ACTIONS,
  CONTROL_ACTIONS,
  MISCHIEF_ACTIONS,
  type ActionKind,
  type GameMode,
} from "../lib/takoyaki";

interface PlayerControlsProps {
  mode: GameMode;
  action: ActionKind;
  lastHole?: number;
  signalSent: boolean;
  onModeChange: (mode: GameMode) => void;
  onActionChange: (action: ActionKind) => void;
}

export function PlayerControls({
  mode,
  action,
  lastHole,
  signalSent,
  onModeChange,
  onActionChange,
}: PlayerControlsProps) {
  const actions = mode === "control" ? CONTROL_ACTIONS : MISCHIEF_ACTIONS;

  return (
    <aside className={`customer-console opinion-console mode-${mode}`}>
      <div className="touch-mode-switch" role="group" aria-label="遊び方">
        <button className={mode === "control" ? "active" : ""} onClick={() => onModeChange("control")} aria-pressed={mode === "control"}>
          <span>操</span><strong>完全操縦</strong>
        </button>
        <button className={mode === "mischief" ? "active" : ""} onClick={() => onModeChange("mischief")} aria-pressed={mode === "mischief"}>
          <span>遊</span><strong>おまかせ</strong>
        </button>
      </div>

      <div className="opinion-heading">
        <p>{mode === "control" ? "COOKING OPINION" : "YOUR OPINION"}</p>
        <h2>伝えたいことを選ぶ</h2>
      </div>

      <div className={`opinion-action-grid ${mode === "mischief" ? "opinion-actions-four" : ""}`}>
        {actions.map((kind, index) => (
          <button className={action === kind ? "active" : ""} key={kind} onClick={() => onActionChange(kind)} aria-pressed={action === kind}>
            <span className="opinion-step">{String(index + 1).padStart(2, "0")}</span>
            <span className="action-glyph">{ACTIONS[kind].glyph}</span>
            <strong>{ACTIONS[kind].label}</strong>
          </button>
        ))}
      </div>

      <div className={`tap-to-send ${signalSent ? "sent" : ""}`}>
        <span className="tap-symbol">{signalSent ? "✓" : "◎"}</span>
        <div>
          <small>{signalSent ? "OPINION SENT" : "NEXT"}</small>
          <strong>{signalSent && lastHole ? `穴 ${String(lastHole).padStart(2, "0")} に伝えました` : "映像のたこ焼きをタップ"}</strong>
        </div>
      </div>

      <p className="opinion-footnote">選んだ意見が、その場所の光になります</p>
    </aside>
  );
}
