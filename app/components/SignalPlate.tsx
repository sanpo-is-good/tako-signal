"use client";

import { Fragment, useRef } from "react";
import { ACTIONS, HOLES, type ActionKind, type HoleOffsets } from "../lib/takoyaki";

type ActiveCue = { id: string; hole: number; action: ActionKind };

interface PlateProps {
  activeHole?: number;
  activeAction?: ActionKind;
  activeCues?: ActiveCue[];
  cueId?: string;
  selectedHole?: number;
  streamId?: string;
  videoEnabled?: boolean;
  interactive?: boolean;
  traceMode?: boolean;
  calibration?: boolean;
  onSelect?: (hole: number) => void;
  holeOffsets?: HoleOffsets;
  onHolePositionChange?: (hole: number, x: number, y: number) => void;
  transform?: { x: number; y: number; scale: number; rotate: number };
}

export function SignalPlate({
  activeHole,
  activeAction = "turn",
  activeCues = [],
  cueId,
  selectedHole,
  streamId,
  videoEnabled = true,
  interactive = false,
  traceMode = false,
  calibration = false,
  onSelect,
  holeOffsets = {},
  onHolePositionChange,
  transform,
}: PlateProps) {
  const lastTraceHole = useRef<number | undefined>(undefined);
  const hasVideo = Boolean(streamId?.trim());
  const showVideo = hasVideo && videoEnabled;
  const videoUrl = hasVideo
    ? `https://vdo.ninja/?view=${encodeURIComponent(streamId!.trim())}&cleanoutput&autostart&muted`
    : "";

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotate}deg)` }
    : undefined;

  const traceAt = (clientX: number, clientY: number, layer: HTMLElement) => {
    const rect = layer.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    let nearest = HOLES[0];
    let distance = Number.POSITIVE_INFINITY;
    HOLES.forEach(hole => {
      const offset = holeOffsets[hole.id] || { x: 0, y: 0 };
      const nextDistance = Math.hypot(x - hole.x - offset.x, y - hole.y - offset.y);
      if (nextDistance < distance) { nearest = hole; distance = nextDistance; }
    });
    if (nearest && nearest.id !== lastTraceHole.current) {
      lastTraceHole.current = nearest.id;
      onSelect?.(nearest.id);
    }
  };

  return (
    <div className={`signal-plate ${showVideo ? "has-video" : "simulated"} ${traceMode ? "trace-mode" : ""}`} style={style}>
      <div className="plate-surface">
        {showVideo ? (
          <iframe
            className="vdo-frame"
            src={videoUrl}
            title="VDO.Ninja たこ焼きライブ映像"
            allow="autoplay; fullscreen; picture-in-picture; camera; microphone"
          />
        ) : (
          <div className="simulated-feed" aria-label={hasVideo ? "映像再生待機中" : "映像未設定のシミュレーション"}>
            <span className="sim-light sim-light-one" /><span className="sim-light sim-light-two" />
            <span className="sim-caption">{hasVideo ? "VIDEO READY · START IN SETTINGS" : "SIMULATED LIVE FEED"}</span>
          </div>
        )}

        <div
          className="hole-layer"
          onPointerDown={traceMode ? event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); lastTraceHole.current = undefined; traceAt(event.clientX, event.clientY, event.currentTarget); } : undefined}
          onPointerMove={traceMode ? event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) traceAt(event.clientX, event.clientY, event.currentTarget); } : undefined}
          onPointerUp={traceMode ? event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); lastTraceHole.current = undefined; } : undefined}
        >
          {HOLES.map(hole => {
            const cue = activeCues.filter(item => item.hole === hole.id).at(-1)
              || (activeHole === hole.id ? { id: cueId || String(hole.id), hole: hole.id, action: activeAction } : undefined);
            const isActive = Boolean(cue);
            const effectAction = cue?.action || activeAction;
            const isSelected = selectedHole === hole.id;
            const Element = interactive ? "button" : "div";
            const offset = holeOffsets[hole.id] || { x: 0, y: 0 };
            return (
              <Element
                type={interactive ? "button" : undefined}
                className={`plate-hole ${isActive ? `cue-active cue-${ACTIONS[effectAction].effect}` : ""} ${isSelected ? "selected" : ""} ${calibration ? "calibration-hole" : ""} ${onHolePositionChange ? "position-editable" : ""}`}
                style={{ left: `${hole.x + offset.x}%`, top: `${hole.y + offset.y}%` }}
                key={hole.id}
                onClick={interactive && !traceMode ? event => { if (event.detail === 0) onSelect?.(hole.id); } : undefined}
                onPointerDown={onHolePositionChange ? event => { event.currentTarget.setPointerCapture(event.pointerId); onSelect?.(hole.id); } : interactive && !traceMode ? event => { event.preventDefault(); onSelect?.(hole.id); } : undefined}
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
                  <Fragment key={cue?.id}>
                    <span className="cue-ring cue-ring-one" /><span className="cue-ring cue-ring-two" />
                    <span className="cue-label">{ACTIONS[effectAction].short}</span>
                  </Fragment>
                )}
              </Element>
            );
          })}
        </div>
        <span className="plate-corner corner-tl" /><span className="plate-corner corner-tr" />
        <span className="plate-corner corner-bl" /><span className="plate-corner corner-br" />
      </div>
    </div>
  );
}
