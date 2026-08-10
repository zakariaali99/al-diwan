import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Built output is consumed by django-vite via the manifest, and served by
// Django/WhiteNoise as ordinary static files — so production needs no Node.
export default defineConfig({
  plugins: [react()],
  base: "/static/",
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    manifest: true,
    outDir: "../backend/dist",
    emptyOutDir: true,
    rollupOptions: {
      input: "src/main.tsx",
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    origin: "http://localhost:5173",
    // In dev the page is served by Django on :8000; these paths must reach it.
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/admin": "http://127.0.0.1:8000",
      "/media": "http://127.0.0.1:8000",
    },
  },
});
