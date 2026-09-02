export const TETRIS_COLS = 5;
export const TETRIS_ROWS = 4;
export const TETRIS_CELL_COUNT = TETRIS_COLS * TETRIS_ROWS;

export interface TetrisCalibration {
  x: number;
  y: number;
  scale: number;
  gapX: number;
  gapY: number;
  diameter: number;
}

export const TETRIS_CALIBRATION_KEY = "tako-tetris-calibration-v1";
export const DEFAULT_TETRIS_CALIBRATION: TetrisCalibration = {
  x: 0, y: 0, scale: 1, gapX: 18, gapY: 18, diameter: 80,
};

export function parseTetrisCalibration(value: string | null): TetrisCalibration {
  if (!value) return DEFAULT_TETRIS_CALIBRATION;
  try {
    const next = { ...DEFAULT_TETRIS_CALIBRATION, ...JSON.parse(value) } as TetrisCalibration;
    return Object.values(next).every(Number.isFinite) ? next : DEFAULT_TETRIS_CALIBRATION;
  } catch {
    return DEFAULT_TETRIS_CALIBRATION;
  }
}
