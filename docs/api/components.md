---
layout: doc
---

# Components API

API reference for DocsJS UI components.

## Web Component

### Usage

```html
<script type="module">
  import { defineDocsWordElement } from "@coding01/docsjs";
  defineDocsWordElement();
</script>

<docs-word-editor lang="en" show-toolbar></docs-word-editor>
```

### Attributes

| Attribute      | Type      | Default     | Description         |
| -------------- | --------- | ----------- | ------------------- |
| `lang`         | `string`  | `'en'`      | UI language (en/zh) |
| `show-toolbar` | `boolean` | `false`     | Show toolbar        |
| `profile`      | `string`  | `'default'` | Processing profile  |
| `readonly`     | `boolean` | `false`     | Read-only mode      |
| `placeholder`  | `string`  | `''`        | Placeholder text    |

### Methods

#### loadHtml

```ts
loadHtml(html: string): Promise<void>
```

Load HTML content into the editor.

```js
const editor = document.querySelector("docs-word-editor");
await editor.loadHtml("<p>Hello World</p>");
```

#### loadDocx

```ts
loadDocx(file: File): Promise<void>
```

Load a DOCX file into the editor.

```js
const file = document.getElementById("file-input").files[0];
await editor.loadDocx(file);
```

#### loadClipboard

```ts
loadClipboard(): Promise<void>
```

Load content from the clipboard.

```js
await editor.loadClipboard();
```

#### getSnapshot

```ts
getSnapshot(): string
```

Get the current HTML content.

```js
const html = editor.getSnapshot();
```

#### clear

```ts
clear(): void
```

Clear the editor content.

```js
editor.clear();
```

#### focus

```ts
focus(): void
```

Focus the editor.

```js
editor.focus();
```

## React Component

### Import

```tsx
import { WordFidelityEditorReact } from "@coding01/docsjs/react";
```

### Props

| Prop          | Type                       | Default     | Description          |
| ------------- | -------------------------- | ----------- | -------------------- |
| `lang`        | `string`                   | `'en'`      | UI language          |
| `showToolbar` | `boolean`                  | `false`     | Show toolbar         |
| `profile`     | `string`                   | `'default'` | Processing profile   |
| `config`      | `EngineConfig`             | `{}`        | Engine configuration |
| `readonly`    | `boolean`                  | `false`     | Read-only mode       |
| `placeholder` | `string`                   | `''`        | Placeholder text     |
| `className`   | `string`                   | `''`        | CSS class name       |
| `style`       | `CSSProperties`            | `{}`        | Inline styles        |
| `onReady`     | `() => void`               | -           | Ready callback       |
| `onChange`    | `(e: ChangeEvent) => void` | -           | Change callback      |
| `onError`     | `(e: ErrorEvent) => void`  | -           | Error callback       |

### Example

```tsx
import { useRef } from "react";
import { WordFidelityEditorReact } from "@coding01/docsjs/react";

function App() {
  const editorRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && editorRef.current) {
      await editorRef.current.loadDocx(file);
    }
  };

  return (
    <div>
      <input type="file" accept=".docx" onChange={handleFileUpload} />
      <WordFidelityEditorReact
        ref={editorRef}
        lang="en"
        showToolbar={true}
        onChange={(e) => console.log(e.htmlSnapshot)}
      />
    </div>
  );
}
```

### Ref Methods

The ref provides access to all Web Component methods:

```tsx
const editorRef = useRef(null);

// Access methods
await editorRef.current?.loadHtml(html);
await editorRef.current?.loadDocx(file);
const snapshot = editorRef.current?.getSnapshot();
editorRef.current?.clear();
```

## Vue Component

### Import

```vue
<script setup>
import { WordFidelityEditorVue } from "@coding01/docsjs/vue";
</script>
```

### Props

| Prop          | Type           | Default     | Description          |
| ------------- | -------------- | ----------- | -------------------- |
| `lang`        | `string`       | `'en'`      | UI language          |
| `showToolbar` | `boolean`      | `false`     | Show toolbar         |
| `profile`     | `string`       | `'default'` | Processing profile   |
| `config`      | `EngineConfig` | `{}`        | Engine configuration |
| `readonly`    | `boolean`      | `false`     | Read-only mode       |
| `placeholder` | `string`       | `''`        | Placeholder text     |

### Events

| Event    | Payload                         | Description     |
| -------- | ------------------------------- | --------------- |
| `ready`  | `{}`                            | Editor ready    |
| `change` | `{ htmlSnapshot, textContent }` | Content changed |
| `error`  | `{ error }`                     | Error occurred  |

### Example

```vue
<template>
  <WordFidelityEditorVue
    ref="editorRef"
    lang="en"
    :show-toolbar="true"
    @ready="onReady"
    @change="onChange"
  />
</template>

<script setup>
import { ref } from "vue";
import { WordFidelityEditorVue } from "@coding01/docsjs/vue";

const editorRef = ref(null);

const onReady = () => {
  console.log("Editor ready");
};

const onChange = ({ htmlSnapshot }) => {
  console.log("Content:", htmlSnapshot);
};

const loadFile = async (file) => {
  await editorRef.value?.loadDocx(file);
};
</script>
```

### Template Ref Methods

Access component methods via template ref:

```vue
<script setup>
const editorRef = ref(null);

const handleUpload = async (e) => {
  const file = e.target.files[0];
  await editorRef.value?.loadDocx(file);
};
</script>
```

## Next Steps

- [CoreEngine API](/api/core-engine) - Engine reference
- [Events API](/api/events) - Event handling
- [Types](/api/types) - Complete type reference
