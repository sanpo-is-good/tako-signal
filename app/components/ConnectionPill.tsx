export function ConnectionPill({ connection, onReconnect }: { connection: "connecting" | "online" | "local"; onReconnect?: () => void }) {
  const label = connection === "online" ? "REMOTE ONLINE" : connection === "local" ? "LOCAL DEMO" : "CONNECTING";
  return <span className="connection-control">
    <span className={`connection-pill ${connection}`}><i aria-hidden="true" />{label}</span>
    {connection === "local" && onReconnect && <button className="connection-reconnect" onClick={onReconnect} aria-label="オンライン接続をやり直す">再接続</button>}
  </span>;
}
