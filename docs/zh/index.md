---
layout: home

hero:
  name: DocsJS
  text: 无损 Word 文档 Web 转换管道
  tagline: 把 Word/WPS/Google Docs 内容接入 Web 应用，不再手工重构版式；在一次导入中保留结构、样式与语义。
  image:
    src: /logo.svg
    alt: DocsJS Logo
  actions:
    - theme: brand
      text: 开始使用
      link: /zh/guide/
    - theme: alt
      text: GitHub
      link: https://github.com/fanly/docsjs
    - theme: alt
      text: npm 包
      link: https://www.npmjs.com/package/@coding01/docsjs

features:
  - icon: 📋
    title: 无损粘贴
    details: 从 Word/WPS/Google Docs 粘贴并保留所有元素 - 列表、表格、图片、公式等，完美保真。
  - icon: 🔌
    title: 多框架支持
    details: 支持 React、Vue 和原生 Web Components，无需重写现有编辑器外壳即可快速接入。
  - icon: 🧩
    title: 插件架构
    details: 可扩展的处理管道，内置 23+ 插件用于清洗、解析和渲染。先用内置插件快速上线，再按业务规则做最小扩展。
  - icon: 🧪
    title: 质量保证
    details: 157 个测试、回归基线和保真基准检查。通过回归基线与保真检查，持续保证导入行为稳定可预期。
  - icon: 📊
    title: 深度语义
    details: 脚注、修订、书签、交叉引用等高级语义能力，在 HTML 输出中保留脚注、修订、书签、交叉引用等高级语义。
  - icon: ⚡
    title: 生产就绪
    details: TypeScript 优先、Tree-shakeable、CSP 友好，可直接用于生产环境。
---

<div class="stats-bar">
  <div class="stat-item">
    <div class="stat-value">157</div>
    <div class="stat-label">质量门测试</div>
  </div>
  <div class="stat-item">
    <div class="stat-value">v1.0.0</div>
    <div class="stat-label">当前版本</div>
  </div>
  <div class="stat-item">
    <div class="stat-value">3</div>
    <div class="stat-label">框架适配器</div>
  </div>
  <div class="stat-item">
    <div class="stat-value">23+</div>
    <div class="stat-label">内置插件</div>
  </div>
</div>

## 快速开始

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

### Web Component

```html
<script type="module">
  import { defineDocsWordElement } from "@coding01/docsjs";
  defineDocsWordElement();
</script>

<docs-word-editor lang="zh"></docs-word-editor>
```

### React

```tsx
import { WordFidelityEditorReact } from "@coding01/docsjs/react";

function App() {
  return (
    <WordFidelityEditorReact
      lang="zh"
      onChange={({ htmlSnapshot }) => {
        console.log(htmlSnapshot);
      }}
    />
  );
}
```

### Vue

```vue
<template>
  <WordFidelityEditorVue lang="zh" @change="onChange" />
</template>

<script setup>
import { WordFidelityEditorVue } from "@coding01/docsjs/vue";

const onChange = ({ htmlSnapshot }) => {
  console.log(htmlSnapshot);
};
</script>
```

## 为什么选择 DocsJS？

<div class="feature-grid">
  <div class="feature-card">
    <div class="feature-icon">📋</div>
    <h3>无损粘贴</h3>
    <p>从 Word/WPS/Google Docs 导入时保留列表、表格、图片与格式细节。</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🔌</div>
    <h3>多框架支持</h3>
    <p>支持 React、Vue 与 Web Components，不用重写现有编辑器外壳。</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🧩</div>
    <h3>插件架构</h3>
    <p>先用内置清洗/解析插件快速上线，再按业务规则做最小扩展。</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🧪</div>
    <h3>质量保证</h3>
    <p>通过回归基线与保真检查，持续保证导入行为稳定可预期。</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">📊</div>
    <h3>深度语义</h3>
    <p>保留脚注、修订、书签、交叉引用等高级语义能力。</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">⚡</div>
    <h3>生产就绪</h3>
    <p>TypeScript 优先、Tree-shakeable、CSP 友好，可直接用于生产环境。</p>
  </div>
</div>

## 生态系统

| 包名                                                                                 | 描述                                            |
| ------------------------------------------------------------------------------------ | ----------------------------------------------- |
| [@coding01/docsjs](https://www.npmjs.com/package/@coding01/docsjs)                   | 核心包，包含 Web Component、React 和 Vue 适配器 |
| [@coding01/docsjs-markdown](https://www.npmjs.com/package/@coding01/docsjs-markdown) | Markdown 输出转换                               |
| [@coding01/docsjs-editor](https://www.npmjs.com/package/@coding01/docsjs-editor)     | 多编辑器运行时切换                              |

## 技术栈

<div class="stats-bar" style="opacity: 0.7; font-size: 14px;">
  <span>React</span>
  <span>Vue</span>
  <span>TypeScript</span>
  <span>ES2022</span>
  <span>Vite+</span>
</div>

<style>
.stats-bar {
  display: flex;
  justify-content: center;
  gap: 48px;
  padding: 32px 0;
  flex-wrap: wrap;
  margin: 24px 0;
}
.stat-item {
  text-align: center;
}
.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--docsjs-brand);
  font-family: 'Space Grotesk', sans-serif;
  line-height: 1.2;
}
.stat-label {
  font-size: 14px;
  color: var(--vp-c-text-2);
  margin-top: 4px;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin: 32px 0;
}
.feature-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
}
.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  border-color: var(--docsjs-brand);
}
.feature-card h3 {
  margin-top: 0;
  color: var(--vp-c-text-1);
  font-size: 18px;
}
.feature-card p {
  color: var(--vp-c-text-2);
  margin-bottom: 0;
  line-height: 1.6;
}
.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(14, 139, 120, 0.15) 0%, rgba(255, 159, 67, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  font-size: 20px;
}
</style>
