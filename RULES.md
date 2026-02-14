# docsjs Engineering Rules

## Code Standards

1. TypeScript strict mode is mandatory.
2. Public APIs are backward-compatible by default.
3. All new logic must include unit tests before implementation.
4. Avoid hidden side effects in module top-level code.
5. Keep runtime dependencies minimal and justified.
6. Favor deterministic rendering over heuristic-only behavior.
7. Do not weaken lint rules to bypass existing violations; fix code to comply.

## Test Standards

1. Every parser/render feature requires:
   - a positive fixture case,
   - at least one edge case,
   - at least one regression case when applicable.
2. Tests must pass in CI using `npm run test`.
3. New fixture semantics must be reflected in fidelity scoring.
4. Submission gate is `npm run verify` and must pass before commit.

## Performance and Package Size

1. Keep install surface small:
   - publish only `dist`,
   - avoid non-essential runtime dependencies.
2. Dist budget is enforced with `npm run sizecheck`.
3. Any budget increase requires explicit commit message rationale.

## Documentation Rules

1. Keep `/README.md` (English) and `/README.zh-CN.md` (Chinese) consistent.
2. Update roadmap and deep plan when milestones move.
3. Include migration notes for any breaking changes.
