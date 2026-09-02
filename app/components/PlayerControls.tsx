"use client";

import {
  ACTIONS,
  ACTION_ICONS,
  resolveAssetPath,
  CONTROL_ACTIONS,
  MISCHIEF_ACTIONS,
  type ActionKind,
  type GameMode,
} from "../lib/takoyaki";

interface PlayerControlsProps {
  mode: GameMode;
  action: ActionKind;
  onModeChange: (mode: GameMode) => void;
  onActionChange: (action: ActionKind) => void;
}

export function PlayerControls({ mode, action, onModeChange, onActionChange }: PlayerControlsProps) {
  const actions = mode === "control" ? CONTROL_ACTIONS : MISCHIEF_ACTIONS;

  return (
    <aside className={`customer-console icon-console mode-${mode}`}>
      <div className="touch-mode-switch minimal-mode-switch" role="group" aria-label="遊び方">
        <button className={mode === "control" ? "active" : ""} onClick={() => onModeChange("control")} aria-pressed={mode === "control"} aria-label="完全操縦">
          <span>操</span>
        </button>
        <button className={mode === "mischief" ? "active" : ""} onClick={() => onModeChange("mischief")} aria-pressed={mode === "mischief"} aria-label="おまかせ">
          <span>遊</span>
        </button>
      </div>

      <div className={`icon-action-grid ${mode === "mischief" ? "icon-actions-four" : ""}`}>
        {actions.map(kind => (
          <button className={action === kind ? "active" : ""} key={kind} onClick={() => onActionChange(kind)} aria-label={ACTIONS[kind].label} aria-pressed={action === kind}>
            <img src={resolveAssetPath(ACTION_ICONS[kind])} alt="" draggable={false} />
          </button>
        ))}
      </div>
    </aside>
  );
}
