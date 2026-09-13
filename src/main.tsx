import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { SaveProvider } from "./state/SaveContext";
import { PALETTE } from "./config";
import "./ui/styles.css";

// Apply the palette tokens as CSS custom properties once at startup, so
// ui/styles.css never hardcodes a hex value — src/config.ts stays the
// single source of truth for the color system.
const root = document.documentElement;
root.style.setProperty("--synth-bg", PALETTE.synthBg);
root.style.setProperty("--synth-panel-bg", PALETTE.synthPanelBg);
root.style.setProperty("--neon-cyan", PALETTE.neonCyan);
root.style.setProperty("--neon-pink", PALETTE.neonPink);
root.style.setProperty("--sunset-amber", PALETTE.sunsetAmber);
root.style.setProperty("--neon-green", PALETTE.neonGreen);
root.style.setProperty("--alert-red", PALETTE.alertRed);
root.style.setProperty("--muted-lavender", PALETTE.mutedLavender);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SaveProvider>
      <App />
    </SaveProvider>
  </StrictMode>,
);
