// Pure, dependency-free simulation primitives. Nothing here opens a real
// socket, resolves a real hostname, or touches a real filesystem — every
// "tool" is a deterministic function over in-memory data. That's the hard
// safety requirement from the Episode 00 Operating Code (docs/SPEC.md §6),
// and it's exactly what lets the game teach real offensive technique safely.

import type { TelemetryHost } from "./types";

// Back-compat alias for the original scaffold import site.
export type SimulatedHost = TelemetryHost;

// ---- Act I: the edge subnet ------------------------------------------------
export const SUBNET_ALPHA: TelemetryHost[] = [
  { ip: "10.42.0.1", label: "ROUTER GATEWAY", status: "ACTIVE", detail: "4ms · ttl=64" },
  { ip: "10.42.0.15", label: "SILENT HOST", status: "FILTERED", detail: "ICMP filtered" },
  { ip: "10.42.0.88", label: "WORKSTATION", status: "ACTIVE", detail: "18ms · ttl=64" },
];

export const GATEWAY_IP = "10.42.0.1";

export interface PortRow {
  port: number;
  service: string;
  flags: string;
  win: string;
  interpret: string;
}

export const GATEWAY_PORTS: PortRow[] = [
  { port: 21, service: "FTP", flags: "[RST, ACK]", win: "0", interpret: "CLOSED" },
  { port: 22, service: "SSH", flags: "[SYN, ACK]", win: "65160", interpret: "OPEN!" },
  { port: 80, service: "HTTP", flags: "[SYN, ACK]", win: "65160", interpret: "OPEN!" },
  { port: 443, service: "HTTPS", flags: "[RST, ACK]", win: "0", interpret: "CLOSED" },
  { port: 8088, service: "CUSTOM", flags: "[NO RESPONSE]", win: "---", interpret: "FILTERED/STEALTH" },
];

// ---- Encoding (Act II, Ep 04) ---------------------------------------------
export function base64Decode(data: string): string | null {
  try {
    // atob is available in the browser; guard for non-base64 input.
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return null;
    return atob(data);
  } catch {
    return null;
  }
}

export function hexDecode(hex: string): string | null {
  const clean = hex.replace(/0x/gi, "").replace(/[\s,]+/g, "");
  if (clean.length === 0 || clean.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(clean)) return null;
  let out = "";
  for (let i = 0; i < clean.length; i += 2) {
    out += String.fromCharCode(parseInt(clean.slice(i, i + 2), 16));
  }
  return out;
}

// ---- Classical ciphers (Act II, Ep 05) ------------------------------------
export function caesarShift(text: string, shift: number): string {
  return text.replace(/[a-z]/gi, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift + 26) % 26) + base);
  });
}

/** Return all 25 non-trivial decryptions, each with its shift. */
export function caesarAllShifts(text: string): Array<{ shift: number; text: string }> {
  const out: Array<{ shift: number; text: string }> = [];
  for (let s = 1; s < 26; s++) out.push({ shift: s, text: caesarShift(text, s) });
  return out;
}

export function xorBytes(hexStream: string, keyByte: number): { bytes: number[]; text: string } {
  const clean = hexStream.replace(/0x/gi, "").replace(/[\s,]+/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16) ^ keyByte);
  }
  return { bytes, text: bytes.map((b) => String.fromCharCode(b)).join("") };
}

export function toBin(n: number): string {
  return n.toString(2).padStart(8, "0");
}

// ---- Hashes (Act II, Ep 06) -----------------------------------------------
export interface HashEntry {
  user: string;
  hash: string;
  plaintext: string;
  algo: "MD5";
}

export const CREDENTIAL_DUMP: HashEntry[] = [
  { user: "kovacs", hash: "5d41402abc4b2a76b9719d911017c592", plaintext: "hello", algo: "MD5" },
  { user: "vance", hash: "098f6bcd4621d373cade4e832627b4f6", plaintext: "test", algo: "MD5" },
  { user: "admin_root", hash: "21232f297a57a5a743894a0e4a801fc3", plaintext: "admin", algo: "MD5" },
];

export const SYNTH_WORDLIST = [
  "123456",
  "password",
  "letmein",
  "dragon",
  "hello",
  "test",
  "admin",
  "root",
  "qwerty",
  "aether",
];

export function identifyHash(hash: string): string | null {
  const h = hash.trim().toLowerCase();
  if (/^[0-9a-f]{32}$/.test(h)) return "MD5 (128-bit)";
  if (/^[0-9a-f]{40}$/.test(h)) return "SHA-1 (160-bit)";
  if (/^[0-9a-f]{64}$/.test(h)) return "SHA-256 (256-bit)";
  return null;
}

export function crackFromDump(hash: string): HashEntry | null {
  const h = hash.trim().toLowerCase();
  return CREDENTIAL_DUMP.find((e) => e.hash === h) ?? null;
}

// ---- CVSS (Act IV, Ep 12) -------------------------------------------------
/** The finale's fixed worst-case vector. A:H (rooting the surveillance core can
 *  take it down) makes this the canonical CVSS 3.1 maximum — a true 10.0.
 *  (With A:N the same vector scores 9.9, not 10.0.) */
export const FINALE_CVSS_VECTOR = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H";
export const FINALE_CVSS_SCORE = 10.0;

