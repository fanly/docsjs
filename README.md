# docsjs

Render-first Word fidelity component that supports:

- Paste from Word / WPS / Google Docs
- Upload `.docx` and render high-fidelity HTML snapshot
- Iframe isolated rendering + Word style model apply
- One core implementation with both React and Vue adapters

## Install

```bash
npm i docsjs jszip
```

## React

```tsx
import { WordFidelityEditorReact } from "docsjs";

export default function Page() {
  return (
    <WordFidelityEditorReact
      onChange={(e) => console.log(e.htmlSnapshot)}
      onError={(e) => console.error(e.message)}
    />
  );
}
```

## Vue

```ts
import { WordFidelityEditorVue } from "docsjs";
```

```vue
<template>
  <WordFidelityEditorVue @change="onChange" @error="onError" />
</template>

<script setup lang="ts">
import { WordFidelityEditorVue } from "docsjs";

const onChange = (payload: { htmlSnapshot: string }) => console.log(payload.htmlSnapshot);
const onError = (payload: { message: string }) => console.error(payload.message);
</script>
```

## Build

```bash
npm install
npm run typecheck
npm run build
```

## Notes

- This package is render-first: it does not sanitize away Word inline styles by default.
- For production hardening, host-side CSP/sandbox policy should be configured according to your threat model.
