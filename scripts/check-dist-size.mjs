import { statSync } from "node:fs";
import { join } from "node:path";

const budgets = [
  { file: "index.js", maxBytes: 90 * 1024 },
  { file: "react.js", maxBytes: 15 * 1024 },
  { file: "vue.js", maxBytes: 15 * 1024 }
];

let hasError = false;
for (const budget of budgets) {
  const target = join(process.cwd(), "dist", budget.file);
  let size = 0;
  try {
    size = statSync(target).size;
  } catch {
    console.error(`[sizecheck] Missing dist file: ${budget.file}`);
    hasError = true;
    continue;
  }

  if (size > budget.maxBytes) {
    console.error(
      `[sizecheck] ${budget.file} too large: ${size} bytes > budget ${budget.maxBytes} bytes`
    );
    hasError = true;
  } else {
    console.log(`[sizecheck] ${budget.file}: ${size} bytes (budget ${budget.maxBytes})`);
  }
}

if (hasError) {
  process.exit(1);
}
