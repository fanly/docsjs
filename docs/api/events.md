---
layout: doc
---

# Events API

Event handling reference for DocsJS components.

## Overview

DocsJS components emit events for content changes, readiness, and errors. All events follow the CustomEvent pattern.

## Event Types

### docsjs-change

Fired when content changes in the editor.

#### Detail

```ts
interface ChangeEventDetail {
  htmlSnapshot: string;
  textContent: string;
  wordCount: number;
  charCount: number;
}
```

#### Example

```js
const editor = document.querySelector("docs-word-editor");

editor.addEventListener("docsjs-change", (e) => {
  const { htmlSnapshot, textContent, wordCount } = e.detail;
  console.log("HTML:", htmlSnapshot);
  console.log("Text:", textContent);
  console.log("Words:", wordCount);
});
```

### docsjs-ready

Fired when the editor is fully initialized and ready.

#### Detail

```ts
interface ReadyEventDetail {
  version: string;
  profile: string;
}
```

#### Example

```js
editor.addEventListener("docsjs-ready", (e) => {
  const { version, profile } = e.detail;
  console.log(`Editor ready - v${version}, profile: ${profile}`);
});
```

### docsjs-error

Fired when an error occurs.

#### Detail

```ts
interface ErrorEventDetail {
  error: Error;
  code?: string;
  recoverable: boolean;
}
```

#### Example

```js
editor.addEventListener("docsjs-error", (e) => {
  const { error, code, recoverable } = e.detail;
  console.error("Error:", error.message);
  console.log("Code:", code);
  console.log("Recoverable:", recoverable);
});
```

### docsjs-load

Fired when content is loaded.

#### Detail

```ts
interface LoadEventDetail {
  source: "html" | "docx" | "clipboard";
  size: number;
  processingTime: number;
}
```

#### Example

```js
editor.addEventListener("docsjs-load", (e) => {
  const { source, size, processingTime } = e.detail;
  console.log(`Loaded from ${source}: ${size} bytes in ${processingTime}ms`);
});
```

### docsjs-focus

Fired when the editor gains focus.

#### Detail

```ts
interface FocusEventDetail {
  timestamp: number;
}
```

### docsjs-blur

Fired when the editor loses focus.

#### Detail

```ts
interface BlurEventDetail {
  timestamp: number;
  hasChanges: boolean;
}
```

## Framework-Specific Usage

### Web Component

```html
<docs-word-editor id="editor"></docs-word-editor>

<script>
  const editor = document.getElementById("editor");

  editor.addEventListener("docsjs-change", (e) => {
    console.log("Changed:", e.detail);
  });

  editor.addEventListener("docsjs-ready", () => {
    console.log("Ready!");
  });

  editor.addEventListener("docsjs-error", (e) => {
    console.error("Error:", e.detail.error);
  });
</script>
```

### React

```tsx
import { WordFidelityEditorReact } from "@coding01/docsjs/react";

function App() {
  const handleChange = (detail) => {
    console.log("Changed:", detail.htmlSnapshot);
  };

  const handleReady = () => {
    console.log("Editor ready");
  };

  const handleError = (detail) => {
    console.error("Error:", detail.error);
  };

  return (
    <WordFidelityEditorReact onChange={handleChange} onReady={handleReady} onError={handleError} />
  );
}
```

### Vue

```vue
<template>
  <WordFidelityEditorVue @change="onChange" @ready="onReady" @error="onError" />
</template>

<script setup>
const onChange = (detail) => {
  console.log("Changed:", detail.htmlSnapshot);
};

const onReady = () => {
  console.log("Editor ready");
};

const onError = (detail) => {
  console.error("Error:", detail.error);
};
</script>
```

## Event Flow

```
User Action
    ↓
docsjs-focus (editor gains focus)
    ↓
User types/pastes
    ↓
docsjs-change (content modified)
    ↓
User clicks away
    ↓
docsjs-blur (editor loses focus)
```

## Error Codes

| Code                | Description              | Recoverable |
| ------------------- | ------------------------ | ----------- |
| `PARSE_ERROR`       | Failed to parse input    | Yes         |
| `INVALID_FORMAT`    | Unsupported file format  | No          |
| `FILE_TOO_LARGE`    | File exceeds size limit  | No          |
| `PLUGIN_ERROR`      | Plugin execution failed  | Yes         |
| `NETWORK_ERROR`     | Network request failed   | Yes         |
| `PERMISSION_DENIED` | Plugin permission denied | No          |

## Best Practices

1. **Always handle errors** - Provide user feedback for errors
2. **Debounce change events** - Avoid processing on every keystroke
3. **Check ready state** - Wait for ready before calling methods
4. **Clean up listeners** - Remove listeners when component unmounts

### Debouncing Changes

```js
let debounceTimer;

editor.addEventListener("docsjs-change", (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    saveContent(e.detail.htmlSnapshot);
  }, 500);
});
```

### React Cleanup

```tsx
useEffect(() => {
  const handleChange = (e) => {};

  editorRef.current?.addEventListener("docsjs-change", handleChange);

  return () => {
    editorRef.current?.removeEventListener("docsjs-change", handleChange);
  };
}, []);
```

## Next Steps

- [CoreEngine API](/api/core-engine) - Engine reference
- [Components API](/api/components) - Component reference
- [Types](/api/types) - Complete type reference
