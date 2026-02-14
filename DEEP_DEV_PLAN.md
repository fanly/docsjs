# docsjs Deep Development Plan

This plan turns the roadmap into an execution matrix with test-first rules.

## Delivery Rules

1. Tests first for every new parser/render behavior.
2. No merge without `typecheck`, `test`, `build`, and `sizecheck`.
3. Public API changes must update both `/README.md` and `/README.zh-CN.md`.
4. Bundle-size regression is blocked by CI budget checks.

## Parallel Worktree Strategy

Create independent worktrees to parallelize high-risk areas:

```bash
git worktree add ../docsjs-list-table codex/list-table-fidelity
git worktree add ../docsjs-image-anchor codex/image-anchor-fidelity
git worktree add ../docsjs-advanced-semantics codex/advanced-semantics
git worktree add ../docsjs-benchmark-ci codex/benchmark-ci
```

Recommended ownership:

- `codex/list-table-fidelity`: numbering overrides, merged cells, nested tables.
- `codex/image-anchor-fidelity`: `wp:anchor`, wrap mode, crop/rotation fallback.
- `codex/advanced-semantics`: footnotes/endnotes/comments/track changes read-only.
- `codex/benchmark-ci`: fixtures, fidelity scoring, visual regression, CI gates.

## Execution Checklist

### Track A: Benchmark and Quality Gates

- [ ] Add `fixtures/` corpus with baseline snapshots.
- [x] Add semantic stats utility and tests.
- [x] Add fidelity score utility and tests.
- [x] Add CI workflow for typecheck/test/build/sizecheck.
- [x] Add dist size budget checker.
- [ ] Add visual regression pipeline.

### Track B: Lists and Tables

- [x] Test: `lvlOverride/startOverride` and cross-section counters.
- [x] Implement numbering override parsing.
- [ ] Test: merged cells (`vMerge/gridSpan`) and nested table layout.
- [ ] Implement merged cell and nested table rendering.

### Track C: Images and Floating Objects

- [ ] Test: anchor position and wrap mode fixtures.
- [ ] Implement `wp:anchor` layout model.
- [ ] Test: crop/rotation fallback behavior.
- [ ] Implement crop/rotation mapping.

### Track D: Advanced Semantics

- [ ] Test: footnotes/endnotes extraction and link mapping.
- [ ] Implement footnote/endnote rendering.
- [ ] Test: comments and revisions overlay.
- [ ] Implement comment/revision read-only views.

## Acceptance Criteria

1. Fidelity score regression must be non-negative for golden fixtures.
2. Structural semantics (list/table/image/page breaks) must be preserved.
3. No increase above dist size budget unless explicitly approved.
