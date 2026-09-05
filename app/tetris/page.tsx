import type { Metadata } from "next";
import TetrisPage from "./TetrisPage";

export const metadata: Metadata = {
  title: "たこ焼きテトリス | TAKO SIGNAL",
  description: "2台の4×5鉄板を5×8フィールドとして使う、プロジェクション・テトリス。",
};

export default function Page() {
  return <TetrisPage />;
}
