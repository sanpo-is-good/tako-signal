import type { Metadata } from "next";
import TetrisProjectorPage from "./TetrisProjectorPage";

export const metadata: Metadata = {
  title: "たこやきテトリス 2面投影 | たこくり ゲーム",
  description: "2台の鉄板へ別々に位置調整してブロックを出力するプロジェクション画面。",
};

export default function Page() {
  return <TetrisProjectorPage />;
}
