import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

function countTests(vitestOutput) {
  const match = vitestOutput.match(/Tests\s+(\d+)\s+passed/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function run(command) {
  try {
    return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    return String(error.stdout ?? "") + String(error.stderr ?? "");
  }
}

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const version = pkg.version;

const vitestOutput = run("npm test");
const tests = countTests(vitestOutput);

const lines = [
  `docsjs status report`,
  `version: ${version}`,
  `tests_passed: ${tests ?? "unknown"}`,
  `quality_gate: npm run verify`,
  `gap_doc: COMPETITOR_GAP.md`
];

console.log(lines.join("\n"));
