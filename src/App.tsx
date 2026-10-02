import { useCallback, useEffect, useState } from "react";
import { Header } from "./ui/Header";
import { IntelPane } from "./ui/IntelPane";
import { TelemetryPane } from "./ui/TelemetryPane";
import { TerminalPane } from "./ui/TerminalPane";
import { CommsPane } from "./ui/CommsPane";
import { CodexModal } from "./ui/CodexModal";
import { PrologueModal } from "./ui/PrologueModal";
import { FxLayer } from "./ui/FxLayer";
import { store } from "./engine/gameStore";
import { useGame } from "./state/useGame";
import { startMusic } from "./music";
import { HOTKEYS } from "./config";

export function App() {
  useGame(); // re-render when the gated-intro state changes
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

  // Resume background music on the first user gesture if it was left on
  // (browsers block audio autoplay until an interaction).
  useEffect(() => {
    if (!store.profile.musicEnabled) return;
    const resume = () => {
      if (store.profile.musicEnabled) startMusic();
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, []);

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
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, []);

  return (
    <div className="deck">
      <Header />
      <div className="deck-body">
        <div className="left-stack">
          <div className="main-row">
            <IntelPane />
            <TelemetryPane />
          </div>
          <TerminalPane />
        </div>
        <CommsPane />
      </div>
      <CodexModal open={codexOpen} onClose={closeCodex} />
      {store.introHeld && store.gateModal && (
        <PrologueModal modal={store.gateModal} onClose={() => store.releaseIntro()} />
      )}
      <FxLayer />
    </div>
  );
}
