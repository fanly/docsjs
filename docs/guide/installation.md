---
layout: doc
---

# Installation

Learn how to install DocsJS in your project.

## Requirements

- Node.js 18.0 or higher
- npm, yarn, or pnpm

## Package Installation

::: code-group

```bash [npm]
npm install @coding01/docsjs
```

```bash [yarn]
yarn add @coding01/docsjs
```

```bash [pnpm]
pnpm add @coding01/docsjs
```

:::

## Peer Dependencies

DocsJS has optional peer dependencies based on your framework:

### React

```bash
npm install react react-dom
```

### Vue

```bash
npm install vue
```

## CDN Usage

For quick prototyping, you can use the CDN version:

```html
<script type="module">
  import { defineDocsWordElement } from "https://cdn.jsdelivr.net/npm/@coding01/docsjs@latest/dist/index.js";
  defineDocsWordElement();
</script>

<docs-word-editor></docs-word-editor>
```

## Verifying Installation

Create a simple test file to verify your installation:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>DocsJS Test</title>
  </head>
  <body>
    <script type="module">
      import { defineDocsWordElement } from "@coding01/docsjs";
      defineDocsWordElement();
    </script>

    <docs-word-editor lang="en"></docs-word-editor>
  </body>
</html>
```

## TypeScript Support

DocsJS is written in TypeScript and includes type definitions. No additional installation is required for TypeScript support.

```ts
import { defineDocsWordElement, CoreEngine } from "@coding01/docsjs";
import type { PluginConfig, ProfileConfig } from "@coding01/docsjs";
```

## Bundle-Size Friendly Imports

Use the narrowest entrypoint for your use-case:

- React: `@coding01/docsjs/react`
- Vue: `@coding01/docsjs/vue`
- Web component core only: `@coding01/docsjs/core`

Prefer ESM `import` and lazy-load heavy, low-frequency features:

```ts
const { BillingManager } = await import("@coding01/docsjs");
```

## Next Steps

- [Quick Start](/guide/quick-start) - Learn how to use DocsJS
- [API Reference](/api/) - Explore the full API
