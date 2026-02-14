import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { JSDOM } from "jsdom";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const CASES_PATH = join(ROOT, "fixtures/golden/cases.json");

function countElements(root, selector) {
  return root.querySelectorAll(selector).length;
}

function isListLikeParagraph(p) {
  if (p.hasAttribute("data-word-list")) return true;
  if (p.querySelector("span.__word-list-marker")) return true;
  const style = (p.getAttribute("style") ?? "").toLowerCase();
  return style.includes("mso-list");
}

function collectSemanticStatsFromHtml(rawHtml) {
  const dom = new JSDOM(rawHtml);
  const doc = dom.window.document;
  const paragraphs = Array.from(doc.querySelectorAll("p"));
  const listParagraphCount = paragraphs.filter((p) => isListLikeParagraph(p)).length;
  const textCharCount = (doc.body.textContent ?? "").replace(/\s+/g, "").length;

  return {
    paragraphCount: paragraphs.length,
    headingCount: countElements(doc, "h1,h2,h3,h4,h5,h6"),
    tableCount: countElements(doc, "table"),
    tableCellCount: countElements(doc, "td,th"),
    imageCount: countElements(doc, "img"),
    anchorImageCount: countElements(doc, 'img[data-word-anchor="1"]'),
    wrappedImageCount: countElements(doc, "img[data-word-wrap]"),
    ommlCount: countElements(doc, "[data-word-omml]"),
    chartCount: countElements(doc, "[data-word-chart]"),
    smartArtCount: countElements(doc, "[data-word-smartart]"),
    listParagraphCount,
    commentRefCount: countElements(doc, "[data-word-comment-ref]"),
    revisionInsCount: countElements(doc, '[data-word-revision="ins"]'),
    revisionDelCount: countElements(doc, '[data-word-revision="del"]'),
    pageBreakCount: countElements(doc, "[data-word-page-break='1']"),
    pageSpacerCount: countElements(doc, "[data-word-page-spacer='1']"),
    textCharCount
  };
}

function ratioScore(actual, expected) {
  if (expected <= 0 && actual <= 0) return 1;
  if (expected <= 0 || actual < 0) return 0;
  const delta = Math.abs(actual - expected);
  const penalty = delta / expected;
  return Math.max(0, 1 - penalty);
}

function clamp01(v) {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function calculateFidelityScore(expected, actual) {
  const structure = clamp01(
    (
      ratioScore(actual.paragraphCount, expected.paragraphCount) +
      ratioScore(actual.headingCount, expected.headingCount) +
      ratioScore(actual.tableCount, expected.tableCount) +
      ratioScore(actual.tableCellCount, expected.tableCellCount) +
      ratioScore(actual.imageCount, expected.imageCount) +
      ratioScore(actual.ommlCount, expected.ommlCount) +
      ratioScore(actual.chartCount, expected.chartCount) +
      ratioScore(actual.smartArtCount, expected.smartArtCount) +
      ratioScore(actual.listParagraphCount, expected.listParagraphCount)
    ) / 9
  );

  const styleProxy = clamp01(ratioScore(actual.textCharCount, expected.textCharCount));
  const pagination = clamp01(ratioScore(actual.pageSpacerCount, expected.pageSpacerCount));
  const overall = clamp01(structure * 0.6 + styleProxy * 0.25 + pagination * 0.15);
  return { structure, styleProxy, pagination, overall };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const byKey = new Map();
  for (let i = 0; i < args.length; i += 1) {
    const raw = args[i];
    if (!raw.startsWith("--")) continue;
    byKey.set(raw.slice(2), args[i + 1]);
    i += 1;
  }
  return {
    reportOut: byKey.get("report-out") ?? join(ROOT, "artifacts/fidelity-report.md"),
    trendOut: byKey.get("trend-out") ?? join(ROOT, "artifacts/fidelity-trend.json")
  };
}

function ensureDirFor(path) {
  mkdirSync(dirname(path), { recursive: true });
}

function fmt(v) {
  return v.toFixed(4);
}

function main() {
  const { reportOut, trendOut } = parseArgs();
  const cases = JSON.parse(readFileSync(CASES_PATH, "utf8"));
  const caseRows = cases.map((c) => {
    const html = readFileSync(join(ROOT, c.htmlFile), "utf8");
    const actual = collectSemanticStatsFromHtml(html);
    const score = calculateFidelityScore(c.expected, actual);
    return { id: c.id, expected: c.expected, actual, score };
  });

  const overall = caseRows.reduce((sum, row) => sum + row.score.overall, 0) / Math.max(1, caseRows.length);
  const threshold = 0.95;

  const reportLines = [
    "# Fidelity Benchmark Report",
    "",
    `- date: ${new Date().toISOString()}`,
    `- cases: ${caseRows.length}`,
    `- overall_mean: ${fmt(overall)}`,
    `- threshold: ${threshold}`,
    "",
    "| case | structure | styleProxy | pagination | overall |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...caseRows.map((row) => `| ${row.id} | ${fmt(row.score.structure)} | ${fmt(row.score.styleProxy)} | ${fmt(row.score.pagination)} | ${fmt(row.score.overall)} |`)
  ];

  ensureDirFor(reportOut);
  writeFileSync(reportOut, reportLines.join("\n"));

  const trendEntry = {
    date: new Date().toISOString(),
    overallMean: overall,
    cases: caseRows.map((row) => ({ id: row.id, overall: row.score.overall }))
  };
  const history = existsSync(trendOut) ? JSON.parse(readFileSync(trendOut, "utf8")) : [];
  const nextHistory = [...history, trendEntry].slice(-100);
  ensureDirFor(trendOut);
  writeFileSync(trendOut, JSON.stringify(nextHistory, null, 2));

  console.log(reportLines.join("\n"));
  if (overall < threshold) {
    process.exitCode = 1;
  }
}

main();
