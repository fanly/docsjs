# docsjs Roadmap

Goal: build a practical, benchmarked Word fidelity pipeline for global developers.

## Current Status (v0.2.0)

- [x] Web Component core (`docs-word-editor`)
- [x] React/Vue adapters
- [x] Paste + `.docx` dual import pipeline
- [x] OIDC trusted npm publishing
- [x] Runnable React demo
- [x] Runnable Vue demo
- [x] Baseline tests (`pastePipeline`, `renderApply`)
- [x] Plugin architecture framework (23 built-in plugins)
- [x] OMML/MathML support with KaTeX output option
- [x] Fidelity benchmark suite (26 baseline tests)
- [x] 170 automated tests

## P0 (Next 2-4 weeks)

- [ ] Deep list fidelity
  - [ ] `lvlOverride/startOverride` support
  - [ ] Cross-section numbering continuity mode
  - [ ] Multi-level marker template edge cases (`%1.%2.%3`, legal/roman/letter)
- [ ] Deep table fidelity
  - [ ] `vMerge/gridSpan` merged cell mapping
  - [ ] Nested table rendering
  - [ ] `tblGrid/tcW` width and fixed layout restoration

## P1 (4-8 weeks)

- [ ] Anchor collision parity
  - [ ] Pixel-level text wrapping collision detection
  - [ ] Overlap handling policy
- [ ] Image and floating object fidelity
  - [ ] Crop/rotation/flip mapping
- [ ] Advanced semantics
  - [ ] track changes overlays
- [ ] Pagination precision
  - [ ] widow/orphan
  - [ ] keep-with-next + table split interaction

## P2 (Advanced)

- [ ] chart/SmartArt fallback rendering
- [ ] collaboration adapter hooks (CRDT-friendly event model)
- [ ] optional host-side sanitization profile (`fidelity-first` vs `strict`)

## Definition of Done

1. Core layout deviations are measurable and bounded against reference Word output.
2. Lists/tables/images preserve both semantics and visual relationships in benchmark fixtures.
3. CI gates regression with semantic + visual checks before release.
4. README/API examples stay aligned with released package behavior.
