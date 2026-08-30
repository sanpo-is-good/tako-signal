"use client";

import { ACTIONS, HOLES, type ActionKind } from "../lib/takoyaki";

interface PlateProps {
  activeHole?: number;
  activeAction?: ActionKind;
  selectedHole?: number;
  streamId?: string;
  interactive?: boolean;
  calibration?: boolean;
  onSelect?: (hole: number) => void;
  transform?: { x: number; y: number; scale: number; rotate: number };
}

export function SignalPlate({
  activeHole,
  activeAction = "turn",
  selectedHole,
  streamId,
  interactive = false,
  calibration = false,
  onSelect,
  transform,
}: PlateProps) {
  const hasVideo = Boolean(streamId?.trim());
  const videoUrl = hasVideo
    ? `https://vdo.ninja/?view=${encodeURIComponent(streamId!.trim())}&cleanoutput&autoplay&muted`
    : "";

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotate}deg)` }
    : undefined;

  return (
    <div className={`signal-plate ${hasVideo ? "has-video" : "simulated"}`} style={style}>
      <div className="plate-surface">
        {hasVideo ? (
          <iframe
            className="vdo-frame"
            src={videoUrl}
            title="VDO.Ninja たこ焼きライブ映像"
            allow="autoplay; fullscreen; camera; microphone"
          />
        ) : (
          <div className="simulated-feed" aria-label="映像未設定のシミュレーション">
            <span className="sim-light sim-light-one" />
            <span className="sim-light sim-light-two" />
            <span className="sim-caption">SIMULATED LIVE FEED</span>
          </div>
        )}

        <div className="hole-layer">
          {HOLES.map(hole => {
            const isActive = activeHole === hole.id;
            const isSelected = selectedHole === hole.id;
            const Element = interactive ? "button" : "div";
            return (
              <Element
                type={interactive ? "button" : undefined}
                className={`plate-hole ${isActive ? `cue-active cue-${activeAction}` : ""} ${isSelected ? "selected" : ""} ${calibration ? "calibration-hole" : ""}`}
                style={{ left: `${hole.x}%`, top: `${hole.y}%` }}
                key={hole.id}
                onClick={interactive ? () => onSelect?.(hole.id) : undefined}
                aria-label={interactive ? `穴 ${hole.id}を選択` : undefined}
              >
                <span className="takoyaki-ball" />
                {(interactive || calibration || isActive) && <span className="hole-number">{String(hole.id).padStart(2, "0")}</span>}
                {isActive && (
                  <>
                    <span className="cue-ring cue-ring-one" />
                    <span className="cue-ring cue-ring-two" />
                    <span className="cue-label">{ACTIONS[activeAction].short}</span>
                  </>
                )}
              </Element>
            );
          })}
        </div>

        <span className="plate-corner corner-tl" />
        <span className="plate-corner corner-tr" />
        <span className="plate-corner corner-bl" />
        <span className="plate-corner corner-br" />
      </div>
    </div>
  );
}
