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

## 重点推荐：@coding01/docsjs-markdown

建议配套 `@coding01/docsjs-markdown` 使用：将 docsjs 的 HTML 快照（或 DOCX）转换为 Markdown，方便知识库、文档站和静态发布链路。

- npm: https://www.npmjs.com/package/@coding01/docsjs-markdown
- GitHub: https://github.com/fanly/docsjs-markdown
- 产品页: https://fanly.github.io/docsjs-markdown/

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
- ✅ 插件架构框架

### 导入链路

- ✅ 剪贴板导入（`text/html`、`text/plain`）
- ✅ `.docx` 上传与关系媒体映射
- ✅ 不稳定图片 URI 修复（`file:/blob:/cid:`）
- ✅ 输出稳定 HTML Snapshot

### 清理插件（粘贴管道）

- ✅ Google Docs 产物清理（`docs-internal-guid`、`google-sheets-html-origin`、`data-sheets-*`）
- ✅ WPS Office 产物清理（`wps-*`、`kingsoft-*`）
- ✅ Word 产物清理（`mso-*`、`class="Mso*"`、Office XML 命名空间）

### 内容插件（DOCX 解析器）

- ✅ 书签解析
- ✅ 页眉/页脚引用解析
- ✅ 章节属性解析（页面大小、页边距，分栏）
- ✅ 首字下沉格式
- ✅ 域解析（PAGE、NUMPAGES、DATE、TOC）
- ✅ 交叉引用解析
- ✅ 题注解析

### 渲染插件

- ✅ VML/DrawingML 形状渲染
- ✅ 艺术字渲染
- ✅ OLE 对象占位符
- ✅ 内容控件（SDT）解析
- ✅ 水印渲染
- ✅ 页面背景颜色

### 样式插件

- ✅ 从 styles.xml 继承样式
- ✅ 列表样式解析

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

- ✅ 157 条自动化测试（回归 + 边界 + 插件）
- ✅ 基准快照回归框架
- ✅ `verify` 质量门禁（lint/typecheck/test/build/size）
- ✅ 解析报告 API（性能调优）
- ✅ 插件管道 API（可扩展性）
<!-- GENERATED:FEATURE_CHECKLIST_ZH:END -->
- ✅ `verify` 质量门禁（lint/typecheck/test/build/size）
- ✅ 解析报告 API（性能调优）
<!-- GENERATED:FEATURE_CHECKLIST_ZH:END -->

## v0.1.8 更新内容

- 新增**插件架构框架**，支持可扩展性：
  - 插件注册表与优先级执行
  - 支持 Cleanup、Transform、Parse 阶段
  - 23 个内置插件，增强 DOCX/Word/WPS/Google Docs 支持
- 新增**清理插件**用于粘贴管道：
  - Google Docs 产物清理（`docs-internal-guid`、`google-sheets-html-origin`、`data-sheets-*`）
  - WPS Office 产物清理（`wps-*`、`kingsoft-*`）
  - Word 产物清理（`mso-*`、`class="Mso*"`、Office XML 命名空间）
- 新增**内容插件**用于 DOCX 解析：
  - 书签、页眉/页脚、章节属性、首字下沉、域、交叉引用、题注
- 新增**渲染插件**用于高级元素：
  - VML/DrawingML 形状、艺术字、OLE 对象、内容控件（SDT）、水印、页面背景
- 新增**样式插件**用于增强样式：
  - 样式继承、列表样式解析
- 新增**数学插件**用于 MathML 转换
- 测试套件扩展至 **157 个测试**
- 新增 `DocxPluginPipeline` API 用于自定义插件配置

## v0.1.7 更新内容

- 新增全面保真度测试套件：
  - 保真度基准测试套件（26 个基准测试）
  - 深度列表保真度测试（7 个）
  - 深度表格保真度测试（12 个）
  - 锚点图片布局测试（7 个）
  - 脚注/尾注渲染测试（8 个）
  - 修订追踪可视化测试（10 个）
  - 分页精度测试（widow/orphan、keep-with-next）
  - OMML 公式渲染测试（分数、下标、根号）
- 测试套件从 50+ 增长到 **125 个测试**
- 所有测试遵循 TDD 和无损粘贴验证原则
- 新增分页语义统计（占位符标记、孤行控制）

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
