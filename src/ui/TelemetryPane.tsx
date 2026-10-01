import { store } from "../engine/gameStore";
import { useGame } from "../state/useGame";

// Telemetry & network map: whatever the active command last published via
// api.setTelemetry — discovered hosts, a packet-capture table, or a
// Burp-in-TUI request/response block.

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: "active",
  OPEN: "active",
  COMPROMISED: "active",
  FILTERED: "filtered",
  SILENT: "filtered",
  TRAP: "trap",
};

export function TelemetryPane() {
  useGame();
  const t = store.getTelemetry();

  return (
    <div className="panel telemetry-pane">
      <h3 className="glow-pink">📡 TELEMETRY &amp; NETWORK MAP</h3>
      {!t ? (
        <p className="muted">No telemetry yet. Run a scan to populate the map.</p>
      ) : (
        <>
          <p className="subnet-tag">{t.title}</p>
          {t.hosts.length > 0 && (
            <ul className="host-list">
              {t.hosts.map((h) => (
                <li key={h.ip} className={STATUS_CLASS[h.status] ?? "filtered"}>
                  <span className="host-ip">{h.ip}</span> [{h.label} — {h.status}
                  {h.detail ? ` · ${h.detail}` : ""}]
                </li>
              ))}
            </ul>
          )}
          {t.block && t.block.length > 0 && (
            <pre className="telemetry-block">{t.block.join("\n")}</pre>
          )}
        </>
      )}
    </div>
  );
}
