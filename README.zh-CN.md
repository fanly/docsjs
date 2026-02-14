# @coding01/docsjs

面向 Web 的 Render-first Word 高保真导入组件。  
目标是在粘贴或上传 `.docx` 时，尽可能无损保留 Word/WPS/Google Docs 的结构和版式。

[![npm version](https://img.shields.io/npm/v/@coding01/docsjs)](https://www.npmjs.com/package/@coding01/docsjs)
[![npm downloads](https://img.shields.io/npm/dm/@coding01/docsjs)](https://www.npmjs.com/package/@coding01/docsjs)
[![CI](https://github.com/fanly/docsjs/actions/workflows/ci.yml/badge.svg)](https://github.com/fanly/docsjs/actions/workflows/ci.yml)
[![Pages](https://github.com/fanly/docsjs/actions/workflows/pages.yml/badge.svg)](https://github.com/fanly/docsjs/actions/workflows/pages.yml)

[English README](./README.md)

## GitHub Pages

- 产品单页: [https://docsjs.coding01.cn/](https://docsjs.coding01.cn/)
- 页面源码: `docs/index.html`
- 自动部署: `.github/workflows/pages.yml`

## 核心能力

- Web Component 内核：`docs-word-editor`
- React 适配：`WordFidelityEditorReact`
- Vue 适配：`WordFidelityEditorVue`
- 导入链路：剪贴板粘贴 + `.docx` 上传
- 输出：完整 HTML Snapshot，便于后续渲染与存储

## 安装

```bash
npm i @coding01/docsjs
```

## 快速开始

### React

```tsx
import { WordFidelityEditorReact } from "@coding01/docsjs/react";

export default function Page() {
  return (
    <WordFidelityEditorReact
      onChange={(payload) => console.log(payload.htmlSnapshot)}
      onError={(payload) => console.error(payload.message)}
    />
  );
}
```

### Vue

```vue
<template>
  <WordFidelityEditorVue @change="onChange" @error="onError" />
</template>

<script setup lang="ts">
import { WordFidelityEditorVue } from "@coding01/docsjs/vue";
const onChange = (payload: { htmlSnapshot: string }) => console.log(payload.htmlSnapshot);
const onError = (payload: { message: string }) => console.error(payload.message);
</script>
```

### Web Component

```ts
import { defineDocsWordElement } from "@coding01/docsjs";

defineDocsWordElement();
const el = document.createElement("docs-word-editor");
document.body.appendChild(el);
```

## API

### 事件

- `docsjs-change`
  - payload: `{ htmlSnapshot: string; source: "paste" | "upload" | "api" | "clear"; fileName?: string }`
- `docsjs-error`
  - payload: `{ message: string }`
- `docsjs-ready`
  - payload: `{ version: string }`

### 方法

- `loadHtml(rawHtml: string): void`
- `loadDocx(file: File): Promise<void>`
- `loadClipboard(): Promise<void>`
- `getSnapshot(): string`
- `clear(): void`

### 属性

- `lang="zh|en"`
- `show-toolbar="true|false|1|0"`

## 功能清单

<!-- GENERATED:FEATURE_CHECKLIST_ZH:START -->
### 核心

- ✅ Web Component 内核（`docs-word-editor`）
- ✅ React + Vue 适配层
- ✅ 事件体系与命令式公开 API
- ✅ 严格模式唯一解析策略

### 导入链路

- ✅ 剪贴板导入（`text/html`、`text/plain`）
- ✅ `.docx` 上传与关系媒体映射
- ✅ 不稳定图片 URI 修复（`file:/blob:/cid:`）
- ✅ 输出稳定 HTML Snapshot

### 版式保真

- ✅ 列表结构恢复（`numId`、`ilvl`、`lvlText`）
- ✅ 表格 v1（`tblGrid/tcW`、合并、边框、间距）
- ✅ 浮动锚点 v1（`wp:anchor` 元数据）
- ⏳ 锚点碰撞一致性（像素级绕排）

### 高级语义

- ✅ 脚注/尾注/批注
- ✅ 修订标记（`ins`/`del`）与元数据
- ✅ 分页语义标记
- ✅ DOCX 超链接关系与锚点映射

### 语义降级

- ✅ OMML 语义降级输出
- ✅ 图表语义提取降级
- ✅ SmartArt 节点降级提取
- ⏳ OMML 高保真渲染链（MathML/KaTeX）

### 工程质量

- ✅ 50 条自动化测试（回归 + 边界）
- ✅ 基准快照回归框架
- ✅ `verify` 质量门禁（lint/typecheck/test/build/size）
- ✅ 解析报告 API（性能调优）
<!-- GENERATED:FEATURE_CHECKLIST_ZH:END -->

## v0.1.3 更新内容

- 深度 DOCX 语义增强：
  - 编号覆盖（`lvlOverride/startOverride`）
  - 合并单元格（`vMerge/gridSpan`）和嵌套表格
  - 脚注与尾注（只读渲染）
  - 批注（只读渲染）
  - 修订新增/删除标记（只读渲染）
  - 批注区间标记与修订元数据属性
  - 分页语义标记（`w:br type=page`、`lastRenderedPageBreak`）
  - 表格宽度映射（`tblGrid/gridCol`、`tcW`）
  - 表格边框模型/单元格间距/布局类型映射
  - OMML 公式降级渲染、图表/SmartArt 语义降级渲染
- 浮动图片 MVP：
  - 锚点定位（`wp:anchor`）
  - 绕排模式标记（`square`、`tight`、`topAndBottom`、`none`）
  - 锚点布局元数据（`relativeFrom`、`behindDoc`、`allowOverlap`、`layoutInCell`、`relativeHeight`、`dist*`）
- 保真工具链增强：
  - 语义统计器
  - 保真评分器
  - 配置驱动的基准回归测试框架
  - 视觉回归工作流骨架（Playwright + diff artifacts）
  - golden corpus 基准评分 + 趋势报告工作流（`fidelity-benchmark.yml`）
- 工程质量门增强：
  - ESLint + 严格 `verify`（`lint/typecheck/test/build/sizecheck`）
  - CI 必过质量门
  - 贡献规范 / 规则 / 深度开发计划文档
- Demo 升级：
  - React/Vue demo 支持中英文切换
  - 组件内置工具栏文案随语言切换
  - 语义统计面板新增浮动图/绕排图/批注/修订/分页断点等指标

## 本地开发

```bash
npm install
npm run typecheck
npm run test
npm run build
npm run benchmark:fidelity
```

## 工程模式

- 规则说明: [ENGINEERING_MODES.md](./ENGINEERING_MODES.md)
- 解析 API 支持:
  - `parseDocxToHtmlSnapshot(file)`
  - `parseDocxToHtmlSnapshotWithReport(file)`

## 演示

### React demo

```bash
cd demos/react-demo
npm install
npm run dev
```

### Vue demo

```bash
cd demos/vue-demo
npm install
npm run dev
```

## 路线图

执行优先级与验收标准见 [ROADMAP.md](./ROADMAP.md)。

## 发布与关联

- npmjs 发布工作流：`.github/workflows/publish.yml`
- GitHub Packages 发布工作流：`.github/workflows/publish-github-packages.yml`
- GitHub 侧栏 `Packages` 只显示发布到 GitHub Packages 的包，不显示 npmjs 包
- 当前 GitHub Packages 包名：`@fanly/docsjs`

## 安全说明

- 默认策略是保真优先，不主动清洗 Word 内联样式。
- 生产环境建议宿主侧配置 CSP、iframe sandbox、上传白名单及可选清洗策略。

## 打赏支持

如果这个项目帮你节省了时间，欢迎打赏支持。

![支持 docsjs](https://image.coding01.cn/Coding01%20%E8%B5%9E%E8%B5%8F%E7%A0%81.png)

`“加个鸡腿💪(ﾟωﾟ💪)”`
