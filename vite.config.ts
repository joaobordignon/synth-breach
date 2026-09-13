import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static site build — no backend, no server-side code. Output in dist/
// can be deployed to any static host or opened directly.
export default defineConfig({
  plugins: [react()],
});
