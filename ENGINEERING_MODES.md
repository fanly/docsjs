# Engineering Profile

This project follows a strict-only parsing policy to keep the product goal consistent: fidelity-first and near-lossless Word paste/import.

## Runtime Policy

1. `Strict Only`  
Goal: preserve as many Word semantics as possible.  
Code expectations: explicit metadata output, no silent drops, deterministic snapshots.

## Parsing Contract

1. Any fidelity shortcut must remain schema-compatible (stable `data-word-*` markers).
2. New semantic support requires:
   - parser implementation
   - regression test
   - benchmark impact visibility
3. Public API additions must be backward compatible.

## Quality Gates

1. Mandatory before merge/release: `npm run verify`
2. Benchmark visibility: `npm run benchmark:fidelity`
3. Release gates in CI:
   - `ci.yml`
   - `fidelity-benchmark.yml`
   - publish workflows

## Review Checklist

1. Does the change improve or preserve snapshot determinism?
2. Are edge and regression tests included?
3. Does behavior stay within strict-only fidelity policy?
4. Is the output still minimal and host-app friendly?
