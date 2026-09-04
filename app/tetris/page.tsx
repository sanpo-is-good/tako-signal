import type { Metadata } from "next";
import TetrisPage from "./TetrisPage";

export const metadata: Metadata = {
  title: "たこ焼きテトリス | TAKO SIGNAL",
  description: "遠隔のたこ焼き鉄板へ投影して遊ぶ、20穴のたこ焼きテトリス。",
};

export default function Page() {
  return <TetrisPage />;
}
