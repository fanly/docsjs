import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";

export default defineConfig({
  lint: { options: { typeAware: true, typeCheck: true } },
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ["react", "react-dom", "jszip"],
    },
  },
  server: {
    port: 5173,
  },
});
