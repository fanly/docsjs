---
layout: doc
---

# Examples

Practical examples for using DocsJS in different scenarios.

## Basic Usage

### Simple HTML Page

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>DocsJS Example</title>
  </head>
  <body>
    <script type="module">
      import { defineDocsWordElement } from "@coding01/docsjs";
      defineDocsWordElement();
    </script>

    <h1>Document Editor</h1>
    <docs-word-editor lang="en" show-toolbar></docs-word-editor>

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

## React Examples

### With State Management

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
        lang="en"
        showToolbar={true}
        onReady={() => setIsReady(true)}
        onChange={handleChange}
      />

      {isReady && (
        <div className="preview">
          <h2>Preview</h2>
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      )}
    </div>
  );
}
```

### With File Upload

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

      <WordFidelityEditorReact ref={editorRef} lang="en" showToolbar={true} />
    </div>
  );
}
```

## Vue Examples

### With Composition API

```vue
<template>
  <div>
    <input type="file" accept=".docx" @change="handleFileChange" />

    <WordFidelityEditorVue
      ref="editorRef"
      lang="en"
      :show-toolbar="true"
      @ready="onReady"
      @change="onChange"
    />

    <div v-if="content" class="preview">
      <h2>Preview</h2>
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

## CoreEngine Examples

### Custom Plugin

```ts
import { CoreEngine } from "@coding01/docsjs";

const engine = new CoreEngine();

// Create a plugin that adds table of contents
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
  // Extract h1-h6 elements
  return [];
}

function insertTocAtStart(ast, headings) {
  // Insert ToC element
}
```

### Batch Processing

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
    console.log(`Converted: ${file}`);
  }
}

batchConvert("./documents", "./output");
```

### Custom Profile

```ts
import { CoreEngine } from "@coding01/docsjs";

const engine = new CoreEngine();

// Register a custom profile for scientific papers
const scientificProfile = {
  id: "scientific-paper",
  name: "Scientific Paper Processor",
  description: "Optimized for academic and research documents",
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

## Integration Examples

### With TipTap Editor

```ts
import { CoreEngine } from "@coding01/docsjs";
import { Editor } from "@tiptap/core";

const engine = new CoreEngine();

async function importToTipTap(file: File, editor: Editor) {
  const result = await engine.transformDocument(file);
  editor.commands.setContent(result.output);
}
```

### With Markdown Export

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

## Next Steps

- [API Reference](/api/) - Full API documentation
- [Plugin System](/guide/plugins) - Build custom plugins
- [Profile System](/guide/profiles) - Configure processing behavior
