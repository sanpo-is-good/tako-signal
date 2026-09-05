import type { Metadata } from "next";
import TetrisPage from "./TetrisPage";

export const metadata: Metadata = {
  title: "たこ焼きテトリス | TAKO SIGNAL",
  description: "1台の4×5鉄板をフィールドとして使う、プロジェクション・テトリス。",
};

export default function Page() {
  return <TetrisPage />;
}
