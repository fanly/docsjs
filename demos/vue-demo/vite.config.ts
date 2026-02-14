import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@coding01/docsjs/vue": path.resolve(__dirname, "../../src/vue/WordFidelityEditorVue.ts"),
      "@coding01/docsjs/types": path.resolve(__dirname, "../../src/core/types.ts")
    }
  },
  server: {
    port: 5174
  }
});
