<template>
  <div class="app">
    <h1>docsjs Vue Demo</h1>
    <p>粘贴 Word/WPS/Google Docs 或上传 .docx 验证无损导入。</p>

    <div class="toolbar">
      <button @click="onClear">清空</button>
      <button @click="onReadClipboard">读取系统剪贴板</button>
      <button @click="onExportSnapshot">导出 HTML 快照（并复制）</button>
    </div>

    <WordFidelityEditorVue ref="editor" @change="onChange" @error="onError" @ready="onReady" />

    <div class="meta">来源: {{ source }} | 快照长度: {{ length }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  WordFidelityEditorVue
} from "@coding01/docsjs/vue";
import type { DocsWordEditorElementApi } from "@coding01/docsjs/types";

const editor = ref<DocsWordEditorElementApi | null>(null);
const source = ref("-");
const length = ref(0);

const onReady = (payload: { version: string }) => {
  console.log("ready", payload.version);
};

const onChange = (payload: { source: string; htmlSnapshot: string }) => {
  source.value = payload.source;
  length.value = payload.htmlSnapshot.length;
};

const onError = (payload: { message: string }) => {
  alert(payload.message);
};

const onClear = () => {
  editor.value?.clear();
};

const onReadClipboard = async () => {
  await editor.value?.loadClipboard();
};

const onExportSnapshot = async () => {
  const snapshot = editor.value?.getSnapshot() ?? "";
  length.value = snapshot.length;
  try {
    await navigator.clipboard.writeText(snapshot);
  } catch {
    // noop
  }
};
</script>

<style scoped>
.app {
  max-width: 1320px;
  margin: 20px auto;
  padding: 0 16px;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.meta {
  margin-top: 10px;
  color: #5b6788;
  font-size: 13px;
}
</style>
