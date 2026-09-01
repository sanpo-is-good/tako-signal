"use client";

import { Fragment } from "react";
import { ACTIONS, HOLES, type ActionKind, type HoleOffsets } from "../lib/takoyaki";

interface PlateProps {
  activeHole?: number;
  activeAction?: ActionKind;
  cueId?: string;
  selectedHole?: number;
  streamId?: string;
  interactive?: boolean;
  calibration?: boolean;
  onSelect?: (hole: number) => void;
  holeOffsets?: HoleOffsets;
  onHolePositionChange?: (hole: number, x: number, y: number) => void;
  transform?: { x: number; y: number; scale: number; rotate: number };
}

export function SignalPlate({
  activeHole,
  activeAction = "turn",
  cueId,
  selectedHole,
  streamId,
  interactive = false,
  calibration = false,
  onSelect,
  holeOffsets = {},
  onHolePositionChange,
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
            const offset = holeOffsets[hole.id] || { x: 0, y: 0 };
            const left = hole.x + offset.x;
            const top = hole.y + offset.y;
            return (
              <Element
                type={interactive ? "button" : undefined}
                className={`plate-hole ${isActive ? `cue-active cue-${ACTIONS[activeAction].effect}` : ""} ${isSelected ? "selected" : ""} ${calibration ? "calibration-hole" : ""} ${onHolePositionChange ? "position-editable" : ""}`}
                style={{ left: `${left}%`, top: `${top}%` }}
                key={hole.id}
                onClick={interactive ? event => { if (event.detail === 0) onSelect?.(hole.id); } : undefined}
                onPointerDown={onHolePositionChange ? event => { event.currentTarget.setPointerCapture(event.pointerId); onSelect?.(hole.id); } : interactive ? event => { event.preventDefault(); onSelect?.(hole.id); } : undefined}
                onPointerMove={onHolePositionChange ? event => {
                  if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                  const layer = event.currentTarget.parentElement;
                  if (!layer) return;
                  const rect = layer.getBoundingClientRect();
                  const nextX = Math.min(96, Math.max(4, ((event.clientX - rect.left) / rect.width) * 100));
                  const nextY = Math.min(96, Math.max(4, ((event.clientY - rect.top) / rect.height) * 100));
                  onHolePositionChange(hole.id, nextX - hole.x, nextY - hole.y);
                } : undefined}
                onPointerUp={onHolePositionChange ? event => event.currentTarget.releasePointerCapture(event.pointerId) : undefined}
                aria-label={interactive ? `穴 ${hole.id}を選択` : undefined}
              >
                <span className="takoyaki-ball" />
                {(interactive || calibration || isActive) && <span className="hole-number">{String(hole.id).padStart(2, "0")}</span>}
                {isActive && (
                  <Fragment key={cueId || `${hole.id}-${activeAction}`}>
                    <span className="cue-ring cue-ring-one" />
                    <span className="cue-ring cue-ring-two" />
                    <span className="cue-label">{ACTIONS[activeAction].short}</span>
                  </Fragment>
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
