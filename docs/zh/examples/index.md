---
layout: doc
---

# 示例

DocsJS 实际应用示例。

## 基础用法

### 简单 HTML 页面

```html
<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <title>DocsJS 示例</title>
  </head>
  <body>
    <script type="module">
      import { defineDocsWordElement } from "@coding01/docsjs";
      defineDocsWordElement();
    </script>

    <h1>文档编辑器</h1>
    <docs-word-editor lang="zh" show-toolbar></docs-word-editor>

    <div id="output"></div>

    <script type="module">
      const editor = document.querySelector("docs-word-editor");
      const output = document.getElementById("output");

      editor.addEventListener("docsjs-change", (e) => {
        output.innerHTML = e.detail.htmlSnapshot;
      });
    </script>
  </body>
</html>
```

## React 示例

### 带状态管理

```tsx
import { useState } from "react";
import { WordFidelityEditorReact } from "@coding01/docsjs/react";

function DocumentEditor() {
  const [content, setContent] = useState("");
  const [isReady, setIsReady] = useState(false);

  const handleChange = ({ htmlSnapshot }) => {
    setContent(htmlSnapshot);
  };

  return (
    <div>
      <WordFidelityEditorReact
        lang="zh"
        showToolbar={true}
        onReady={() => setIsReady(true)}
        onChange={handleChange}
      />

      {isReady && (
        <div className="preview">
          <h2>预览</h2>
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      )}
    </div>
  );
}
```

### 带文件上传

```tsx
import { useRef } from "react";
import { WordFidelityEditorReact } from "@coding01/docsjs/react";

function FileUploadEditor() {
  const editorRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && editorRef.current) {
      await editorRef.current.loadDocx(file);
    }
  };

  return (
    <div>
      <input type="file" accept=".docx" onChange={handleFileChange} />

      <WordFidelityEditorReact ref={editorRef} lang="zh" showToolbar={true} />
    </div>
  );
}
```

## Vue 示例

### 使用 Composition API

```vue
<template>
  <div>
    <input type="file" accept=".docx" @change="handleFileChange" />

    <WordFidelityEditorVue
      ref="editorRef"
      lang="zh"
      :show-toolbar="true"
      @ready="onReady"
      @change="onChange"
    />

    <div v-if="content" class="preview">
      <h2>预览</h2>
      <div v-html="content"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { WordFidelityEditorVue } from "@coding01/docsjs/vue";

const editorRef = ref(null);
const content = ref("");
const isReady = ref(false);

const onReady = () => {
  isReady.value = true;
};

const onChange = ({ htmlSnapshot }) => {
  content.value = htmlSnapshot;
};

const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (file && editorRef.value) {
    await editorRef.value.loadDocx(file);
  }
};
</script>
```

## CoreEngine 示例

### 自定义插件

```ts
import { CoreEngine } from "@coding01/docsjs";

const engine = new CoreEngine();

// 创建添加目录的插件
const tocPlugin = {
  name: "toc-generator",
  availableHooks: ["afterParse", "beforeRender"],
  permissions: {
    ast: { canModifySemantics: true },
  },
  afterParse: (context) => {
    const headings = extractHeadings(context.ast);
    context.pipeline.state.intermediate.toc = headings;
    return context;
  },
  beforeRender: (context) => {
    const toc = context.pipeline.state.intermediate.toc;
    if (toc && toc.length > 0) {
      insertTocAtStart(context.ast, toc);
    }
    return context;
  },
};

engine.registerPlugin(tocPlugin);

function extractHeadings(ast) {
  // 提取 h1-h6 元素
  return [];
}

function insertTocAtStart(ast, headings) {
  // 插入目录元素
}
```

### 批量处理

```ts
import { CoreEngine } from "@coding01/docsjs";
import fs from "fs/promises";
import path from "path";

async function batchConvert(inputDir: string, outputDir: string) {
  const engine = new CoreEngine();
  engine.applyProfile("knowledge-base");

  const files = await fs.readdir(inputDir);
  const docxFiles = files.filter((f) => f.endsWith(".docx"));

  for (const file of docxFiles) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file.replace(".docx", ".html"));

    const buffer = await fs.readFile(inputPath);
    const fileObj = new File([buffer], file);

    const result = await engine.transformDocument(fileObj);

    await fs.writeFile(outputPath, result.output);
    console.log(`已转换: ${file}`);
  }
}

batchConvert("./documents", "./output");
```

### 自定义配置

```ts
import { CoreEngine } from "@coding01/docsjs";

const engine = new CoreEngine();

// 注册学术论文的自定义配置
const scientificProfile = {
  id: "scientific-paper",
  name: "学术论文处理器",
  description: "针对学术和研究文档优化",
  parse: {
    features: {
      mathML: true,
      tables: true,
      images: true,
      citations: true,
      footnotes: true,
    },
  },
  transform: {
    preserveStructure: true,
    extractMetadata: true,
  },
  render: {
    format: "html",
    includeStyles: true,
    mathRenderer: "katex",
  },
  security: {
    allowedDomains: ["arxiv.org", "doi.org"],
    sanitizerProfile: "fidelity-first",
  },
};

engine.registerProfile(scientificProfile);
engine.applyProfile("scientific-paper");
```

## 集成示例

### 与 TipTap 编辑器

```ts
import { CoreEngine } from "@coding01/docsjs";
import { Editor } from "@tiptap/core";

const engine = new CoreEngine();

async function importToTipTap(file: File, editor: Editor) {
  const result = await engine.transformDocument(file);
  editor.commands.setContent(result.output);
}
```

### 导出 Markdown

```ts
import { CoreEngine } from "@coding01/docsjs";

const engine = new CoreEngine();

async function convertToMarkdown(file: File): Promise<string> {
  const result = await engine.transformDocument(file, {
    outputFormat: "markdown",
  });
  return result.output;
}
```

## 下一步

- [API 参考](/zh/api/) - 完整 API 文档
- [插件系统](/zh/guide/plugins) - 构建自定义插件
- [配置系统](/zh/guide/profiles) - 配置处理行为
