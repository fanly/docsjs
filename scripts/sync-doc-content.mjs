import { readFileSync, writeFileSync } from "node:fs";

const ROOT = process.cwd();
const DATA_PATH = `${ROOT}/docs/content/feature-checklist.json`;
const README_EN = `${ROOT}/README.md`;
const README_ZH = `${ROOT}/README.zh-CN.md`;
const LANDING = `${ROOT}/docs/index.html`;

const data = JSON.parse(readFileSync(DATA_PATH, "utf8"));

function replaceBetween(text, startTag, endTag, generated) {
  const start = text.indexOf(startTag);
  const end = text.indexOf(endTag);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Markers not found or invalid: ${startTag} ... ${endTag}`);
  }
  const before = text.slice(0, start + startTag.length);
  const after = text.slice(end);
  return `${before}\n${generated}\n${after}`;
}

function statusIcon(status) {
  return status === "done" ? "✅" : "⏳";
}

function markdownChecklist(lang) {
  return data.groups
    .map((group) => {
      const title = lang === "en" ? group.title.en : group.title.zh;
      const items = group.items
        .map((item) => `- ${statusIcon(item.status)} ${lang === "en" ? item.en : item.zh}`)
        .join("\n");
      return `### ${title}\n\n${items}`;
    })
    .join("\n\n");
}

function featureCardsHtml() {
  return data.groups
    .map((group) => {
      const groupKey = `feat_${group.id}_title`;
      const items = group.items
        .map((item, idx) => {
          const itemKey = `feat_${group.id}_item_${idx + 1}`;
          return `              <li data-i18n="${itemKey}">${statusIcon(item.status)} ${item.en}</li>`;
        })
        .join("\n");
      return `<article class="card">\n            <h3 data-i18n="${groupKey}">${group.title.en}</h3>\n            <ul class="checklist">\n${items}\n            </ul>\n          </article>`;
    })
    .join("\n");
}

function escapeJs(value) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function featureI18n(lang) {
  const lines = [];
  for (const group of data.groups) {
    lines.push(`feat_${group.id}_title: "${escapeJs(lang === "en" ? group.title.en : group.title.zh)}",`);
    group.items.forEach((item, idx) => {
      lines.push(`feat_${group.id}_item_${idx + 1}: "${escapeJs(`${statusIcon(item.status)} ${lang === "en" ? item.en : item.zh}`)}",`);
    });
  }
  return lines.map((line) => `          ${line}`).join("\n");
}

let readmeEn = readFileSync(README_EN, "utf8");
readmeEn = replaceBetween(
  readmeEn,
  "<!-- GENERATED:FEATURE_CHECKLIST_EN:START -->",
  "<!-- GENERATED:FEATURE_CHECKLIST_EN:END -->",
  markdownChecklist("en")
);
writeFileSync(README_EN, readmeEn);

let readmeZh = readFileSync(README_ZH, "utf8");
readmeZh = replaceBetween(
  readmeZh,
  "<!-- GENERATED:FEATURE_CHECKLIST_ZH:START -->",
  "<!-- GENERATED:FEATURE_CHECKLIST_ZH:END -->",
  markdownChecklist("zh")
);
writeFileSync(README_ZH, readmeZh);

let landing = readFileSync(LANDING, "utf8");
landing = replaceBetween(
  landing,
  "<!-- GENERATED:FEATURE_CARDS:START -->",
  "<!-- GENERATED:FEATURE_CARDS:END -->",
  featureCardsHtml()
);
landing = replaceBetween(
  landing,
  "/* GENERATED:FEATURE_I18N_EN:START */",
  "/* GENERATED:FEATURE_I18N_EN:END */",
  featureI18n("en")
);
landing = replaceBetween(
  landing,
  "/* GENERATED:FEATURE_I18N_ZH:START */",
  "/* GENERATED:FEATURE_I18N_ZH:END */",
  featureI18n("zh")
);
writeFileSync(LANDING, landing);

console.log("[sync-doc-content] Updated README.md, README.zh-CN.md, docs/index.html from docs/content/feature-checklist.json");
