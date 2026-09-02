import type { ComponentType } from "react";
import { createRoot } from "react-dom/client";
import Home from "../app/page";
import DebugPage from "../app/debug/DebugPage";
import KitchenPage from "../app/kitchen/KitchenPage";
import PlayerPage from "../app/player/PlayerPage";
import TetrisPage from "../app/tetris/TetrisPage";
import TetrisProjectorPage from "../app/tetris-projector/TetrisProjectorPage";
import "../app/globals.css";

const BASE_PATH = "/tako-signal";

function currentRoute() {
  const pathname = window.location.pathname;
  const relative = pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) : pathname;
  return relative.replace(/\/+$/, "") || "/";
}

function NotFound() {
  return (
    <main className="landing-shell">
      <header className="landing-nav">
        <a className="wordmark" href={`${BASE_PATH}/`}><span className="wordmark-dot" />TAKO SIGNAL</a>
      </header>
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow">404</p><h1>画面が見つかりません</h1></div>
      </section>
    </main>
  );
}

const routes: Record<string, ComponentType> = {
  "/": Home,
  "/player": PlayerPage,
  "/kitchen": KitchenPage,
  "/debug": DebugPage,
  "/tetris": TetrisPage,
  "/tetris-projector": TetrisProjectorPage,
};

const Page = routes[currentRoute()] || NotFound;
createRoot(document.getElementById("root")!).render(<Page />);
