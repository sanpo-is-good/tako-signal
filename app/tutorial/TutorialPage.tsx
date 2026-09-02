"use client";

import Link from "next/link";
import { CONTROL_ACTIONS, ACTIONS, ACTION_ICONS, resolveAssetPath } from "../lib/takoyaki";

export default function TutorialPage() {
  return (
    <main className="tutorial-shell">
      <header className="tutorial-header">
        <Link href="/" className="wordmark"><span className="wordmark-dot" />TAKO SIGNAL</Link>
        <Link href="/player">PLAY →</Link>
      </header>
      <section className="tutorial-hero">
        <p>HOW TO PLAY</p>
        <h1>光で、遠くの<br />たこ焼きに触れる。</h1>
        <div className="tutorial-steps">
          <article><b>1</b><span>アイコンを選ぶ</span></article>
          <article><b>2</b><span>映像の丸をタップ</span></article>
          <article><b>3</b><span>鉄板に光が届く</span></article>
        </div>
      </section>
      <section className="tutorial-icons">
        {CONTROL_ACTIONS.map(kind => (
          <article key={kind}><img src={resolveAssetPath(ACTION_ICONS[kind])} alt="" /><strong>{ACTIONS[kind].label}</strong></article>
        ))}
      </section>
      <section className="tutorial-note">
        <p><strong>生地</strong>は、映像の上を指でなぞれます。通った丸がしばらく光り続けます。</p>
        <p><strong>テトリス</strong>は、映像にはブロックを重ねず、実際の鉄板への投影だけで遊びます。</p>
        <div><Link href="/player">たこ焼きを操作</Link><Link href="/tetris">テトリス</Link></div>
      </section>
    </main>
  );
}
