import Link from "next/link";

export default function Home() {
  return (
    <main className="landing-shell">
      <header className="landing-nav">
        <div className="wordmark"><span className="wordmark-dot" aria-hidden="true" />TAKO SIGNAL</div>
        <span className="prototype-chip">Wizard-of-Oz prototype</span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">光が指示し、人が焼く。</p>
          <h1>遠隔の一手を、<br /><span>たこ焼きの光</span>に変える。</h1>
          <p className="hero-lead">
            プレイヤーの操作を鉄板上の光へ変換し、職人がその合図に応えるための、
            ブラウザだけで動くメディアアート用コントロールシステムです。
          </p>
        </div>

        <div className="hero-plate" aria-hidden="true">
          <div className="plate-grid miniature-grid">
            {Array.from({ length: 16 }, (_, index) => (
              <span className={index === 5 ? "mini-hole active" : "mini-hole"} key={index} />
            ))}
          </div>
          <span className="plate-label">SIGNAL 06</span>
        </div>
      </section>

      <section className="role-section" aria-labelledby="role-title">
        <div className="section-heading">
          <p className="eyebrow">START</p>
          <h2 id="role-title">2つの画面を開いて試す</h2>
          <p>まず同じPCの別タブで開けば、サーバー設定なしで動作を確認できます。</p>
        </div>

        <div className="role-grid">
          <Link className="role-card player-card" href="/player">
            <span className="role-number">01</span>
            <div><p className="role-kicker">PLAYER SIDE</p><h3>プレイヤー画面</h3><p>ライブ映像を見ながら、穴と動作を選んで職人へ指示を送ります。</p></div>
            <span className="card-arrow" aria-hidden="true">↗</span>
          </Link>

          <Link className="role-card kitchen-card" href="/kitchen">
            <span className="role-number">02</span>
            <div><p className="role-kicker">KITCHEN SIDE</p><h3>調理場・投映画面</h3><p>受け取った指示を鉄板上のリングへ変換し、職人が完了を返します。</p></div>
            <span className="card-arrow" aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section className="flow-strip" aria-label="体験の流れ">
        <span>選ぶ</span><i>→</i><span>光る</span><i>→</i><span>職人が焼く</span><i>→</i><span>映像で返る</span>
      </section>

      <footer className="landing-footer"><span>TAKO SIGNAL / PROTOTYPE 01</span><span>HTML · VDO.Ninja · WebSocket</span></footer>
    </main>
  );
}
