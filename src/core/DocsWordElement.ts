import { buildHtmlSnapshot } from "../lib/htmlSnapshot";
import { parseDocxToHtmlSnapshot } from "../lib/docxHtml";
import { extractFromClipboardDataTransfer, extractFromClipboardItems } from "../lib/pastePipeline";
import { applyWordRenderModel } from "../lib/renderApply";
import { parseDocxStyleProfile, type WordStyleProfile } from "../lib/styleProfile";

const BASE_CSS = `
:host{display:block;border:1px solid #d8deea;border-radius:12px;background:#fff;overflow:hidden;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto}
.toolbar{display:flex;gap:8px;flex-wrap:wrap;padding:10px;border-bottom:1px solid #e8edf6;background:#f8faff}
button{border:1px solid #c8d2eb;background:#fff;border-radius:9px;padding:6px 10px;cursor:pointer}
.paste{width:100%;min-height:40px;border:1px dashed #95acef;border-radius:10px;background:#edf3ff;padding:8px 10px;box-sizing:border-box;resize:vertical}
.hint{display:block;padding:0 10px 10px;color:#4b5c82;font-size:12px}
iframe{width:100%;min-height:760px;border:0}
`;

export class DocsWordElement extends HTMLElement {
  private rootRef: ShadowRoot;
  private frame: HTMLIFrameElement;
  private pasteArea: HTMLTextAreaElement;
  private fileInput: HTMLInputElement;
  private hint: HTMLSpanElement;
  private htmlSnapshot: string;
  private styleProfile: WordStyleProfile | null = null;
  private frameHeight = 0;

  constructor() {
    super();
    this.rootRef = this.attachShadow({ mode: "open" });
    this.htmlSnapshot = buildHtmlSnapshot("<p><br/></p>");

    const style = document.createElement("style");
    style.textContent = BASE_CSS;

    const toolbar = document.createElement("div");
    toolbar.className = "toolbar";

    const btnRead = document.createElement("button");
    btnRead.textContent = "从系统剪贴板读取";
    btnRead.onclick = () => void this.readClipboard();

    const btnUpload = document.createElement("button");
    btnUpload.textContent = "上传 Word";
    btnUpload.onclick = () => this.fileInput.click();

    const btnClear = document.createElement("button");
    btnClear.textContent = "清空";
    btnClear.onclick = () => this.clear();

    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = ".docx";
    this.fileInput.style.display = "none";
    this.fileInput.onchange = () => void this.onUpload();

    toolbar.append(btnRead, btnUpload, btnClear, this.fileInput);

    this.pasteArea = document.createElement("textarea");
    this.pasteArea.className = "paste";
    this.pasteArea.placeholder = "在此处粘贴 Word/WPS/Google Docs 内容（Ctrl/Cmd+V）";
    this.pasteArea.onpaste = (event) => {
      event.preventDefault();
      void this.applyFromClipboardData(event.clipboardData);
    };

    this.hint = document.createElement("span");
    this.hint.className = "hint";
    this.hint.textContent = "等待内容导入";

    this.frame = document.createElement("iframe");
    this.frame.sandbox.add("allow-same-origin", "allow-scripts");
    this.frame.onload = () => this.onFrameLoad();

    this.rootRef.append(style, toolbar, this.pasteArea, this.hint, this.frame);
  }

  connectedCallback(): void {
    this.renderSnapshot();
  }

  public setSnapshot(rawHtml: string): void {
    this.styleProfile = null;
    this.htmlSnapshot = buildHtmlSnapshot(rawHtml);
    this.renderSnapshot();
    this.hint.textContent = "已加载 HTML 快照";
    this.emitChange();
  }

  public clear(): void {
    this.styleProfile = null;
    this.htmlSnapshot = buildHtmlSnapshot("<p><br/></p>");
    this.renderSnapshot();
    this.hint.textContent = "文档已清空";
    this.emitChange();
  }

  private async onUpload(): Promise<void> {
    const file = this.fileInput.files?.[0];
    if (!file) return;
    try {
      const [snapshot, profile] = await Promise.all([
        parseDocxToHtmlSnapshot(file),
        parseDocxStyleProfile(file)
      ]);
      this.styleProfile = profile;
      this.htmlSnapshot = snapshot;
      this.renderSnapshot();
      this.hint.textContent = `已加载 Word 文件: ${profile.sourceFileName}`;
      this.emitChange();
    } catch (error) {
      this.emitError(error instanceof Error ? error.message : "Word 解析失败");
    } finally {
      this.fileInput.value = "";
    }
  }

  private async readClipboard(): Promise<void> {
    if (!navigator.clipboard?.read) {
      this.emitError("当前浏览器不支持 clipboard.read");
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      const payload = await extractFromClipboardItems(items);
      this.applyPayload(payload.html, payload.text);
    } catch (error) {
      this.emitError(error instanceof Error ? error.message : "读取剪贴板失败");
    }
  }

  private async applyFromClipboardData(data: DataTransfer | null): Promise<void> {
    if (!data) return;
    const payload = await extractFromClipboardDataTransfer(data);
    this.applyPayload(payload.html, payload.text);
  }

  private applyPayload(html: string, text: string): void {
    this.styleProfile = null;
    if (html.trim()) {
      this.htmlSnapshot = buildHtmlSnapshot(html);
    } else if (text.trim()) {
      this.htmlSnapshot = buildHtmlSnapshot(`<p>${text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</p>`);
    } else {
      this.hint.textContent = "未检测到可导入内容";
      return;
    }
    this.renderSnapshot();
    this.hint.textContent = "已导入剪贴板内容";
    this.emitChange();
  }

  private onFrameLoad(): void {
    const doc = this.frame.contentDocument;
    if (!doc) return;

    applyWordRenderModel({
      doc,
      styleProfile: this.styleProfile,
      showFormattingMarks: false
    });

    this.syncHeight();
    window.setTimeout(() => this.syncHeight(), 120);
  }

  private syncHeight(): void {
    const doc = this.frame.contentDocument;
    if (!doc) return;
    const measured = Math.max(760, doc.body.scrollHeight, doc.documentElement.scrollHeight);
    const next = measured + 24;
    if (Math.abs(next - this.frameHeight) < 2) return;
    this.frameHeight = next;
    this.frame.style.height = `${next}px`;
  }

  private renderSnapshot(): void {
    this.frame.srcdoc = this.htmlSnapshot;
  }

  private emitChange(): void {
    this.dispatchEvent(new CustomEvent("docsjs-change", { detail: { htmlSnapshot: this.htmlSnapshot } }));
  }

  private emitError(message: string): void {
    this.dispatchEvent(new CustomEvent("docsjs-error", { detail: { message } }));
    this.hint.textContent = `错误: ${message}`;
  }
}

export function defineDocsWordElement(): void {
  if (!customElements.get("docs-word-editor")) {
    customElements.define("docs-word-editor", DocsWordElement);
  }
}
