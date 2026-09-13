// Virtual network, services, and file system. Every command below is
// fully simulated — this module never opens a real socket, resolves a
// real hostname, or touches a real file system. That's a hard requirement
// (docs/SPEC.md §6, the Episode 00 Operating Code), not just a scaffold
// shortcut: it's what lets the game teach real offensive techniques safely.
//
// Currently seeded with Episode 01's subnet ("The Gateway Knock") as the
// reference dataset. Later episodes' targets, services, and filesystem
// trees should be added here following the same shape as SUBNET_10_42_0.

export interface SimulatedHost {
  ip: string;
  label: string;
  status: "ACTIVE" | "SILENT" | "FILTERED";
  latencyMs?: number;
  ttl?: number;
}

export const SUBNET_10_42_0: SimulatedHost[] = [
  { ip: "10.42.0.1", label: "ROUTER GATEWAY", status: "ACTIVE", latencyMs: 4, ttl: 64 },
  { ip: "10.42.0.15", label: "SILENT HOST", status: "FILTERED" },
  { ip: "10.42.0.88", label: "WORKSTATION", status: "ACTIVE", latencyMs: 18, ttl: 64 },
];

export function netmap(cidr: string): string[] {
  if (cidr !== "10.42.0.0/24") {
    return [`[!] No known range matches ${cidr} in this shard.`];
  }
  const lines = [`[*] Sweeping ${cidr} ...`];
  for (const host of SUBNET_10_42_0) {
    const tag =
      host.status === "ACTIVE"
        ? `ACTIVE - ${host.latencyMs}ms`
        : host.status === "FILTERED"
          ? "ICMP FILTERED"
          : "SILENT";
    lines.push(`  ${host.ip}  [${host.label} - ${tag}]`);
  }
  return lines;
}

export function ping(ip: string): string[] {
  const host = SUBNET_10_42_0.find((h) => h.ip === ip);
  if (!host || host.status !== "ACTIVE") {
    return [`Request timeout for icmp_seq 1`, `(no reply from ${ip})`];
  }
  return [`64 bytes from ${ip}: icmp_seq=1 ttl=${host.ttl} time=${host.latencyMs?.toFixed(2)} ms`];
}
