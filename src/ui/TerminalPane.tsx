import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { store } from "../engine/gameStore";
import { colorize } from "./ansi";
import { PALETTE } from "../config";
import { playTypingFx } from "../audio";

// The command console. xterm renders; the game store owns all logic. The one
// subtlety here is interleaving: WARDEN logs, streamed scans, and the finale
// countdown print asynchronously while the player may be mid-type, so the
// output handler erases the current input line, prints, then redraws the
// prompt + whatever was buffered.

export function TerminalPane() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      convertEol: true,
      cursorBlink: true,
      fontFamily: '"Cascadia Code", "Fira Code", ui-monospace, monospace',
      fontSize: 14,
      theme: {
        background: PALETTE.synthPanelBg,
        foreground: PALETTE.neonCyan,
        cursor: PALETTE.neonPink,
        selectionBackground: "rgba(255,113,206,0.3)",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(container);
    fit.fit();

    let buffer = "";
    const history: string[] = [];
    let historyIndex = -1;
    let promptVisible = false;
    let processing = false;

    const prompt = () => store.getPrompt();

    function showPrompt() {
      term.write(prompt() + buffer);
      promptVisible = true;
    }
    function clearInputLine() {
      // Return to column 0 and clear the whole line.
      term.write("\r\x1b[2K");
      promptVisible = false;
    }

    // Insert text at the cursor (used for typing, pasting, and middle-click).
    // Pasted content can be multi-line / contain control chars — flatten it.
    function typeChars(data: string) {
      const clean = data.replace(/[\r\n]+/g, " ").replace(/[^\x20-\x7E]/g, "");
      if (!clean) return;
      buffer += clean;
      term.write(clean);
      playTypingFx();
    }

    // Replace the whole input line (fill-from-UI and history recall).
    function setBuffer(next: string) {
      clearInputLine();
      buffer = next.replace(/[\r\n]+/g, " ").replace(/[^\x20-\x7E]/g, "");
      showPrompt();
      term.focus();
    }

    // Background / command output stream.
    const unsub = store.onOutput((lines) => {
      if (promptVisible) clearInputLine();
      for (const l of lines) term.writeln(colorize(l));
      if (!processing) showPrompt();
    });

    function replaceLine(next: string) {
      term.write("\b \b".repeat(buffer.length));
      buffer = next;
      term.write(buffer);
    }

    function tabComplete() {
      const token = buffer.split(/\s+/)[0];
      if (buffer.includes(" ") || !token) return;
      const matches = store.commandNames().filter((c) => c.startsWith(token));
      if (matches.length === 1) {
        const add = matches[0].slice(buffer.length);
        buffer += add;
        term.write(add);
      } else if (matches.length > 1) {
        clearInputLine();
        term.writeln(colorize({ text: "  " + matches.join("   "), kind: "dim" }));
        showPrompt();
      }
    }

    const disposable = term.onData((data) => {
      switch (data) {
        case "\r": {
          term.write("\r\n");
          promptVisible = false;
          const input = buffer;
          buffer = "";
          if (input.trim() === "clear") {
            term.clear();
            showPrompt();
            return;
          }
          if (input.trim()) {
            history.push(input);
            historyIndex = history.length;
            processing = true;
            store.submit(input);
            processing = false;
          }
          showPrompt();
          return;
        }
        case "\u007f": // Backspace
          if (buffer.length > 0) {
            buffer = buffer.slice(0, -1);
            term.write("\b \b");
          }
          return;
        case "\t": // Tab-completion
          tabComplete();
          return;
        case "\x1b[A": // Up — history back
          if (history.length === 0) return;
          historyIndex = Math.max(0, historyIndex - 1);
          replaceLine(history[historyIndex] ?? "");
          return;
        case "\x1b[B": // Down — history forward
          if (history.length === 0) return;
          historyIndex = Math.min(history.length, historyIndex + 1);
          replaceLine(history[historyIndex] ?? "");
          return;
        default:
          // Single keystrokes and pasted chunks (xterm delivers paste here too).
          typeChars(data);
      }
    });

    // Copy with Ctrl/Cmd+C when there's a selection (xterm renders to canvas,
    // so the browser's own copy can't see the text). Ctrl+C is plain copy — it
    // does NOT open devtools (that's Ctrl+Shift+I / F12). Paste (Ctrl/Cmd+V,
    // right-click, middle-click) is delivered by xterm straight to onData above.
    term.attachCustomKeyEventHandler((e) => {
      if (e.type !== "keydown") return true;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && !e.shiftKey && (e.key === "c" || e.key === "C")) {
        if (term.hasSelection()) {
          const sel = term.getSelection();
          if (sel) navigator.clipboard?.writeText(sel).catch(() => {});
          e.preventDefault();
          return false; // consumed as copy
        }
        return true; // no selection — let it pass, don't send ^C
      }
      return true;
    });

    // Let side-panel UI drop a command straight at the prompt (click-to-insert).
    const unsubInput = store.onInputRequest((text) => setBuffer(text));

    // Boot sequence.
    term.writeln(colorize({ text: "SYNTH // BREACH — Netrunner Virtual Shell", kind: "banner" }));
    term.writeln(colorize({ text: "Fully simulated · air-gapped · nothing here touches a real system.", kind: "dim" }));
    term.writeln(colorize({ text: "Type 'help' for commands, 'objectives' for your checklist.", kind: "dim" }));
    // Gate the first episode of the session behind a Jack In / Reconnect box so
    // HEX never talks until the player clicks (which also unlocks speech audio).
    store.startEpisode(store.currentEpisodeId, { bootGate: true });

    const onResize = () => fit.fit();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      unsub();
      unsubInput();
      disposable.dispose();
      term.dispose();
    };
  }, []);

  return <div ref={containerRef} className="panel terminal-pane" />;
}
