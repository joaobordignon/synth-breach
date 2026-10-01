import { useCallback, useEffect, useState } from "react";
import { Header } from "./ui/Header";
import { IntelPane } from "./ui/IntelPane";
import { TelemetryPane } from "./ui/TelemetryPane";
import { TerminalPane } from "./ui/TerminalPane";
import { CodexModal } from "./ui/CodexModal";
import { FxLayer } from "./ui/FxLayer";
import { store } from "./engine/gameStore";
import { HOTKEYS } from "./config";

export function App() {
  const [codexOpen, setCodexOpen] = useState(false);
  const openCodex = useCallback(() => setCodexOpen(true), []);
  const closeCodex = useCallback(() => setCodexOpen(false), []);

  // Let `codex` (the command) open the modal through the store.
  useEffect(() => {
    store.openCodexFn = openCodex;
    return () => {
      store.openCodexFn = null;
    };
  }, [openCodex]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === HOTKEYS.openCodex) {
        e.preventDefault();
        setCodexOpen((p) => !p);
      } else if (e.key === "Escape") {
        setCodexOpen(false);
      } else if (e.altKey && e.key.toLowerCase() === HOTKEYS.toggleMute) {
        store.setMuted(!store.profile.audioMuted);
      }
    }
    // Capture phase: run before xterm's own textarea handlers, which would
    // otherwise swallow Escape/F1 while the terminal is focused.
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, []);

  return (
    <div className="deck">
      <Header />
      <div className="main-row">
        <IntelPane />
        <TelemetryPane />
      </div>
      <TerminalPane />
      <CodexModal open={codexOpen} onClose={closeCodex} />
      <FxLayer />
    </div>
  );
}
