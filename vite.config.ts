import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static site build — no backend, no server-side code. Output in dist/
// can be deployed to any static host or opened directly.
//
// `base: "./"` makes every asset path relative, so the same bundle works
// whether it's served from a domain root, a GitHub Pages project subpath
// (https://<user>.github.io/synth-breach/), or opened straight from disk.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
