import networking from "./networking.json";
import cryptography from "./cryptography.json";
import pentesting from "./pentesting.json";
import webSecurity from "./webSecurity.json";

// Shared Codex data + a reverse index (command -> concept entries), so the
// terminal can link back into the reference library: `codex <command>` opens
// the right tab with the relevant entries highlighted, and `<cmd> --help`
// points at the theory.

export interface CodexEntryData {
  id: string;
  term: string;
  category: string;
  summary: string;
  body: string;
  example?: string;
  relatedCommands?: string[];
}
export interface CodexTopicData {
  topic: string;
  title: string;
  description?: string;
  entries: CodexEntryData[];
}

export const CODEX_TOPICS = [networking, cryptography, pentesting, webSecurity] as CodexTopicData[];

// Aliases from real-world tool names to this game's command names.
const ALIASES: Record<string, string> = {
  nmap: "netmap",
  masscan: "netmap",
  john: "crack",
  hashcat: "crack",
  sqlmap: "inject-sql",
  burp: "proxy-intercept",
  curl: "proxy-intercept",
};

export function resolveCommandAlias(name: string): string {
  return ALIASES[name.toLowerCase()] ?? name.toLowerCase();
}

/** Topic + entry ids that reference a given command. */
export function codexForCommand(rawCmd: string): { topic: string; entryIds: string[] } | null {
  const cmd = resolveCommandAlias(rawCmd);
  for (const t of CODEX_TOPICS) {
    const ids = t.entries.filter((e) => (e.relatedCommands ?? []).includes(cmd)).map((e) => e.id);
    if (ids.length > 0) return { topic: t.topic, entryIds: ids };
  }
  return null;
}

export function hasCodexForCommand(cmd: string): boolean {
  return codexForCommand(cmd) !== null;
}

const TOPIC_NAMES = new Set(CODEX_TOPICS.map((t) => t.topic.toLowerCase()));

/** Resolve a `codex <query>` argument to a tab + entries to highlight. */
export function resolveCodexQuery(query: string): { topic: string; highlight: string[] } | null {
  const q = query.trim().toLowerCase().replace(/^["']|["']$/g, "");
  if (!q) return null;
  // 1) a topic name / title
  if (TOPIC_NAMES.has(q)) return { topic: q, highlight: [] };
  const byTitle = CODEX_TOPICS.find((t) => t.title.toLowerCase().includes(q) || t.topic.toLowerCase().startsWith(q));
  if (byTitle && (q === byTitle.topic.toLowerCase() || byTitle.title.toLowerCase().includes(q))) {
    return { topic: byTitle.topic, highlight: [] };
  }
  // 2) a command name (with aliases)
  const cmd = codexForCommand(q);
  if (cmd) return { topic: cmd.topic, highlight: cmd.entryIds };
  // 3) an entry id / term keyword
  for (const t of CODEX_TOPICS) {
    const hit = t.entries.find((e) => e.id === q || e.term.toLowerCase().includes(q));
    if (hit) return { topic: t.topic, highlight: [hit.id] };
  }
  return null;
}
