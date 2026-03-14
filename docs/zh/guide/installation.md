---
layout: doc
---

# 安装

了解如何在项目中安装 DocsJS。

## 环境要求

- Node.js 18.0 或更高版本
- npm、yarn 或 pnpm

## 包安装

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

## 对等依赖

DocsJS 根据框架有可选的对等依赖：

### React

```bash
npm install react react-dom
```

### Vue

```bash
npm install vue
```

## CDN 使用

快速原型开发可以使用 CDN 版本：

```html
<script type="module">
  import { defineDocsWordElement } from "https://cdn.jsdelivr.net/npm/@coding01/docsjs@latest/dist/index.js";
  defineDocsWordElement();
</script>

<docs-word-editor></docs-word-editor>
```

## 验证安装

创建一个简单的测试文件验证安装：

```html
<!DOCTYPE html>
<html>
  <head>
    <title>DocsJS 测试</title>
  </head>
  <body>
    <script type="module">
      import { defineDocsWordElement } from "@coding01/docsjs";
      defineDocsWordElement();
    </script>

    <docs-word-editor lang="zh"></docs-word-editor>
  </body>
</html>
```

## TypeScript 支持

DocsJS 使用 TypeScript 编写，包含类型定义。无需额外安装即可获得 TypeScript 支持。

```ts
import { defineDocsWordElement, CoreEngine } from "@coding01/docsjs";
import type { PluginConfig, ProfileConfig } from "@coding01/docsjs";
```

## 下一步

- [快速开始](/zh/guide/quick-start) - 学习如何使用 DocsJS
- [API 参考](/zh/api/) - 浏览完整 API
