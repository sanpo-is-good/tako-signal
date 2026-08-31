"use client";

import Link from "next/link";
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
  pending: boolean;
  progress: ActionKind[];
  room: string;
  onModeChange: (mode: GameMode) => void;
  onActionChange: (action: ActionKind) => void;
  onHoleChange: (hole: number) => void;
  onSend: () => void;
}

export function PlayerControls({
  mode,
  action,
  selectedHole,
  pending,
  progress,
  room,
  onModeChange,
  onActionChange,
  onHoleChange,
  onSend,
}: PlayerControlsProps) {
  const actions = mode === "control" ? CONTROL_ACTIONS : MISCHIEF_ACTIONS;
  const recommended = CONTROL_ACTIONS.find(kind => !progress.includes(kind));

  return (
    <aside className={`control-panel customer-console mode-${mode}`}>
      <section className="mode-section">
        <div className="control-step">
          <span className="step-index">01</span>
          <div><p className="micro-label">CHOOSE YOUR PLAY</p><h2>遊び方を選ぶ</h2></div>
        </div>
        <div className="mode-cards">
          <button className={mode === "control" ? "active" : ""} onClick={() => onModeChange("control")} disabled={pending}>
            <span className="mode-glyph">操</span>
            <strong>完全操縦</strong>
            <small>材料から焼き上げまで、あなたが指示</small>
          </button>
          <button className={mode === "mischief" ? "active" : ""} onClick={() => onModeChange("mischief")} disabled={pending}>
            <span className="mode-glyph">遊</span>
            <strong>おまかせ＋邪魔</strong>
            <small>職人に任せつつ、楽しい無茶ぶり</small>
          </button>
        </div>
      </section>

      {mode === "control" ? (
        <section className="recipe-section">
          <div className="recipe-title"><span>たこ焼きレシピ</span><b>{progress.length} / {CONTROL_ACTIONS.length}</b></div>
          <div className="recipe-rail">
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
          <p>{recommended ? `次のおすすめ：${ACTIONS[recommended].label}` : "完成！別の穴でもう一個つくろう"}</p>
        </section>
      ) : (
        <section className="mischief-banner">
          <span>職人はいつも通り焼きます。</span>
          <strong>あなたは光で、ちょっとだけ邪魔できます。</strong>
        </section>
      )}

      <section className="action-section">
        <div className="control-step compact-step">
          <span className="step-index">02</span>
          <div><p className="micro-label">{mode === "control" ? "SELECT COOKING" : "SELECT MISCHIEF"}</p><h2>{mode === "control" ? "次の一手" : "どんな邪魔をする？"}</h2></div>
        </div>
        <div className={`action-choice-grid ${mode === "mischief" ? "mischief-actions" : ""}`}>
          {actions.map(kind => (
            <button className={action === kind ? "active" : ""} key={kind} onClick={() => onActionChange(kind)} disabled={pending}>
              <span className="action-glyph">{ACTIONS[kind].glyph}</span>
              <span><small>{ACTIONS[kind].short}</small><strong>{ACTIONS[kind].label}</strong></span>
            </button>
          ))}
        </div>
      </section>

      <section className="position-section">
        <div className="control-step compact-step">
          <span className="step-index">03</span>
          <div><p className="micro-label">SELECT POSITION</p><h2>光らせる穴</h2></div>
        </div>
        <div className="hole-keypad twenty-holes">
          {Array.from({ length: 20 }, (_, index) => index + 1).map(hole => (
            <button className={selectedHole === hole ? "active" : ""} key={hole} onClick={() => onHoleChange(hole)} aria-label={`穴 ${hole}`}>
              {String(hole).padStart(2, "0")}
            </button>
          ))}
        </div>
      </section>

      <div className="command-summary">
        <span>YOUR SIGNAL</span>
        <strong>HOLE {String(selectedHole).padStart(2, "0")} / {ACTIONS[action].short}</strong>
      </div>

      <button className="send-command customer-send" onClick={onSend} disabled={pending}>
        <span>{pending ? "職人が合図を確認中…" : mode === "control" ? "この一手を送る" : "邪魔する！"}</span>
        <b aria-hidden="true">→</b>
      </button>

      <div className="console-links">
        <Link href={`/kitchen?room=${room}`} target="_blank">職人画面 ↗</Link>
        <Link href="/debug" target="_blank">位置調整 ↗</Link>
      </div>
    </aside>
  );
}
