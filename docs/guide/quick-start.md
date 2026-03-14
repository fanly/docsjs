---
layout: doc
---

# Quick Start

Get started with DocsJS in minutes. Choose your framework below.

## Web Component

The simplest way to use DocsJS. Works in any HTML page.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>DocsJS Demo</title>
  </head>
  <body>
    <script type="module">
      import { defineDocsWordElement } from "@coding01/docsjs";
      defineDocsWordElement();
    </script>

    <docs-word-editor lang="en" show-toolbar></docs-word-editor>

    <script type="module">
      const editor = document.querySelector("docs-word-editor");

      editor.addEventListener("docsjs-change", (e) => {
        console.log("Content changed:", e.detail.htmlSnapshot);
      });

      editor.addEventListener("docsjs-ready", () => {
        console.log("Editor is ready!");
      });
    </script>
  </body>
</html>
```

### Available Attributes

| Attribute      | Type      | Default     | Description        |
| -------------- | --------- | ----------- | ------------------ |
| `lang`         | `string`  | `'en'`      | Language (en/zh)   |
| `show-toolbar` | `boolean` | `false`     | Show toolbar       |
| `profile`      | `string`  | `'default'` | Processing profile |

### Available Events

| Event           | Detail             | Description     |
| --------------- | ------------------ | --------------- |
| `docsjs-change` | `{ htmlSnapshot }` | Content changed |
| `docsjs-ready`  | `{}`               | Component ready |
| `docsjs-error`  | `{ error }`        | Error occurred  |

### Available Methods

```js
const editor = document.querySelector("docs-word-editor");

// Load content
await editor.loadHtml("<p>HTML content</p>");
await editor.loadDocx(file); // File object
await editor.loadClipboard();

// Get output
const html = editor.getSnapshot();

// Clear content
editor.clear();
```

## React

```tsx
import { WordFidelityEditorReact } from "@coding01/docsjs/react";

function App() {
  const handleReady = () => {
    console.log("Editor is ready!");
  };

  const handleChange = ({ htmlSnapshot, textContent }) => {
    console.log("Content changed:", htmlSnapshot);
  };

  const handleError = ({ error }) => {
    console.error("Error:", error);
  };

  return (
    <WordFidelityEditorReact
      lang="en"
      showToolbar={true}
      profile="knowledge-base"
      onReady={handleReady}
      onChange={handleChange}
      onError={handleError}
    />
  );
}

export default App;
```

### Props

| Prop          | Type       | Default     | Description          |
| ------------- | ---------- | ----------- | -------------------- |
| `lang`        | `string`   | `'en'`      | Language (en/zh)     |
| `showToolbar` | `boolean`  | `false`     | Show toolbar         |
| `profile`     | `string`   | `'default'` | Processing profile   |
| `config`      | `object`   | `{}`        | Engine configuration |
| `onReady`     | `function` | -           | Ready callback       |
| `onChange`    | `function` | -           | Change callback      |
| `onError`     | `function` | -           | Error callback       |

## Vue

```vue
<template>
  <WordFidelityEditorVue
    lang="en"
    :show-toolbar="true"
    profile="knowledge-base"
    @ready="onReady"
    @change="onChange"
    @error="onError"
  />
</template>

<script setup>
import { WordFidelityEditorVue } from "@coding01/docsjs/vue";

const onReady = () => {
  console.log("Editor is ready!");
};

const onChange = ({ htmlSnapshot, textContent }) => {
  console.log("Content changed:", htmlSnapshot);
};

const onError = ({ error }) => {
  console.error("Error:", error);
};
</script>
```

### Props

| Prop          | Type      | Default     | Description          |
| ------------- | --------- | ----------- | -------------------- |
| `lang`        | `string`  | `'en'`      | Language (en/zh)     |
| `showToolbar` | `boolean` | `false`     | Show toolbar         |
| `profile`     | `string`  | `'default'` | Processing profile   |
| `config`      | `object`  | `{}`        | Engine configuration |

### Events

| Event    | Payload                         | Description     |
| -------- | ------------------------------- | --------------- |
| `ready`  | `{}`                            | Editor ready    |
| `change` | `{ htmlSnapshot, textContent }` | Content changed |
| `error`  | `{ error }`                     | Error occurred  |

## Advanced Usage with CoreEngine

For programmatic document processing:

```ts
import { CoreEngine } from "@coding01/docsjs";

const engine = new CoreEngine();

// Apply a processing profile
engine.applyProfile("knowledge-base");

// Register a custom plugin
const myPlugin = {
  name: "my-plugin",
  availableHooks: ["afterParse"],
  permissions: {
    ast: { canModifySemantics: true },
  },
  afterParse: (context) => {
    // Transform the AST
    return context;
  },
};

engine.registerPlugin(myPlugin);

// Transform a document
const file = new File(["..."], "document.docx");
const result = await engine.transformDocument(file);

console.log(result.output); // Converted content
console.log(result.diagnostics); // Errors and warnings
console.log(result.metrics); // Performance data
```

## Next Steps

- [Architecture](/guide/architecture) - Understand the core architecture
- [Plugin System](/guide/plugins) - Build custom plugins
- [Profile System](/guide/profiles) - Configure processing behavior
- [API Reference](/api/) - Full API documentation
