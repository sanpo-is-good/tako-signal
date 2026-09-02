import type { Metadata } from "next";
import TetrisProjectorPage from "./TetrisProjectorPage";

export const metadata: Metadata = {
  title: "テトリス投映画面 | TAKO SIGNAL",
  description: "VIDEO TETRISのブロックだけを出力するプロジェクション画面。",
};

export default function Page() {
  return <TetrisProjectorPage />;
}
