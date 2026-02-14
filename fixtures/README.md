# Fidelity Fixtures

This folder stores golden documents for parser/render regression.

## Naming Convention

- `xx-<topic>.docx`: source fixture.
- `xx-<topic>.expected.html`: expected structure snapshot.
- `xx-<topic>.meta.json`: semantic baseline counters and notes.

## Planned Fixture Set

- `01-basic-paragraphs`
- `02-multilevel-numbering`
- `03-table-merge-nested`
- `04-images-inline-anchor`
- `05-footnote-comments`
- `06-mixed-language-cjk-latin`

## Baseline Regression

- Config-driven baseline tests live in:
  - `tests/lib/baselines/docxHtml.baselines.ts`
  - `tests/lib/docxHtml.baselines.test.ts`
- Visual baseline workflow:
  - cases: `fixtures/visual/cases.json`
  - scripts: `npm run visual:update` / `npm run visual:test`
  - CI: `.github/workflows/visual-regression.yml`
