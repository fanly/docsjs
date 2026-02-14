import React from "react";
import { createRoot } from "react-dom/client";
import { WordFidelityEditorReact } from "@coding01/docsjs/react";
import type { DocsWordEditorElementApi } from "@coding01/docsjs/types";

function App() {
  const [source, setSource] = React.useState<string>("-");
  const [length, setLength] = React.useState<number>(0);
  const editorRef = React.useRef<DocsWordEditorElementApi | null>(null);

  return (
    <div style={{ maxWidth: 1320, margin: "20px auto", padding: "0 16px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: 8 }}>docsjs React Demo</h1>
      <p style={{ marginTop: 0, color: "#5b6788" }}>
        粘贴 Word/WPS/Google Docs 或上传 .docx，验证无损导入能力。
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => editorRef.current?.clear()}>清空</button>
        <button onClick={() => void editorRef.current?.loadClipboard()}>读取系统剪贴板</button>
        <button
          onClick={() => {
            const snapshot = editorRef.current?.getSnapshot() ?? "";
            setLength(snapshot.length);
            navigator.clipboard.writeText(snapshot).catch(() => undefined);
          }}
        >
          导出 HTML 快照（并复制）
        </button>
      </div>

      <WordFidelityEditorReact
        editorRef={(el) => {
          editorRef.current = el;
        }}
        onReady={(payload) => {
          console.log("ready", payload.version);
        }}
        onChange={(payload) => {
          setSource(payload.source);
          setLength(payload.htmlSnapshot.length);
        }}
        onError={(payload) => {
          alert(payload.message);
        }}
      />

      <div style={{ marginTop: 10, color: "#5b6788", fontSize: 13 }}>
        来源: {source} | 快照长度: {length}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
