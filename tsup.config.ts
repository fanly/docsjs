import { defineConfig } from "tsup";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as {
  version?: string;
};
const packageVersion = packageJson.version ?? "0.0.0";

export default defineConfig((options) => [
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: Boolean(options.watch),
    minify: !options.watch,
    clean: true,
    define: {
      __DOCSJS_VERSION__: JSON.stringify(packageVersion)
    },
    external: ["react", "react-dom", "vue", "jszip"]
  },
  {
    entry: ["src/react.ts", "src/vue.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: false,
    minify: !options.watch,
    clean: false,
    define: {
      __DOCSJS_VERSION__: JSON.stringify(packageVersion)
    },
    external: ["react", "react-dom", "vue", "jszip", /^\.{1,2}\/index$/]
  }
]);
