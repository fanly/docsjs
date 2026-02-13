# docsjs

`docsjs` 是一个 Render-first 的 Word 高保真组件，目标是把 Word/WPS/Google Docs 内容以“先渲染、后编辑”的方式无损导入到 Web 端。

当前提供：
- Web Component 内核：`docs-word-editor`
- React 适配组件：`WordFidelityEditorReact`
- Vue 适配组件：`WordFidelityEditorVue`

## Installation

```bash
npm i docsjs jszip
```

## Quick Start

### React

```tsx
import { WordFidelityEditorReact } from "docsjs";

export default function Page() {
  return (
    <WordFidelityEditorReact
      onChange={(payload) => {
        console.log(payload.htmlSnapshot);
      }}
      onError={(payload) => {
        console.error(payload.message);
      }}
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
import { WordFidelityEditorVue } from "docsjs";

const onChange = (payload: { htmlSnapshot: string }) => {
  console.log(payload.htmlSnapshot);
};

const onError = (payload: { message: string }) => {
  console.error(payload.message);
};
</script>
```

### Web Component (Vanilla)

```ts
import { defineDocsWordElement } from "docsjs";

defineDocsWordElement();
const el = document.createElement("docs-word-editor");
document.body.appendChild(el);

el.addEventListener("docsjs-change", (e) => {
  const detail = (e as CustomEvent<{ htmlSnapshot: string }>).detail;
  console.log(detail.htmlSnapshot);
});
```

## API

### Component Events

- `docsjs-change`
  - payload: `{ htmlSnapshot: string }`
  - 触发时机：粘贴、上传 Word、手动 `setSnapshot`、`clear`
- `docsjs-error`
  - payload: `{ message: string }`
  - 触发时机：剪贴板读取失败、DOCX 解析失败等

### Web Component Methods

- `setSnapshot(rawHtml: string): void`
  - 将外部 HTML 快照注入渲染层
- `clear(): void`
  - 清空当前文档

## Semantic Coverage

下表描述“语义与格式覆盖”当前状态。

### Completed

- 输入链路
  - 粘贴：Word / WPS / Google Docs HTML
  - 上传：`.docx` 文件解析并渲染
- 页面模型
  - A4 页高/页边距/版心宽度映射
- 段落语义
  - 对齐、段前段后、行距（`auto` / `exact` / `atLeast`）
  - 缩进（left/right/firstLine/hanging）
  - keep 规则（`keepNext` / `keepLines` / `pageBreakBefore` / `lastRenderedPageBreak`）
- Run 语义
  - 字号、字体、颜色、粗体、斜体、下划线、删除线
  - 高亮、底纹、上下标、字距、阴影
- 列表语义
  - 多级编号（`numId` + `ilvl`）
  - `numFmt` 和 `lvlText` 模板（如 `%1.%2.`）
  - section break 计数重置
- 表格语义
  - `table/tr/td` 结构保留
  - 单元格段落保留与边框/基础 padding 映射
- 图片语义
  - 提取关系映射（`rId -> media`）
  - `wp:extent` 尺寸映射为像素（稳定布局）

### In Progress / Not Completed

- 复杂 Word 对象
  - 浮动锚点对象（复杂 `wp:anchor`）
  - 图表、SmartArt、公式（OMML）深层渲染
- 文档语义高级能力
  - Track Changes / Comments / Footnotes / Endnotes
  - 域代码（目录、页码域）刷新
- 分页精度
  - widow/orphan 规则完整覆盖
  - 跨页表格与复杂 keep 组合场景
- 编辑能力
  - 当前提供的是渲染导入组件，完整富文本编辑工具栏与协同编辑仍在规划中

## Build & Local Develop

```bash
npm install
npm run typecheck
npm run build
```

## Security Notes

- 本组件默认不清洗 Word 内联样式（保真优先）。
- 生产环境请在宿主应用侧配置 CSP、iframe sandbox 和上传白名单策略。
