<template>
  <div class="app">
    <div class="top">
      <h1>docsjs Vue Demo</h1>
      <div class="lang-toggle">
        <button :disabled="lang === 'zh'" @click="lang = 'zh'">{{ t.zh }}</button>
        <button :disabled="lang === 'en'" @click="lang = 'en'">{{ t.en }}</button>
      </div>
    </div>
    <p>{{ t.subtitle }}</p>

    <div class="toolbar">
      <button @click="onClear">{{ t.clear }}</button>
      <button @click="onReadClipboard">{{ t.loadClipboard }}</button>
      <button @click="onExportSnapshot">{{ t.exportSnapshot }}</button>
    </div>

    <WordFidelityEditorVue ref="editor" :lang="lang" @change="onChange" @error="onError" @ready="onReady" />

    <div class="meta">{{ t.source }}: {{ source }} | {{ t.snapshotLength }}: {{ length }} | strict | {{ t.parseElapsed }}: {{ report?.elapsedMs ?? "-" }}</div>
    <div class="stats">
      <div>{{ t.paragraphCount }}: {{ stats.paragraphCount }}</div>
      <div>{{ t.headingCount }}: {{ stats.headingCount }}</div>
      <div>{{ t.listParagraphCount }}: {{ stats.listParagraphCount }}</div>
      <div>{{ t.tableCount }}: {{ stats.tableCount }}</div>
      <div>{{ t.tableCellCount }}: {{ stats.tableCellCount }}</div>
      <div>{{ t.imageCount }}: {{ stats.imageCount }}</div>
      <div>{{ t.anchorImageCount }}: {{ stats.anchorImageCount }}</div>
      <div>{{ t.wrappedImageCount }}: {{ stats.wrappedImageCount }}</div>
      <div>{{ t.ommlCount }}: {{ stats.ommlCount }}</div>
      <div>{{ t.chartCount }}: {{ stats.chartCount }}</div>
      <div>{{ t.smartArtCount }}: {{ stats.smartArtCount }}</div>
      <div>{{ t.commentRefCount }}: {{ stats.commentRefCount }}</div>
      <div>{{ t.revisionInsCount }}: {{ stats.revisionInsCount }}</div>
      <div>{{ t.revisionDelCount }}: {{ stats.revisionDelCount }}</div>
      <div>{{ t.pageBreakCount }}: {{ stats.pageBreakCount }}</div>
      <div>{{ t.pageSpacerCount }}: {{ stats.pageSpacerCount }}</div>
      <div>{{ t.textCharCount }}: {{ stats.textCharCount }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  WordFidelityEditorVue
} from "@coding01/docsjs/vue";
import { collectSemanticStatsFromHtml } from "@coding01/docsjs";
import type { DocsWordEditorElementApi, SemanticStats, DocxParseReport } from "@coding01/docsjs";

type Lang = "zh" | "en";
const lang = ref<Lang>("zh");
const text: Record<Lang, Record<string, string>> = {
  zh: {
    subtitle: "粘贴 Word/WPS/Google Docs 或上传 .docx 验证无损导入。",
    clear: "清空",
    loadClipboard: "读取系统剪贴板",
    exportSnapshot: "导出 HTML 快照（并复制）",
    parseElapsed: "解析耗时(ms)",
    source: "来源",
    snapshotLength: "快照长度",
    paragraphCount: "段落",
    headingCount: "标题",
    listParagraphCount: "列表段落",
    tableCount: "表格",
    tableCellCount: "单元格",
    imageCount: "图片",
    anchorImageCount: "浮动图",
    wrappedImageCount: "绕排图",
    ommlCount: "OMML",
    chartCount: "图表",
    smartArtCount: "SmartArt",
    commentRefCount: "评论引用",
    revisionInsCount: "修订新增",
    revisionDelCount: "修订删除",
    pageBreakCount: "分页断点",
    pageSpacerCount: "分页占位",
    textCharCount: "文本字符",
    zh: "中文",
    en: "English"
  },
  en: {
    subtitle: "Paste from Word/WPS/Google Docs or upload .docx to verify fidelity import.",
    clear: "Clear",
    loadClipboard: "Read Clipboard",
    exportSnapshot: "Export HTML Snapshot (copy)",
    parseElapsed: "Parse Elapsed(ms)",
    source: "Source",
    snapshotLength: "Snapshot Length",
    paragraphCount: "Paragraphs",
    headingCount: "Headings",
    listParagraphCount: "List Paragraphs",
    tableCount: "Tables",
    tableCellCount: "Cells",
    imageCount: "Images",
    anchorImageCount: "Anchored Images",
    wrappedImageCount: "Wrapped Images",
    ommlCount: "OMML",
    chartCount: "Charts",
    smartArtCount: "SmartArt",
    commentRefCount: "Comment Refs",
    revisionInsCount: "Revisions +",
    revisionDelCount: "Revisions -",
    pageBreakCount: "Page Breaks",
    pageSpacerCount: "Page Spacers",
    textCharCount: "Text Chars",
    zh: "中文",
    en: "English"
  }
};
const t = computed(() => text[lang.value]);

const editor = ref<DocsWordEditorElementApi | null>(null);
const source = ref("-");
const length = ref(0);
const stats = ref<SemanticStats>({
  paragraphCount: 0,
  headingCount: 0,
  tableCount: 0,
  tableCellCount: 0,
  imageCount: 0,
  anchorImageCount: 0,
  wrappedImageCount: 0,
  ommlCount: 0,
  chartCount: 0,
  smartArtCount: 0,
  listParagraphCount: 0,
  commentRefCount: 0,
  revisionInsCount: 0,
  revisionDelCount: 0,
  pageBreakCount: 0,
  pageSpacerCount: 0,
  textCharCount: 0
});
const report = ref<DocxParseReport | null>(null);

const onReady = (payload: { version: string }) => {
  console.log("ready", payload.version);
};

const onChange = (payload: { source: string; htmlSnapshot: string; parseReport?: DocxParseReport }) => {
  source.value = payload.source;
  length.value = payload.htmlSnapshot.length;
  stats.value = collectSemanticStatsFromHtml(payload.htmlSnapshot);
  report.value = payload.parseReport ?? null;
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
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.lang-toggle {
  display: flex;
  gap: 8px;
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
.stats {
  margin-top: 10px;
  color: #263356;
  font-size: 13px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}
</style>
