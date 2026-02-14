import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@coding01/docsjs/react": path.resolve(__dirname, "../../src/react/WordFidelityEditorReact.tsx"),
      "@coding01/docsjs/types": path.resolve(__dirname, "../../src/core/types.ts")
    }
  },
  server: {
    port: 5173
  }
});
