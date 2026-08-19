import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [tailwindcss(), tanstackStart(), react()],
  build: {
    // Increase the chunk size warning limit to reduce noisy warnings for
    // large single-page applications. For a real optimization, consider
    // using `rollupOptions.output.manualChunks` to split heavy modules.
    chunkSizeWarningLimit: 800,
  },
});
