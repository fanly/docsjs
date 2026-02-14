# @coding01/docsjs

Render-first Word fidelity component for the web.  
Import Word/WPS/Google Docs content from paste or `.docx` while preserving structure and layout as much as possible.

[![npm version](https://img.shields.io/npm/v/@coding01/docsjs)](https://www.npmjs.com/package/@coding01/docsjs)
[![npm downloads](https://img.shields.io/npm/dm/@coding01/docsjs)](https://www.npmjs.com/package/@coding01/docsjs)
[![CI](https://github.com/fanly/docsjs/actions/workflows/ci.yml/badge.svg)](https://github.com/fanly/docsjs/actions/workflows/ci.yml)
[![Pages](https://github.com/fanly/docsjs/actions/workflows/pages.yml/badge.svg)](https://github.com/fanly/docsjs/actions/workflows/pages.yml)

[中文文档](./README.zh-CN.md)

## GitHub Pages

- Product page: [https://docsjs.coding01.cn/](https://docsjs.coding01.cn/)
- Source: `docs/index.html`
- Deploy workflow: `.github/workflows/pages.yml`

## What You Get

- Web Component core: `docs-word-editor`
- React adapter: `WordFidelityEditorReact`
- Vue adapter: `WordFidelityEditorVue`
- Import pipeline: clipboard paste + `.docx` upload
- HTML snapshot output for downstream rendering/storage

## Installation

```bash
npm i @coding01/docsjs
```

## Quick Start

### React

```tsx
import { WordFidelityEditorReact } from "@coding01/docsjs/react";

export default function Page() {
  return (
    <WordFidelityEditorReact
      onChange={(payload) => console.log(payload.htmlSnapshot)}
      onError={(payload) => console.error(payload.message)}
    />
  );
}
```

### Vue

```vue
<template>
  <WordFidelityEditorVue @change="onChange" @error="onError" />
</template>

<script setup lang="ts">
import { WordFidelityEditorVue } from "@coding01/docsjs/vue";
const onChange = (payload: { htmlSnapshot: string }) => console.log(payload.htmlSnapshot);
const onError = (payload: { message: string }) => console.error(payload.message);
</script>
```

### Web Component

```ts
import { defineDocsWordElement } from "@coding01/docsjs";

defineDocsWordElement();
const el = document.createElement("docs-word-editor");
document.body.appendChild(el);

el.addEventListener("docsjs-change", (e) => {
  const detail = (e as CustomEvent<{ htmlSnapshot: string }>).detail;
  console.log(detail.htmlSnapshot);
});
```

## API

### Events

- `docsjs-change`
  - payload: `{ htmlSnapshot: string; source: "paste" | "upload" | "api" | "clear"; fileName?: string; parseReport?: DocxParseReport }`
- `docsjs-error`
  - payload: `{ message: string }`
- `docsjs-ready`
  - payload: `{ version: string }`

### Methods

- `loadHtml(rawHtml: string): void`
- `loadDocx(file: File): Promise<void>`
- `loadClipboard(): Promise<void>`
- `getSnapshot(): string`
- `clear(): void`

### Attributes

- `lang="zh|en"`
- `show-toolbar="true|false|1|0"`

## Feature Checklist

<!-- GENERATED:FEATURE_CHECKLIST_EN:START -->
### Core

- ✅ Web Component core (`docs-word-editor`)
- ✅ React adapter + Vue adapter
- ✅ Events and imperative public API
- ✅ Strict-only parser strategy

### Import Pipeline

- ✅ Clipboard import (`text/html`, `text/plain`)
- ✅ `.docx` upload + relationship media mapping
- ✅ Clipboard image hydration (`file:/blob:/cid:`)
- ✅ Output as stable HTML snapshot

### Layout Fidelity

- ✅ List reconstruction (`numId`, `ilvl`, `lvlText`)
- ✅ Table v1 (`tblGrid/tcW`, merge, border, spacing)
- ✅ Floating anchors v1 (`wp:anchor` metadata)
- ⏳ Anchor collision parity (pixel-level wrap)

### Advanced Semantics

- ✅ Footnotes / endnotes / comments
- ✅ Revision markers (`ins` / `del`) + metadata
- ✅ Page break semantic markers
- ✅ DOCX hyperlink relationship + anchor mapping

### Semantic Fallback

- ✅ OMML fallback output
- ✅ Chart semantic extraction fallback
- ✅ SmartArt node fallback extraction
- ⏳ OMML high-fidelity render pipeline (MathML/KaTeX)

### Engineering Quality

- ✅ 50 automated tests (regression + boundary)
- ✅ Baseline snapshot regression framework
- ✅ `verify` quality gate (lint/typecheck/test/build/size)
- ✅ Parse report API for performance tuning
<!-- GENERATED:FEATURE_CHECKLIST_EN:END -->

## What's New in v0.1.3

- Added deep DOCX semantics:
  - numbering overrides (`lvlOverride/startOverride`)
  - merged cells (`vMerge/gridSpan`) and nested tables
  - footnotes and endnotes (read-only rendering)
  - comments (read-only rendering)
  - revisions insert/delete markers (read-only rendering)
  - comment range markers and revision metadata attributes
  - page break semantic markers (`w:br type=page`, `lastRenderedPageBreak`)
  - table width mapping (`tblGrid/gridCol`, `tcW`)
  - table border model / cell spacing / table-layout mapping
  - OMML formula fallback rendering and chart/SmartArt semantic fallback
- Added floating image MVP:
  - anchor position mapping (`wp:anchor`)
  - wrap mode markers (`square`, `tight`, `topAndBottom`, `none`)
  - anchor layout metadata (`relativeFrom`, `behindDoc`, `allowOverlap`, `layoutInCell`, `relativeHeight`, `dist*`)
- Added fidelity tooling:
  - semantic stats collector
  - fidelity score calculator
  - baseline regression framework (config-driven)
  - visual regression workflow scaffold (Playwright + diff artifacts)
  - golden corpus benchmark + trend report workflow (`fidelity-benchmark.yml`)
- Added engineering quality gates:
  - ESLint + strict verify pipeline (`lint`, `typecheck`, `test`, `build`, `sizecheck`)
  - CI workflow for mandatory quality checks
  - contribution/rules/deep-plan docs
- Demo upgrades:
  - React and Vue demos now include bilingual toggle (`zh` / `en`)
  - component inner toolbar language follows selected locale
  - semantic dashboard expanded with new indicators (anchor/wrap/comments/revisions/page-break)

## Development

```bash
npm install
npm run typecheck
npm run test
npm run build
npm run benchmark:fidelity
```

## Engineering Modes

- Spec and conventions: [ENGINEERING_MODES.md](./ENGINEERING_MODES.md)
- Parse API now supports:
  - `parseDocxToHtmlSnapshot(file)`
  - `parseDocxToHtmlSnapshotWithReport(file)`

## Demos

### React demo

```bash
cd demos/react-demo
npm install
npm run dev
```

### Vue demo

```bash
cd demos/vue-demo
npm install
npm run dev
```

## Publishing

### Manual

```bash
npm login
npm version patch
git push origin main --follow-tags
npm publish --access public
```

### GitHub Actions

Workflow: `.github/workflows/publish.yml`

- Trigger: push tag `v*.*.*`
- Steps: `npm ci` -> `npm run typecheck` -> `npm run build` -> `npm publish --provenance`

### GitHub Packages (repo sidebar "Packages")

Workflow: `.github/workflows/publish-github-packages.yml`

- Trigger: push tag `v*.*.*` or manual run
- Target registry: `https://npm.pkg.github.com`
- Package name in GitHub Packages: `@fanly/docsjs`
- Note: GitHub sidebar "Packages" only shows packages published to GitHub Packages, not npmjs

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for prioritized execution plan (P0/P1/P2) and acceptance criteria.

## Security Notes

- Default mode is fidelity-first and keeps Word inline styles.
- In production, configure CSP, iframe sandbox, file upload allowlist, and optional host-side sanitization.

## Support This Project

If this project saves your time, a small tip is appreciated.

![Support docsjs](https://image.coding01.cn/Coding01%20%E8%B5%9E%E8%B5%8F%E7%A0%81.png)

`“加个鸡腿💪(ﾟωﾟ💪)”`
