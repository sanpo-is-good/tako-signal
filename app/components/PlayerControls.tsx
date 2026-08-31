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
  selectedHole: number;
  signalSent: boolean;
  progress: ActionKind[];
  onModeChange: (mode: GameMode) => void;
  onActionChange: (action: ActionKind) => void;
  onHoleChange: (hole: number) => void;
  onSend: () => void;
}

export function PlayerControls({
  mode,
  action,
  selectedHole,
  signalSent,
  progress,
  onModeChange,
  onActionChange,
  onHoleChange,
  onSend,
}: PlayerControlsProps) {
  const actions = mode === "control" ? CONTROL_ACTIONS : MISCHIEF_ACTIONS;
  const recommended = CONTROL_ACTIONS.find(kind => !progress.includes(kind));

  return (
    <aside className={`customer-console mode-${mode}`}>
      <div className="touch-mode-switch" role="group" aria-label="遊び方">
        <button className={mode === "control" ? "active" : ""} onClick={() => onModeChange("control")} aria-pressed={mode === "control"}>
          <span>操</span><strong>完全操縦</strong>
        </button>
        <button className={mode === "mischief" ? "active" : ""} onClick={() => onModeChange("mischief")} aria-pressed={mode === "mischief"}>
          <span>遊</span><strong>おまかせ＋邪魔</strong>
        </button>
      </div>

      {mode === "control" && (
        <div className="touch-recipe">
          <div><span>つくる順番</span><strong>{recommended ? `次は「${ACTIONS[recommended].label}」` : "完成！"}</strong></div>
          <div className="touch-recipe-dots">
            {CONTROL_ACTIONS.map((kind, index) => (
              <button
                key={kind}
                className={`${progress.includes(kind) ? "done" : ""} ${recommended === kind ? "next" : ""}`}
                onClick={() => onActionChange(kind)}
                aria-label={ACTIONS[kind].label}
              >
                <i>{progress.includes(kind) ? "✓" : index + 1}</i>
                <span>{ACTIONS[kind].glyph}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "mischief" && <p className="touch-mode-note">職人に任せながら、光でちょっとだけ邪魔しよう。</p>}

      <section className="touch-control-section">
        <h2><span>1</span>{mode === "control" ? "やることを選ぶ" : "邪魔を選ぶ"}</h2>
        <div className={`touch-action-grid ${mode === "mischief" ? "three-actions" : ""}`}>
          {actions.map(kind => (
            <button className={action === kind ? "active" : ""} key={kind} onClick={() => onActionChange(kind)} aria-pressed={action === kind}>
              <span className="action-glyph">{ACTIONS[kind].glyph}</span>
              <strong>{ACTIONS[kind].label}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="touch-control-section">
        <h2><span>2</span>光らせる穴を選ぶ</h2>
        <div className="touch-hole-grid">
          {Array.from({ length: 20 }, (_, index) => index + 1).map(hole => (
            <button className={selectedHole === hole ? "active" : ""} key={hole} onClick={() => onHoleChange(hole)} aria-pressed={selectedHole === hole} aria-label={`穴 ${hole}`}>
              {String(hole).padStart(2, "0")}
            </button>
          ))}
        </div>
      </section>

      <button className={`touch-send ${signalSent ? "sent" : ""}`} onClick={onSend}>
        <span>{signalSent ? "光らせました" : mode === "control" ? "この一手を光らせる" : "この邪魔を光らせる"}</span>
        <b aria-hidden="true">{signalSent ? "✓" : "→"}</b>
      </button>
      <p className="touch-watch-note">送ったあとは、ライブ映像で職人の動きを見よう</p>
    </aside>
  );
}
