# @coding01/docsjs

Render-first Word fidelity component for the web.  
Import Word/WPS/Google Docs content from paste or `.docx` while preserving structure and layout as much as possible.

[中文文档](./README.zh-CN.md)

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
  - payload: `{ htmlSnapshot: string; source: "paste" | "upload" | "api" | "clear"; fileName?: string }`
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

- ✅ Web Component core (`docs-word-editor`)
- ✅ React adapter (`@coding01/docsjs/react`)
- ✅ Vue adapter (`@coding01/docsjs/vue`)
- ✅ Paste import (`text/html`, `text/plain`)
- ✅ Clipboard image hydration (`file:/blob:/cid:/mhtml:` to data URL)
- ✅ `.docx` upload and parse
- ✅ Basic paragraph semantics (alignment, headings, line break)
- ✅ Basic run styles (bold/italic/underline/strike/color/highlight/super/sub)
- ✅ List reconstruction (`numId` + `ilvl` + `lvlText`)
- ✅ Basic table structure (`table/tr/td`)
- ✅ Embedded image relationship mapping (`rId -> media`)
- ✅ Page geometry mapping (page height, margins, content width)
- ✅ Runtime render fixes (`mso-*` compatibility, pagination spacer, empty paragraph normalization)
- ✅ Events and public methods
- ✅ React and Vue runnable demos
- ✅ npm publish workflow with OIDC trusted publishing
- ⏳ Floating anchors (`wp:anchor`) full layout fidelity
- ⏳ Merged cells / nested tables full fidelity
- ⏳ Footnotes / endnotes / comments / track changes
- ⏳ OMML / charts / SmartArt
- ⏳ Automated fidelity benchmark scorecard

## What's New in v0.1.3

- Added deep DOCX semantics:
  - numbering overrides (`lvlOverride/startOverride`)
  - merged cells (`vMerge/gridSpan`) and nested tables
  - footnotes and endnotes (read-only rendering)
  - comments (read-only rendering)
  - revisions insert/delete markers (read-only rendering)
  - page break semantic markers (`w:br type=page`, `lastRenderedPageBreak`)
- Added floating image MVP:
  - anchor position mapping (`wp:anchor`)
  - wrap mode markers (`square`, `tight`, `topAndBottom`, `none`)
- Added fidelity tooling:
  - semantic stats collector
  - fidelity score calculator
  - baseline regression framework (config-driven)
  - visual regression workflow scaffold (Playwright + diff artifacts)
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
```

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

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for prioritized execution plan (P0/P1/P2) and acceptance criteria.

## Security Notes

- Default mode is fidelity-first and keeps Word inline styles.
- In production, configure CSP, iframe sandbox, file upload allowlist, and optional host-side sanitization.

## Support This Project

If this project saves your time, a small tip is appreciated.

![Support docsjs](https://image.coding01.cn/Coding01%20%E8%B5%9E%E8%B5%8F%E7%A0%81.png)

`“加个鸡腿💪(ﾟωﾟ💪)”`
