export function ConnectionPill({ connection }: { connection: "connecting" | "online" | "local" }) {
  const label = connection === "online" ? "REMOTE ONLINE" : connection === "local" ? "LOCAL DEMO" : "CONNECTING";
  return <span className={`connection-pill ${connection}`}><i aria-hidden="true" />{label}</span>;
}
