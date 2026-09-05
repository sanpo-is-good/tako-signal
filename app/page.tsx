import Link from "next/link";

const asset = (name: string) => `takokuri/${name}.png`;

export default function Home() {
  return (
    <main className="tk-home">
      <section className="tk-home-main">
        <p>現実とつながる たこ焼きゲーム</p>
        <h1>たこくり ゲーム</h1>
        <div className="tk-home-games">
          <Link className="tk-home-card is-cooking" href="/tutorial">
            <img src={asset("kansei")} alt="" />
            <strong>クッキングたこやき</strong>
            <small>職人に指示を出す</small>
          </Link>
          <Link className="tk-home-card is-tetris" href="/tetris">
            <span className="tk-mini-tetris" aria-hidden="true">{Array.from({ length: 20 }, (_, i) => <i key={i} className={i > 12 ? `c${i % 5}` : ""} />)}</span>
            <strong>たこやきテトリス</strong>
            <small>ゲーム盤は本物のたこ焼き器</small>
          </Link>
        </div>
      </section>
      <p className="tk-home-hint">遊びたいゲームを ひとつ選んでください</p>
      <Link className="tk-home-setup" href="/kitchen">PROJECTOR SETUP ↗</Link>
    </main>
  );
}
