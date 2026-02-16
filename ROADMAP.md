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
- [x] Anchor collision detection (pixel-level wrap)
- [x] 177 automated tests

## P0 (Next 2-4 weeks)

- [x] Deep list fidelity
  - [x] `lvlOverride/startOverride` support
  - [x] Cross-section numbering continuity mode
  - [x] Multi-level marker template edge cases (`%1.%2.%3`, legal/roman/letter)
- [x] Deep table fidelity
  - [x] `vMerge/gridSpan` merged cell mapping
  - [x] Nested table rendering
  - [x] `tblGrid/tcW` width and fixed layout restoration

## P1 (4-8 weeks)

- [x] Anchor collision parity
  - [x] Pixel-level text wrapping collision detection
  - [x] Overlap handling policy
- [x] Image and floating object fidelity
  - [x] Crop/rotation/flip mapping
- [x] Advanced semantics
  - [x] track changes overlays
- [x] Pagination precision
  - [x] widow/orphan
  - [x] keep-with-next + table split interaction

## P2 (Advanced)

- [x] chart/SmartArt fallback rendering
- [x] collaboration adapter hooks (CRDT-friendly event model)
- [x] optional host-side sanitization profile (`fidelity-first` vs `strict`)

## Definition of Done

1. Core layout deviations are measurable and bounded against reference Word output.
2. Lists/tables/images preserve both semantics and visual relationships in benchmark fixtures.
3. CI gates regression with semantic + visual checks before release.
4. README/API examples stay aligned with released package behavior.
