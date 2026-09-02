import type { Metadata } from "next";
import TetrisPage from "./TetrisPage";

export const metadata: Metadata = {
  title: "VIDEO TETRIS | TAKO SIGNAL",
  description: "VDO.Ninjaの映像を盤面として遊ぶ、映像一体型テトリス。",
};

export default function Page() {
  return <TetrisPage />;
}
