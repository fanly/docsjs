import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  lint: { options: { typeAware: true, typeCheck: true } },
  plugins: [vue()],
  build: {
    rollupOptions: {
      external: ["vue", "jszip"],
    },
  },
  server: {
    port: 5174,
  },
});
