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
  const evidence = store.getEvidence();

  return (
    <div className="panel telemetry-pane">
      <h3 className="glow-pink">📡 TELEMETRY &amp; NETWORK MAP</h3>
      {!t && evidence.length === 0 ? (
        <p className="muted">No telemetry yet. Run a scan to populate the map.</p>
      ) : (
        <>
          {t && (
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
          {evidence.length > 0 && (
            <div className="evidence-locker">
              <p className="evidence-title">🗄 EVIDENCE LOCKER <span>— survives `clear`</span></p>
              <dl className="evidence-list">
                {evidence.map((e, i) => (
                  <div key={i} className="evidence-item">
                    <dt>{e.label}</dt>
                    <dd>{e.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="evidence-hint">select to copy · `recall` reprints it to the terminal</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
