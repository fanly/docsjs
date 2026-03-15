---
layout: home

hero:
  name: DocsJS
  text: The Lossless Word Pipeline for Web
  tagline: Bring Word/WPS/Google Docs content to web apps without rebuilding layout by hand. Keep structure, styles, and semantics in one import flow.
  image:
    src: /logo.svg
    alt: DocsJS Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/fanly/docsjs
    - theme: alt
      text: npm Package
      link: https://www.npmjs.com/package/@coding01/docsjs

features:
  - icon: 📋
    title: Lossless Paste
    details: Paste from Word/WPS/Google Docs and preserve every element - lists, tables, images, formulas, and more with perfect fidelity.
  - icon: 🔌
    title: Multi-Framework
    details: First-class support for React, Vue, and vanilla Web Components. Drop in and start using immediately without rewriting your current editor shell.
  - icon: 🧩
    title: Plugin Architecture
    details: Extensible pipeline with 23+ built-in plugins for cleanup, parsing, and rendering. Use built-in plugins first, then extend only where your business rules differ.
  - icon: 🧪
    title: Quality Assured
    details: 157 tests, baseline regression, and fidelity benchmarks. Every release passes strict quality gates with regression baseline and fidelity checks.
  - icon: 📊
    title: Deep Semantics
    details: Footnotes, revisions, bookmarks, cross-references, and more. Preserve advanced Word semantics such as notes, revisions, bookmarks, and cross references in HTML output.
  - icon: ⚡
    title: Production Ready
    details: TypeScript-first, tree-shakeable, CSP-friendly package for production web products. Built for real-world enterprise applications.
---

<div class="stats-bar">
  <div class="stat-item">
    <div class="stat-value">157</div>
    <div class="stat-label">Quality Gate Tests</div>
  </div>
  <div class="stat-item">
    <div class="stat-value">v1.0.0</div>
    <div class="stat-label">Latest Version</div>
  </div>
  <div class="stat-item">
    <div class="stat-value">3</div>
    <div class="stat-label">Framework Adapters</div>
  </div>
  <div class="stat-item">
    <div class="stat-value">23+</div>
    <div class="stat-label">Built-in Plugins</div>
  </div>
</div>

## Quick Start

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

<docs-word-editor lang="en"></docs-word-editor>
```

### React

```tsx
import { WordFidelityEditorReact } from "@coding01/docsjs/react";

function App() {
  return (
    <WordFidelityEditorReact
      lang="en"
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
  <WordFidelityEditorVue lang="en" @change="onChange" />
</template>

<script setup>
import { WordFidelityEditorVue } from "@coding01/docsjs/vue";

const onChange = ({ htmlSnapshot }) => {
  console.log(htmlSnapshot);
};
</script>
```

## Why DocsJS?

<div class="feature-grid">
  <div class="feature-card">
    <div class="feature-icon">📋</div>
    <h3>Lossless Paste</h3>
    <p>Keep lists, tables, images, and formatting when importing from Word/WPS/Google Docs.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🔌</div>
    <h3>Multi-Framework</h3>
    <p>Start with React, Vue, or Web Components without rewriting your current editor shell.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🧩</div>
    <h3>Plugin Architecture</h3>
    <p>Use built-in cleanup/parser plugins first, then extend only where your business rules differ.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🧪</div>
    <h3>Quality Assured</h3>
    <p>Regression baseline + fidelity checks keep import behavior stable as your docs evolve.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">📊</div>
    <h3>Deep Semantics</h3>
    <p>Preserve advanced semantics such as notes, revisions, bookmarks, and cross references.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">⚡</div>
    <h3>Production Ready</h3>
    <p>TypeScript-first, tree-shakeable, CSP-friendly package for production web products.</p>
  </div>
</div>

## Ecosystem

| Package                                                          | Description                                              |
| ---------------------------------------------------------------- | -------------------------------------------------------- |
| [@coding01/docsjs](https://docsjs.coding01.cn)                   | Core package with Web Component, React, and Vue adapters |
| [@coding01/docsjs-markdown](https://markdown.docsjs.coding01.cn) | Markdown output conversion                               |
| [@coding01/docsjs-editor](https://editor.docsjs.coding01.cn)     | Multi-editor runtime switching                           |

## Sponsors

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
