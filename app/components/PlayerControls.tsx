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
    <aside className={`tk-command-console mode-${mode}`}>
      <div className="tk-mode-switch" role="group" aria-label="遊び方">
        <button className={mode === "control" ? "active" : ""} onClick={() => onModeChange("control")} aria-pressed={mode === "control"}>
          完全操縦
        </button>
        <button className={mode === "mischief" ? "active" : ""} onClick={() => onModeChange("mischief")} aria-pressed={mode === "mischief"}>
          おまかせ
        </button>
      </div>
      <div className="tk-command-grid">
        {actions.map(kind => (
          <button
            className={`tk-command ${action === kind ? "active" : ""} ${kind === "serve" ? "is-finish" : ""}`}
            key={kind}
            onPointerDown={event => { event.preventDefault(); onActionChange(kind); }}
            aria-label={ACTIONS[kind].label}
            aria-pressed={action === kind}
          >
            <img src={resolveAssetPath(ACTION_ICONS[kind])} alt="" draggable={false} />
            {kind === "add" && <b aria-hidden="true">＋</b>}
            <span>{ACTIONS[kind].label.replace("を入れる", "").replace("くるっと", "").replace("焼き上げる", "完成")}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
