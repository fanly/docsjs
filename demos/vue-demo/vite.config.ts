import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  lint: { options: { typeAware: true, typeCheck: true } },
  plugins: [vue()],
  resolve: {
    alias: [
      { find: /^@coding01\/docsjs$/, replacement: path.resolve(__dirname, "../../src/index.ts") },
      {
        find: /^@coding01\/docsjs\/vue$/,
        replacement: path.resolve(__dirname, "../../src/vue/WordFidelityEditorVue.ts"),
      },
    ],
  },
  build: {
    rollupOptions: {
      external: ["vue", "jszip", "yjs"],
    },
  },
  server: {
    port: 5174,
  },
});
