import type { SimulatedHost } from "../engine/simulator";

interface TelemetryPaneProps {
  hosts: SimulatedHost[];
}

export function TelemetryPane({ hosts }: TelemetryPaneProps) {
  return (
    <div className="panel">
      <h3 className="glow-pink">📡 TELEMETRY & NETWORK MAP</h3>
      {hosts.length === 0 ? (
        <p style={{ color: "var(--muted-lavender, #8a79a5)" }}>No hosts discovered yet. Try `netmap &lt;cidr&gt;`.</p>
      ) : (
        <ul className="host-list">
          {hosts.map((host) => (
            <li key={host.ip} className={host.status === "ACTIVE" ? "active" : "filtered"}>
              {host.ip} [{host.label} - {host.status === "ACTIVE" ? `ACTIVE - ${host.latencyMs}ms` : host.status}]
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
