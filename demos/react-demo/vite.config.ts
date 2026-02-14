import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@coding01\/docsjs$/, replacement: path.resolve(__dirname, "../../src/index.ts") },
      { find: /^@coding01\/docsjs\/react$/, replacement: path.resolve(__dirname, "../../src/react/WordFidelityEditorReact.tsx") },
      { find: /^@coding01\/docsjs\/types$/, replacement: path.resolve(__dirname, "../../src/core/types.ts") }
    ]
  },
  server: {
    port: 5173
  }
});
