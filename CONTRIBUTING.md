# Contributing

## Mandatory Quality Gate

Before committing, run:

```bash
npm run verify
```

This command enforces:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build`
5. `npm run sizecheck`

Commits should not be pushed if `verify` fails.

## Rules

Engineering standards are defined in `RULES.md`.

## Workflow

1. Add or update tests first.
2. Implement feature changes.
3. Keep README files aligned (`README.md`, `README.zh-CN.md`).
