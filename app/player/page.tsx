import type { Metadata } from "next";
import PlayerPage from "./PlayerPage";

export const metadata: Metadata = {
  title: "プレイヤー画面 | TAKO SIGNAL",
  description: "たこ焼きの穴と動作を選び、遠隔の職人へ光の指示を送るプレイヤー画面。",
};

export default function Page() {
  return <PlayerPage />;
}
