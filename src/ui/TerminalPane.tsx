import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { runCommand, type EngineContext } from "../engine/parser";
import { playTypingFx } from "../audio";

const PROMPT = "operator@synth:~$ ";

interface TerminalPaneProps {
  ctx: EngineContext;
}

export function TerminalPane({ ctx }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Kept in a ref (not state) so the xterm onData closure always sees the
  // latest context without needing to be torn down and recreated per render.
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      convertEol: true,
      cursorBlink: true,
      fontFamily: "Cascadia Code, Fira Code, ui-monospace, monospace",
      fontSize: 14,
      theme: {
        background: "#150834",
        foreground: "#01cdfe",
        cursor: "#ff71ce",
      },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);
    fitAddon.fit();

    term.writeln("SYNTH // BREACH — Netrunner Virtual Shell");
    term.writeln("Type 'help' to list commands.\r\n");
    term.write(PROMPT);

    let buffer = "";
    const history: string[] = [];
    let historyIndex = -1;

    function writePrompt() {
      term.write(`\r\n${PROMPT}`);
    }

    const disposable = term.onData((data) => {
      switch (data) {
        case "\r": {
          // Enter
          term.write("\r\n");
          const input = buffer;
          buffer = "";
          if (input.trim()) {
            history.push(input);
            historyIndex = history.length;
            playTypingFx();
            const result = runCommand(input, ctxRef.current);
            if (result.clearScreen) {
              term.clear();
            }
            for (const line of result.lines) {
              term.writeln(line);
            }
          }
          writePrompt();
          return;
        }
        case "": {
          // Backspace
          if (buffer.length > 0) {
            buffer = buffer.slice(0, -1);
            term.write("\b \b");
          }
          return;
        }
        case "[A": {
          // Up arrow — history back
          if (history.length === 0) return;
          historyIndex = Math.max(0, historyIndex - 1);
          replaceLine(history[historyIndex] ?? "");
          return;
        }
        case "[B": {
          // Down arrow — history forward
          if (history.length === 0) return;
          historyIndex = Math.min(history.length, historyIndex + 1);
          replaceLine(history[historyIndex] ?? "");
          return;
        }
        default: {
          if (data >= " " || data === "\t") {
            buffer += data;
            term.write(data);
            playTypingFx();
          }
        }
      }
    });

    function replaceLine(next: string) {
      // Clear the current buffer on-screen, then write the replacement.
      term.write("\b \b".repeat(buffer.length));
      buffer = next;
      term.write(buffer);
    }

    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      disposable.dispose();
      term.dispose();
    };
    // Intentionally run once — ctxRef keeps the closures fresh instead of
    // re-mounting the terminal (and losing scrollback) on every prop change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="panel terminal-pane" />;
}
