import type { Metadata } from "next";
import KitchenPage from "./KitchenPage";

export const metadata: Metadata = {
  title: "調理場・投映画面 | TAKO SIGNAL",
  description: "プレイヤーから届いた操作を鉄板上の光へ変換し、職人が完了を返す投映画面。",
};

export default function Page() {
  return <KitchenPage />;
}
