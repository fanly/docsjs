---
title: 事件
---

# 事件

DocsJS 组件发出以下自定义事件。

## docsjs-change

内容变化时触发：

```ts
interface ChangeEventDetail {
  htmlSnapshot: string; // 当前 HTML 快照
  textContent: string; // 纯文本内容
  wordCount: number; // 字数统计
}
```

**示例：**

```js
editor.addEventListener("docsjs-change", (e) => {
  const { htmlSnapshot, wordCount } = e.detail;
  console.log(`字数: ${wordCount}`);
  console.log(`HTML: ${htmlSnapshot}`);
});
```

## docsjs-error

发生错误时触发：

```ts
interface ErrorEventDetail {
  error: Error; // 错误对象
  phase: string; // 错误阶段
  recoverable: boolean; // 是否可恢复
}
```

**示例：**

```js
editor.addEventListener("docsjs-error", (e) => {
  const { error, recoverable } = e.detail;
  if (!recoverable) {
    alert(`严重错误: ${error.message}`);
  }
});
```

## docsjs-ready

组件就绪时触发：

```ts
interface ReadyEventDetail {
  version: string; // 版本号
  features: string[]; // 可用功能
}
```

**示例：**

```js
editor.addEventListener("docsjs-ready", (e) => {
  const { version, features } = e.detail;
  console.log(`DocsJS v${version} 已就绪`);
  console.log(`支持功能: ${features.join(", ")}`);
});
```

## React 示例

```tsx
import { WordFidelityEditorReact } from "@coding01/docsjs/react";

function Editor() {
  const handleChange = (detail) => {
    console.log("内容变化:", detail.htmlSnapshot);
  };

  const handleError = (detail) => {
    console.error("错误:", detail.error);
  };

  return <WordFidelityEditorReact onChange={handleChange} onError={handleError} />;
}
```

## Vue 示例

```vue
<template>
  <WordFidelityEditorVue @change="handleChange" @error="handleError" @ready="handleReady" />
</template>
```
