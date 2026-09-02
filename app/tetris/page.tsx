import type { Metadata } from "next";
import TetrisPage from "./TetrisPage";

export const metadata: Metadata = {
  title: "VIDEO TETRIS | TAKO SIGNAL",
  description: "VDO.Ninjaの映像を盤面として遊ぶ、映像一体型テトリス。",
};

export default function Page() {
  return (
    <>
      <style>{`
        /* While Tetris settings are open, let taps reach the VDO.Ninja iframe. */
        .tetris-settings + .arcade-cabinet .tetris-video {
          pointer-events: auto !important;
          touch-action: auto !important;
        }

        .tetris-settings + .arcade-cabinet .tetris-scanlines,
        .tetris-settings + .arcade-cabinet .player-tetris-grid,
        .tetris-settings + .arcade-cabinet .tetris-overlay {
          pointer-events: none !important;
        }

        .tetris-settings + .arcade-cabinet .tetris-overlay {
          opacity: 0 !important;
        }

        /* Prevent accidental game input while settings are being used. */
        .tetris-settings + .arcade-cabinet .hold-module,
        .tetris-settings + .arcade-cabinet .tetris-touch-controls,
        .tetris-settings + .arcade-cabinet .tetris-pause {
          pointer-events: none !important;
        }
      `}</style>
      <TetrisPage />
    </>
  );
}
