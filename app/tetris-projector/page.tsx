import type { Metadata } from "next";
import TetrisProjectorPage from "./TetrisProjectorPage";

export const metadata: Metadata = {
  title: "たこ焼きテトリス 投映画面 | TAKO SIGNAL",
  description: "たこ焼きテトリスのブロックだけを出力するプロジェクション画面。",
};

export default function Page() {
  return <TetrisProjectorPage />;
}
