# @coding01/docsjs

Render-first Word fidelity component for the web.  
Import Word/WPS/Google Docs content from paste or `.docx` while preserving structure and layout as much as possible.

[![npm version](https://img.shields.io/npm/v/@coding01/docsjs)](https://www.npmjs.com/package/@coding01/docsjs)
[![npm downloads](https://img.shields.io/npm/dm/@coding01/docsjs)](https://www.npmjs.com/package/@coding01/docsjs)
[![GitHub stars](https://img.shields.io/github/stars/fanly/docsjs)](https://github.com/fanly/docsjs/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/fanly/docsjs)](https://github.com/fanly/docsjs/network)
[![GitHub issues](https://img.shields.io/github/issues/fanly/docsjs)](https://github.com/fanly/docsjs/issues)
[![CI](https://github.com/fanly/docsjs/actions/workflows/ci.yml/badge.svg)](https://github.com/fanly/docsjs/actions/workflows/ci.yml)
[![Pages](https://github.com/fanly/docsjs/actions/workflows/pages.yml/badge.svg)](https://github.com/fanly/docsjs/actions/workflows/pages.yml)

---

[中文文档](./README.zh-CN.md)

## GitHub Pages

- Product page: [https://docsjs.coding01.cn/](https://docsjs.coding01.cn/)
- Source: `docs/index.html`
- Deploy workflow: `.github/workflows/pages.yml`

## Recommended Pair: @coding01/docsjs-markdown

Use `@coding01/docsjs-markdown` to convert docsjs HTML snapshots (or DOCX) into Markdown for docs portals, knowledge bases, and static publishing workflows.

- npm: https://www.npmjs.com/package/@coding01/docsjs-markdown
- GitHub: https://github.com/fanly/docsjs-markdown
- Product page: https://fanly.github.io/docsjs-markdown/

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
- ✅ Plugin architecture framework

### Import Pipeline

- ✅ Clipboard import (`text/html`, `text/plain`)
- ✅ `.docx` upload + relationship media mapping
- ✅ Clipboard image hydration (`file:/blob:/cid:`)
- ✅ Output as stable HTML snapshot

### Cleanup Plugins (Paste Pipeline)

- ✅ Google Docs artifacts removal (`docs-internal-guid`, `google-sheets-html-origin`, `data-sheets-*`)
- ✅ WPS Office artifacts removal (`wps-*`, `kingsoft-*`)
- ✅ Word artifacts removal (`mso-*`, `class="Mso*"`, `o:/w:` namespaces)

### Content Plugins (DOCX Parser)

- ✅ Bookmark parsing
- ✅ Header/Footer reference parsing
- ✅ Section properties parsing (page size, margins, columns)
- ✅ Drop cap formatting
- ✅ Field parsing (PAGE, NUMPAGES, DATE, TOC)
- ✅ Cross-reference parsing
- ✅ Caption parsing

### Render Plugins

- ✅ VML/DrawingML shape rendering
- ✅ WordArt rendering
- ✅ OLE object placeholders
- ✅ Content control (SDT) parsing
- ✅ Watermark rendering
- ✅ Page background color

### Style Plugins

- ✅ Style inheritance from styles.xml
- ✅ List style parsing

### Layout Fidelity

- ✅ List reconstruction (`numId`, `ilvl`, `lvlText`)
- ✅ Table v1 (`tblGrid/tcW`, merge, border, spacing)
- ✅ Floating anchors v1 (`wp:anchor` metadata)
- ✅ Anchor collision parity (pixel-level wrap)

### Advanced Semantics

- ✅ Footnotes / endnotes / comments
- ✅ Revision markers (`ins` / `del`) + metadata
- ✅ Page break semantic markers
- ✅ DOCX hyperlink relationship + anchor mapping

### Semantic Fallback

- ✅ OMML fallback output
- ✅ Chart semantic extraction fallback
- ✅ SmartArt node fallback extraction
- ✅ OMML high-fidelity render pipeline (MathML/KaTeX)

### Engineering Quality

- ✅ 177 automated tests (regression + boundary + plugins)
- ✅ Baseline snapshot regression framework
- ✅ `verify` quality gate (lint/typecheck/test/build/size)
- ✅ Parse report API for performance tuning
- ✅ Plugin pipeline API for extensibility
<!-- GENERATED:FEATURE_CHECKLIST_EN:END -->

## What's New in v0.2.0

- Added **MathML high-fidelity rendering** with support for:
  - Fractions, superscripts, subscripts, superscript-subscript combinations
  - Square roots and nth roots
  - Overlines, underlines, accents
  - Limits, functions, operators
  - Bold and italic math text
  - Boxed and framed expressions
- Added **KaTeX output format** option for better rendering
- Added config option `outputFormat: "mathml" | "katex"`
- Added **anchor collision detection** for pixel-level wrap fidelity
- Added config option `features.anchors: boolean` to enable/disable anchor collision detection
- Added **deep list fidelity** with `lvlOverride/startOverride` support
- Added **deep table fidelity** with `vMerge/gridSpan` merged cell mapping and nested table rendering
- Added **cross-section numbering continuity** option (`listNumbering.continuous`)
- Added **multi-level marker template** support (`%1.%2.%3` patterns)
- Added **image transform support** (rotation, flip horizontal/vertical)
- Added **track changes** visualization (`data-word-revision="ins/del"`)
- Added **pagination precision** (widow/orphan control, keep-with-next)
- Added **sanitization profile** option (`sanitizationProfile: "fidelity-first" | "strict"`)
- Added **CRDT-friendly collaboration** events with timestamp and sequenceId
- Added **chart/SmartArt fallback** rendering

## What's New in v0.1.9

- Added **GitHub stats cards** to README for enhanced project presentation
- Used transparent theme with brand color (#0e8b78) to match docsjs design

## What's New in v0.1.8

- Added **plugin architecture framework** for extensibility:
  - Plugin registry with priority-based execution
  - Support for Cleanup, Transform, Parse phases
  - 23 built-in plugins for enhanced DOCX/Word/WPS/Google Docs support
- Added **cleanup plugins** for paste pipeline:
  - Google Docs artifacts removal (`docs-internal-guid`, `google-sheets-html-origin`, `data-sheets-*`)
  - WPS Office artifacts removal (`wps-*`, `kingsoft-*`)
  - Word artifacts removal (`mso-*`, `class="Mso*"`, Office XML namespaces)
- Added **content plugins** for DOCX parsing:
  - Bookmark, Header/Footer, Section, DropCap, Field, CrossRef, Caption
- Added **render plugins** for advanced elements:
  - VML/DrawingML shapes, WordArt, OLE objects, Content controls (SDT), Watermarks, Page backgrounds
- Added **style plugins** for enhanced styling:
  - Style inheritance, List style parsing
- Added **math plugin** for MathML conversion
- Test suite expanded to **157 tests**
- New `DocxPluginPipeline` API for custom plugin configurations

## What's New in v0.1.7

- Added comprehensive fidelity test suites:
  - Fidelity benchmark suite with 26 baseline tests
  - Deep list fidelity tests (7 tests)
  - Deep table fidelity tests (12 tests)
  - Anchor image layout tests (7 tests)
  - Footnote/endnote rendering tests (8 tests)
  - Revision tracking visualization tests (10 tests)
  - Pagination precision tests (widow/orphan, keep-with-next)
  - OMML formula rendering tests (fraction, subscript, sqrt)
- Test suite grew from 50+ to **125 tests**
- All tests follow TDD and lossless paste verification principles
- Added semantic statistics for pagination (spacer markers, widow/orphan)

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
