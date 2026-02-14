import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const ROOT = process.cwd();
const CASES_PATH = join(ROOT, "fixtures/visual/cases.json");
const BASELINE_DIR = join(ROOT, "fixtures/visual/baseline");
const CURRENT_DIR = join(ROOT, "fixtures/visual/current");
const DIFF_DIR = join(ROOT, "fixtures/visual/diff");
const UPDATE = process.argv.includes("--update");
const STRICT_VISUAL = process.env.CI === "true" || process.env.VISUAL_STRICT === "1";

function ensureDirs() {
  mkdirSync(BASELINE_DIR, { recursive: true });
  mkdirSync(CURRENT_DIR, { recursive: true });
  mkdirSync(DIFF_DIR, { recursive: true });
}

function loadCases() {
  const raw = readFileSync(CASES_PATH, "utf8");
  return JSON.parse(raw);
}

async function renderCase(page, c) {
  await page.setViewportSize({ width: c.width, height: c.height });
  await page.setContent(c.html, { waitUntil: "load" });
  const out = join(CURRENT_DIR, `${c.id}.png`);
  await page.screenshot({ path: out, fullPage: true });
  return out;
}

function comparePng(baselinePath, currentPath, diffPath) {
  const baseline = PNG.sync.read(readFileSync(baselinePath));
  const current = PNG.sync.read(readFileSync(currentPath));
  if (baseline.width !== current.width || baseline.height !== current.height) {
    return Number.MAX_SAFE_INTEGER;
  }
  const diff = new PNG({ width: baseline.width, height: baseline.height });
  const mismatch = pixelmatch(
    baseline.data,
    current.data,
    diff.data,
    baseline.width,
    baseline.height,
    { threshold: 0.1 }
  );
  writeFileSync(diffPath, PNG.sync.write(diff));
  return mismatch;
}

async function main() {
  ensureDirs();
  const cases = loadCases();
  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const permissionDenied =
      msg.includes("Permission denied") || msg.includes("MachPortRendezvousServer");
    if (!STRICT_VISUAL && permissionDenied) {
      console.warn("[visual] skipped in local sandbox due browser launch permission limits");
      return;
    }
    throw error;
  }
  const page = await browser.newPage();

  let failed = 0;
  for (const c of cases) {
    const currentPath = await renderCase(page, c);
    const baselinePath = join(BASELINE_DIR, `${c.id}.png`);
    const diffPath = join(DIFF_DIR, `${c.id}.png`);
    if (UPDATE || !existsSync(baselinePath)) {
      writeFileSync(baselinePath, readFileSync(currentPath));
      console.log(`[visual] baseline updated: ${c.id}`);
      continue;
    }

    const mismatch = comparePng(baselinePath, currentPath, diffPath);
    if (mismatch > 0) {
      failed += 1;
      console.error(`[visual] mismatch ${c.id}: ${mismatch} pixels`);
    } else {
      console.log(`[visual] ok: ${c.id}`);
    }
  }

  await browser.close();
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
