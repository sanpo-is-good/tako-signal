export const TETRIS_COLS = 5;
export const TETRIS_ROWS = 8;
export const TETRIS_PLATE_ROWS = 4;
export const TETRIS_CELL_COUNT = TETRIS_COLS * TETRIS_ROWS;
export const TETRIS_PLATE_CELL_COUNT = TETRIS_COLS * TETRIS_PLATE_ROWS;

export interface TetrisCalibration {
  x: number;
  y: number;
  scale: number;
  rotate: number;
  gapX: number;
  gapY: number;
  diameter: number;
}

export const TETRIS_CALIBRATION_KEY_A = "takokuri-tetris-plate-a-v2";
export const TETRIS_CALIBRATION_KEY_B = "takokuri-tetris-plate-b-v2";
export const DEFAULT_TETRIS_CALIBRATION: TetrisCalibration = {
  x: 0, y: 0, scale: 1, rotate: 0, gapX: 14, gapY: 14, diameter: 74,
};
export const DEFAULT_TETRIS_CALIBRATION_A: TetrisCalibration = {
  ...DEFAULT_TETRIS_CALIBRATION, x: -215,
};
export const DEFAULT_TETRIS_CALIBRATION_B: TetrisCalibration = {
  ...DEFAULT_TETRIS_CALIBRATION, x: 215,
};

export function parseTetrisCalibration(value: string | null, fallback: TetrisCalibration = DEFAULT_TETRIS_CALIBRATION): TetrisCalibration {
  if (!value) return fallback;
  try {
    const next = { ...fallback, ...JSON.parse(value) } as TetrisCalibration;
    return Object.values(next).every(Number.isFinite) ? next : fallback;
  } catch {
    return fallback;
  }
}
