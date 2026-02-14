# docsjs Roadmap

Goal: build a practical, benchmarked Word fidelity pipeline for global developers.

## Current Status

- [x] Web Component core (`docs-word-editor`)
- [x] React/Vue adapters
- [x] Paste + `.docx` dual import pipeline
- [x] OIDC trusted npm publishing
- [x] Runnable React demo
- [x] Runnable Vue demo
- [x] Baseline tests (`pastePipeline`, `renderApply`)
- [ ] Fidelity benchmark corpus and scorecard

## P0 (Next 2-4 weeks)

- [ ] Build a fidelity benchmark suite
  - [ ] Add `fixtures/` corpus: contract, resume, report, mixed-language document
  - [ ] Add semantic diff tests: list/tree/table/image stats
  - [ ] Add visual regression tests (Playwright screenshot compare)
  - [ ] Output Fidelity Score: structure/style/pagination
- [ ] Deep list fidelity
  - [ ] `lvlOverride/startOverride` support
  - [ ] Cross-section numbering continuity mode
  - [ ] Multi-level marker template edge cases (`%1.%2.%3`, legal/roman/letter)
- [ ] Deep table fidelity
  - [ ] `vMerge/gridSpan` merged cell mapping
  - [ ] Nested table rendering
  - [ ] `tblGrid/tcW` width and fixed layout restoration

## P1 (4-8 weeks)

- [ ] Image and floating object fidelity
  - [ ] `wp:anchor` absolute/relative positioning
  - [ ] Text wrap modes (`square`, `tight`, `topAndBottom`)
  - [ ] Crop/rotation/flip mapping
- [ ] Advanced semantics (read-only first)
  - [ ] footnotes/endnotes
  - [ ] comments
  - [ ] track changes overlays
- [ ] Pagination precision
  - [ ] widow/orphan
  - [ ] keep-with-next + table split interaction

## P2 (Advanced)

- [ ] OMML equation fallback and plugin extension point
- [ ] chart/SmartArt fallback rendering
- [ ] collaboration adapter hooks (CRDT-friendly event model)
- [ ] optional host-side sanitization profile (`fidelity-first` vs `strict`)

## Definition of Done

1. Core layout deviations are measurable and bounded against reference Word output.
2. Lists/tables/images preserve both semantics and visual relationships in benchmark fixtures.
3. CI gates regression with semantic + visual checks before release.
4. README/API examples stay aligned with released package behavior.
