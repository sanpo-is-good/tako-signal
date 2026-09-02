import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "/tako-signal/",
  root: path.join(projectRoot, "github-pages"),
  publicDir: path.join(projectRoot, "public"),
  plugins: [react()],
  resolve: {
    alias: {
      "next/link": path.join(projectRoot, "github-pages/LinkShim.tsx"),
    },
  },
  build: {
    outDir: path.join(projectRoot, "github-pages-dist"),
    emptyOutDir: true,
  },
});
