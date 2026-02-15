import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["src/index.ts", "src/react.ts", "src/vue.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: Boolean(options.watch),
  minify: !options.watch,
  clean: true,
  external: ["react", "react-dom", "vue"]
}));
