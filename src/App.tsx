import { useCallback, useEffect, useState } from "react";
import { Header } from "./ui/Header";
import { IntelPane } from "./ui/IntelPane";
import { TelemetryPane } from "./ui/TelemetryPane";
import { TerminalPane } from "./ui/TerminalPane";
import { CodexModal } from "./ui/CodexModal";
import { episode00 } from "./chapters/episode00";
import type { SimulatedHost } from "./engine/simulator";
import type { EngineContext } from "./engine/parser";
import { HOTKEYS } from "./config";
import { useSave } from "./state/SaveContext";

export function App() {
  const { profile, updateProfile } = useSave();
  const [hosts, setHosts] = useState<SimulatedHost[]>([]);
  const [codexOpen, setCodexOpen] = useState(false);

  // Only the Prologue is implemented so far — see src/chapters/*/index.ts
  // for the Act I-IV stubs waiting on their full dialogue trees.
  const chapter = episode00;

  const openCodex = useCallback(() => setCodexOpen(true), []);
  const closeCodex = useCallback(() => setCodexOpen(false), []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === HOTKEYS.openCodex) {
        e.preventDefault();
        setCodexOpen((prev) => !prev);
      } else if (e.key === "Escape" && codexOpen) {
        setCodexOpen(false);
      } else if (e.key.toLowerCase() === HOTKEYS.toggleMute && e.altKey) {
        updateProfile({ audioMuted: !profile.audioMuted });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [codexOpen, profile.audioMuted, updateProfile]);

  const ctx: EngineContext = {
    chapter,
    onDiscoverHosts: setHosts,
    onOpenCodex: openCodex,
  };

  return (
    <div className="deck">
      <Header chapter={chapter} />
      <div className="main-row">
        <IntelPane chapter={chapter} />
        <TelemetryPane hosts={hosts} />
      </div>
      <TerminalPane ctx={ctx} />
      <CodexModal open={codexOpen} onClose={closeCodex} />
    </div>
  );
}
