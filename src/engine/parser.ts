import type { Chapter, HintTier } from "../chapters/baseChapter";
import { getHint } from "./hintSystem";
import { netmap, ping, SUBNET_10_42_0, type SimulatedHost } from "./simulator";

export interface EngineContext {
  chapter: Chapter;
  onDiscoverHosts?: (hosts: SimulatedHost[]) => void;
  onOpenCodex?: () => void;
}

export interface CommandResult {
  lines: string[];
  clearScreen?: boolean;
}

type CommandHandler = (args: string[], ctx: EngineContext) => CommandResult;

interface CommandDef {
  usage: string;
  description: string;
  handler: CommandHandler;
}

const COMMANDS: Record<string, CommandDef> = {
  help: {
    usage: "help [command]",
    description: "List every available command, or show usage for one command.",
    handler: (args) => {
      if (args[0] && COMMANDS[args[0]]) {
        const def = COMMANDS[args[0]];
        return { lines: [`${def.usage}`, `  ${def.description}`] };
      }
      const lines = Object.entries(COMMANDS).map(([name, def]) => `  ${name.padEnd(12)} ${def.description}`);
      return { lines: ["Available commands:", ...lines] };
    },
  },
  clear: {
    usage: "clear",
    description: "Clear the terminal screen.",
    handler: () => ({ lines: [], clearScreen: true }),
  },
  intel: {
    usage: "intel [1|2|3]",
    description: "Reveal a Decker Intel hint for the current chapter (Tier 1 theory by default).",
    handler: (args, ctx) => {
      const tier = (Number(args[0]) || 1) as HintTier;
      if (tier < 1 || tier > 3) {
        return { lines: ["[!] Tier must be 1, 2, or 3."] };
      }
      return { lines: [getHint(ctx.chapter, tier)] };
    },
  },
  codex: {
    usage: "codex",
    description: "Open the in-game reference library.",
    handler: (_args, ctx) => {
      ctx.onOpenCodex?.();
      return { lines: ["[*] Opening Codex..."] };
    },
  },
  "accept-code": {
    usage: "accept-code",
    description: "Formally acknowledge the Null Pointer Collective's Operating Code.",
    handler: () => ({
      lines: [
        "[✓] Operating Code accepted.",
        "You're cleared for authorized-shard operations only. Let's move.",
      ],
    }),
  },
  netmap: {
    usage: "netmap <cidr>",
    description: "Sweep a subnet for active hosts.",
    handler: (args, ctx) => {
      const cidr = args[0];
      if (!cidr) return { lines: ["[!] Usage: netmap <cidr>, e.g. netmap 10.42.0.0/24"] };
      const lines = netmap(cidr);
      if (cidr === "10.42.0.0/24") ctx.onDiscoverHosts?.(SUBNET_10_42_0);
      return { lines };
    },
  },
  ping: {
    usage: "ping <ip>",
    description: "Send an ICMP echo request to a host.",
    handler: (args) => {
      const ip = args[0];
      if (!ip) return { lines: ["[!] Usage: ping <ip>"] };
      return { lines: ping(ip) };
    },
  },
};

export function runCommand(input: string, ctx: EngineContext): CommandResult {
  const trimmed = input.trim();
  if (!trimmed) return { lines: [] };

  const [name, ...args] = trimmed.split(/\s+/);
  const def = COMMANDS[name];
  if (!def) {
    return { lines: [`[!] Unknown command: ${name}. Type 'help' for a list of commands.`] };
  }
  return def.handler(args, ctx);
}

export function commandNames(): string[] {
  return Object.keys(COMMANDS);
}
