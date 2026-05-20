import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import vitePWA from "./src/plugins/vite-pwa";

export default defineConfig({
  base: "./",
  plugins: [vue(), vitePWA],
  resolve: {
    alias: [
      // webpack path resolve to vitejs
      {
        find: /^~(.*)$/,
        replacement: "$1",
      },
      {
        find: "@/",
        replacement: `${path.resolve(__dirname, "src")}/`,
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "/src"),
      },
    ],
    extensions: [
      ".mjs",
      ".js",
      ".ts",
      ".jsx",
      ".tsx",
      ".json",
      ".vue",
      ".css",
      ".scss",
    ],
  },
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
});
