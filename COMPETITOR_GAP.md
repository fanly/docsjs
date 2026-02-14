# docsjs vs Competitors Gap Matrix

Last updated: 2026-02-14

## Scope

- `docsjs`: this repository, render-first import engine.
- `docxjs/docx-preview`: browser DOCX rendering reference.
- `mammoth.js`: semantic conversion reference.
- `CKEditor Paste from Office` / `TinyMCE PowerPaste`: editor-oriented paste references.

## Capability Matrix

- ✅ = implemented in docsjs now
- ⏳ = partial / MVP
- ❌ = not implemented

| Capability | docsjs | docxjs/docx-preview | mammoth.js | CKEditor/TinyMCE (office paste) | Gap Priority |
|---|---|---|---|---|---|
| Paste HTML import | ✅ | n/a | n/a | ✅ | - |
| DOCX upload parse | ✅ | ✅ | ✅ | ❌ | - |
| Paragraph/run basic style | ✅ | ✅ | ⏳ | ✅ | - |
| Numbering override (`lvlOverride/startOverride`) | ✅ | ✅ | ⏳ | ⏳ | - |
| Table merged cells / nested table | ✅ | ✅ | ⏳ | ⏳ | - |
| Inline image + size mapping | ✅ | ✅ | ⏳ | ✅ | - |
| Anchor image positioning (`wp:anchor`) | ✅ (MVP) | ✅ | ❌ | ⏳ | P1 |
| Wrap mode semantics | ✅ (marker-level) | ✅ | ❌ | ⏳ | P1 |
| Footnotes / Endnotes | ✅ (read-only) | ✅ | ⏳ | ⏳ | P1 |
| Comments | ✅ (read-only) | ✅ | ❌ | ✅ | P1 |
| Revisions (ins/del) | ✅ (read-only) | ✅ | ❌ | ✅ | P1 |
| Visual regression harness | ⏳ (baseline framework) | varies | n/a | vendor internal | P0 |
| True screenshot diff CI | ❌ | varies | n/a | vendor internal | P0 |

## Priority Backlog (Auto-Execution Order)

1. P0: Visual regression pipeline (Playwright screenshot + diff artifacts in CI).
2. P0: Baseline fixture corpus expansion (`fixtures/*.docx` + semantic expected outputs).
3. P1: Anchor wrap behavior from marker-level to layout-level fidelity.
4. P1: Revision metadata (author/time) and comment range highlighting.
5. P1: Table layout precision (`tblGrid/tcW` width strategy under complex wraps).

## Implemented in This Sprint

- ✅ comments read-only rendering.
- ✅ revisions ins/del read-only rendering.
- ✅ anchor wrap mode markers.
- ✅ baseline regression framework and expanded test corpus.
