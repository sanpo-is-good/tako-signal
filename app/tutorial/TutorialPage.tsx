"use client";

import Link from "next/link";
import { ACTION_ICONS, resolveAssetPath } from "../lib/takoyaki";

const tutorialActions = ["batter", "octopus", "greenOnion", "tenkasu", "turn", "serve"] as const;

export default function TutorialPage() {
  return (
    <main className="tk-tutorial">
      <header className="tk-tutorial-head">
        <div><h1>あそびかた</h1><span>COOKING TAKOYAKI / TUTORIAL</span></div>
        <Link href="/">ゲームをやめる</Link>
      </header>

      <section className="tk-tutorial-steps">
        <article>
          <h2><b>①</b> 指示を選ぶ</h2>
          <div className="tk-tutorial-icons">
            {tutorialActions.map(kind => <img key={kind} src={resolveAssetPath(ACTION_ICONS[kind])} alt="" />)}
          </div>
          <p>画面下のアイコンを押して、職人に伝えたい指示を選びます。</p>
        </article>
        <article>
          <h2><b>②</b> 場所をタップ</h2>
          <div className="tk-tutorial-live"><span><i /> LIVE</span><em>職人の手元<br />ライブ映像</em></div>
          <p>映像に重なる丸をタップ。選んだ場所が実物の鉄板で光ります。</p>
        </article>
        <article>
          <h2><b>③</b> 映像で見る</h2>
          <div className="tk-tutorial-signal"><span>06</span><i /><i /></div>
          <p>職人への合図はすぐ送信されます。結果はライブ映像で確認します。</p>
        </article>
        <article>
          <h2><b>④</b> なぞって注ぐ</h2>
          <div className="tk-tutorial-trace"><span /><span /><span /><span /></div>
          <p>生地のときは複数の穴を指でなぞれます。光は数秒間残ります。</p>
        </article>
      </section>

      <div className="tk-tutorial-start">
        <Link href="/player">ゲームスタート</Link>
        <small>TAP TO START · タッチ操作のみ</small>
      </div>
    </main>
  );
}
