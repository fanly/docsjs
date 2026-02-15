import { defineConfig } from "tsup";

export default defineConfig((options) => [
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: Boolean(options.watch),
    minify: !options.watch,
    clean: true,
    external: ["react", "react-dom", "vue", "jszip"]
  },
  {
    entry: ["src/react.ts", "src/vue.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: false,
    minify: !options.watch,
    clean: false,
    external: ["react", "react-dom", "vue", "jszip", /^\.{1,2}\/index$/]
  }
]);
