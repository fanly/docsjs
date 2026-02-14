import React from "react";
import { createRoot } from "react-dom/client";
import { WordFidelityEditorReact } from "@coding01/docsjs/react";
import type { DocsWordEditorElementApi } from "@coding01/docsjs/types";
import { collectSemanticStatsFromHtml } from "@coding01/docsjs";
import type { SemanticStats } from "@coding01/docsjs";

type Lang = "zh" | "en";

const EMPTY_STATS: SemanticStats = {
  paragraphCount: 0,
  headingCount: 0,
  tableCount: 0,
  tableCellCount: 0,
  imageCount: 0,
  anchorImageCount: 0,
  wrappedImageCount: 0,
  listParagraphCount: 0,
  commentRefCount: 0,
  revisionInsCount: 0,
  revisionDelCount: 0,
  pageBreakCount: 0,
  pageSpacerCount: 0,
  textCharCount: 0
};

const TEXT: Record<Lang, Record<string, string>> = {
  zh: {
    subtitle: "粘贴 Word/WPS/Google Docs 或上传 .docx，验证无损导入能力。",
    clear: "清空",
    loadClipboard: "读取系统剪贴板",
    exportSnapshot: "导出 HTML 快照（并复制）",
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

function App() {
  const [lang, setLang] = React.useState<Lang>("zh");
  const [source, setSource] = React.useState<string>("-");
  const [length, setLength] = React.useState<number>(0);
  const [stats, setStats] = React.useState<SemanticStats>(EMPTY_STATS);
  const editorRef = React.useRef<DocsWordEditorElementApi | null>(null);
  const t = TEXT[lang];

  return (
    <div style={{ maxWidth: 1320, margin: "20px auto", padding: "0 16px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ marginBottom: 8 }}>docsjs React Demo</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setLang("zh")} disabled={lang === "zh"}>{t.zh}</button>
          <button onClick={() => setLang("en")} disabled={lang === "en"}>{t.en}</button>
        </div>
      </div>
      <p style={{ marginTop: 0, color: "#5b6788" }}>
        {t.subtitle}
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => editorRef.current?.clear()}>{t.clear}</button>
        <button onClick={() => void editorRef.current?.loadClipboard()}>{t.loadClipboard}</button>
        <button
          onClick={() => {
            const snapshot = editorRef.current?.getSnapshot() ?? "";
            setLength(snapshot.length);
            navigator.clipboard.writeText(snapshot).catch(() => undefined);
          }}
        >
          {t.exportSnapshot}
        </button>
      </div>

      <WordFidelityEditorReact
        lang={lang}
        editorRef={(el) => {
          editorRef.current = el;
        }}
        onReady={(payload) => {
          console.log("ready", payload.version);
        }}
        onChange={(payload) => {
          setSource(payload.source);
          setLength(payload.htmlSnapshot.length);
          setStats(collectSemanticStatsFromHtml(payload.htmlSnapshot));
        }}
        onError={(payload) => {
          alert(payload.message);
        }}
      />

      <div style={{ marginTop: 10, color: "#5b6788", fontSize: 13 }}>
        {t.source}: {source} | {t.snapshotLength}: {length}
      </div>
      <div style={{ marginTop: 10, color: "#263356", fontSize: 13, display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 6 }}>
        <div>{t.paragraphCount}: {stats.paragraphCount}</div>
        <div>{t.headingCount}: {stats.headingCount}</div>
        <div>{t.listParagraphCount}: {stats.listParagraphCount}</div>
        <div>{t.tableCount}: {stats.tableCount}</div>
        <div>{t.tableCellCount}: {stats.tableCellCount}</div>
        <div>{t.imageCount}: {stats.imageCount}</div>
        <div>{t.anchorImageCount}: {stats.anchorImageCount}</div>
        <div>{t.wrappedImageCount}: {stats.wrappedImageCount}</div>
        <div>{t.commentRefCount}: {stats.commentRefCount}</div>
        <div>{t.revisionInsCount}: {stats.revisionInsCount}</div>
        <div>{t.revisionDelCount}: {stats.revisionDelCount}</div>
        <div>{t.pageBreakCount}: {stats.pageBreakCount}</div>
        <div>{t.pageSpacerCount}: {stats.pageSpacerCount}</div>
        <div>{t.textCharCount}: {stats.textCharCount}</div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
