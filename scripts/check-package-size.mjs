import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const PACK_DIR = ".tmp-pack";
const CACHE_DIR = ".npm-cache";
const UNPACKED_BUDGET_BYTES = 700 * 1024;
const TARBALL_BUDGET_BYTES = 220 * 1024;

if (!existsSync(PACK_DIR)) {
  mkdirSync(PACK_DIR, { recursive: true });
}
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true });
}

const raw = execSync(`npm_config_cache=${CACHE_DIR} npm pack --json --pack-destination ${PACK_DIR}`, {
  encoding: "utf8"
});

const parsed = JSON.parse(raw);
const info = parsed[0];

if (!info) {
  throw new Error("Failed to read npm pack metadata.");
}

const tarballPath = join(PACK_DIR, info.filename);
if (existsSync(tarballPath)) {
  rmSync(tarballPath);
}

const summary = `[pkgsize] ${info.name}@${info.version} tarball=${info.size}B unpacked=${info.unpackedSize}B`;
console.log(summary);

if (info.unpackedSize > UNPACKED_BUDGET_BYTES) {
  throw new Error(`[pkgsize] unpacked size ${info.unpackedSize} exceeds budget ${UNPACKED_BUDGET_BYTES}`);
}
if (info.size > TARBALL_BUDGET_BYTES) {
  throw new Error(`[pkgsize] tarball size ${info.size} exceeds budget ${TARBALL_BUDGET_BYTES}`);
}
