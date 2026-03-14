import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  lint: { options: { typeAware: true, typeCheck: true } },
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@coding01\/docsjs$/,
        replacement: path.resolve(__dirname, "../../src/index.ts"),
      },
      {
        find: /^@coding01\/docsjs\/react$/,
        replacement: path.resolve(__dirname, "../../src/react/WordFidelityEditorReact.tsx"),
      },
    ],
  },
  build: {
    rollupOptions: {
      external: ["react", "react-dom", "jszip", "yjs"],
    },
  },
  server: {
    port: 5173,
  },
});
