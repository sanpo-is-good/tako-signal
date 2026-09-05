import type { Metadata } from "next";
import TetrisProjectorPage from "./TetrisProjectorPage";

export const metadata: Metadata = {
  title: "たこやきテトリス 投影 | たこくり ゲーム",
  description: "1台の4×5鉄板へブロックを出力するプロジェクション画面。",
};

export default function Page() {
  return <TetrisProjectorPage />;
}
