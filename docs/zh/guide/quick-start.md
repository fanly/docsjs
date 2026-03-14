---
layout: doc
---

# 快速开始

几分钟内开始使用 DocsJS。选择你的框架。

## Web Component

使用 DocsJS 最简单的方式。适用于任何 HTML 页面。

```html
<!DOCTYPE html>
<html>
  <head>
    <title>DocsJS 演示</title>
  </head>
  <body>
    <script type="module">
      import { defineDocsWordElement } from "@coding01/docsjs";
      defineDocsWordElement();
    </script>

    <docs-word-editor lang="zh" show-toolbar></docs-word-editor>

    <script type="module">
      const editor = document.querySelector("docs-word-editor");

      editor.addEventListener("docsjs-change", (e) => {
        console.log("内容已变更:", e.detail.htmlSnapshot);
      });

      editor.addEventListener("docsjs-ready", () => {
        console.log("编辑器已就绪！");
      });
    </script>
  </body>
</html>
```

### 可用属性

| 属性           | 类型      | 默认值      | 描述         |
| -------------- | --------- | ----------- | ------------ |
| `lang`         | `string`  | `'en'`      | 语言 (en/zh) |
| `show-toolbar` | `boolean` | `false`     | 显示工具栏   |
| `profile`      | `string`  | `'default'` | 处理配置     |

### 可用事件

| 事件            | 详情               | 描述     |
| --------------- | ------------------ | -------- |
| `docsjs-change` | `{ htmlSnapshot }` | 内容变更 |
| `docsjs-ready`  | `{}`               | 组件就绪 |
| `docsjs-error`  | `{ error }`        | 发生错误 |

### 可用方法

```js
const editor = document.querySelector("docs-word-editor");

// 加载内容
await editor.loadHtml("<p>HTML 内容</p>");
await editor.loadDocx(file); // File 对象
await editor.loadClipboard();

// 获取输出
const html = editor.getSnapshot();

// 清空内容
editor.clear();
```

## React

```tsx
import { WordFidelityEditorReact } from "@coding01/docsjs/react";

function App() {
  const handleReady = () => {
    console.log("编辑器已就绪！");
  };

  const handleChange = ({ htmlSnapshot, textContent }) => {
    console.log("内容已变更:", htmlSnapshot);
  };

  const handleError = ({ error }) => {
    console.error("错误:", error);
  };

  return (
    <WordFidelityEditorReact
      lang="zh"
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

| Prop          | 类型       | 默认值      | 描述         |
| ------------- | ---------- | ----------- | ------------ |
| `lang`        | `string`   | `'en'`      | 语言 (en/zh) |
| `showToolbar` | `boolean`  | `false`     | 显示工具栏   |
| `profile`     | `string`   | `'default'` | 处理配置     |
| `config`      | `object`   | `{}`        | 引擎配置     |
| `onReady`     | `function` | -           | 就绪回调     |
| `onChange`    | `function` | -           | 变更回调     |
| `onError`     | `function` | -           | 错误回调     |

## Vue

```vue
<template>
  <WordFidelityEditorVue
    lang="zh"
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
  console.log("编辑器已就绪！");
};

const onChange = ({ htmlSnapshot, textContent }) => {
  console.log("内容已变更:", htmlSnapshot);
};

const onError = ({ error }) => {
  console.error("错误:", error);
};
</script>
```

### Props

| Prop          | 类型      | 默认值      | 描述         |
| ------------- | --------- | ----------- | ------------ |
| `lang`        | `string`  | `'en'`      | 语言 (en/zh) |
| `showToolbar` | `boolean` | `false`     | 显示工具栏   |
| `profile`     | `string`  | `'default'` | 处理配置     |
| `config`      | `object`  | `{}`        | 引擎配置     |

### 事件

| 事件     | 载荷                            | 描述       |
| -------- | ------------------------------- | ---------- |
| `ready`  | `{}`                            | 编辑器就绪 |
| `change` | `{ htmlSnapshot, textContent }` | 内容变更   |
| `error`  | `{ error }`                     | 发生错误   |

## 使用 CoreEngine 高级用法

用于编程式文档处理：

```ts
import { CoreEngine } from "@coding01/docsjs";

const engine = new CoreEngine();

// 应用处理配置
engine.applyProfile("knowledge-base");

// 注册自定义插件
const myPlugin = {
  name: "my-plugin",
  availableHooks: ["afterParse"],
  permissions: {
    ast: { canModifySemantics: true },
  },
  afterParse: (context) => {
    // 转换 AST
    return context;
  },
};

engine.registerPlugin(myPlugin);

// 转换文档
const file = new File(["..."], "document.docx");
const result = await engine.transformDocument(file);

console.log(result.output); // 转换后的内容
console.log(result.diagnostics); // 错误和警告
console.log(result.metrics); // 性能数据
```

## 下一步

- [架构设计](/zh/guide/architecture) - 理解核心架构
- [插件系统](/zh/guide/plugins) - 构建自定义插件
- [配置系统](/zh/guide/profiles) - 配置处理行为
- [API 参考](/zh/api/) - 完整 API 文档
