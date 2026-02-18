import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: /^@coding01\/docsjs$/, replacement: path.resolve(__dirname, "../../src/index.ts") },
      { find: /^@coding01\/docsjs\/vue$/, replacement: path.resolve(__dirname, "../../src/vue/WordFidelityEditorVue.ts") }
    ]
  },
  server: {
    port: 5174
  }
});
