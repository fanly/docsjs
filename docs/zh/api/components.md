---
title: 组件
---

# 组件

DocsJS 提供多种框架的编辑器组件。

## Web Component

原生 Web 组件，可在任何框架中使用：

```html
<script type="module">
  import { defineDocsWordElement } from "@coding01/docsjs";
  defineDocsWordElement();
</script>

<docs-word-editor lang="zh"></docs-word-editor>
```

### 属性

| 属性           | 类型      | 默认值      | 描述         |
| -------------- | --------- | ----------- | ------------ |
| `lang`         | `string`  | `"en"`      | 语言 (zh/en) |
| `show-toolbar` | `boolean` | `true`      | 显示工具栏   |
| `profile`      | `string`  | `"default"` | 处理配置     |

### 事件

```js
const editor = document.querySelector("docs-word-editor");

editor.addEventListener("docsjs-change", (e) => {
  console.log(e.detail.htmlSnapshot);
});

editor.addEventListener("docsjs-error", (e) => {
  console.error(e.detail.error);
});

editor.addEventListener("docsjs-ready", () => {
  console.log("编辑器已就绪");
});
```

## React

React 组件适配器：

```tsx
import { WordFidelityEditorReact } from "@coding01/docsjs/react";

function App() {
  return (
    <WordFidelityEditorReact
      lang="zh"
      profile="knowledge-base"
      onChange={({ htmlSnapshot }) => {
        console.log(htmlSnapshot);
      }}
      onReady={() => console.log("就绪")}
    />
  );
}
```

### Props

| 属性       | 类型       | 描述         |
| ---------- | ---------- | ------------ |
| `lang`     | `string`   | 语言         |
| `profile`  | `string`   | 处理配置     |
| `onChange` | `function` | 内容变化回调 |
| `onReady`  | `function` | 就绪回调     |
| `onError`  | `function` | 错误回调     |

## Vue

Vue 组件适配器：

```vue
<template>
  <WordFidelityEditorVue lang="zh" profile="knowledge-base" @change="onChange" @ready="onReady" />
</template>

<script setup>
import { WordFidelityEditorVue } from "@coding01/docsjs/vue";

const onChange = ({ htmlSnapshot }) => {
  console.log(htmlSnapshot);
};

const onReady = () => {
  console.log("就绪");
};
</script>
```
