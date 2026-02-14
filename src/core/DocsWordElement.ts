import { buildHtmlSnapshot } from "../lib/htmlSnapshot";
import { parseDocxToHtmlSnapshotWithReport } from "../lib/docxHtml";
import { extractFromClipboardDataTransfer, extractFromClipboardItems } from "../lib/pastePipeline";
import { applyWordRenderModel } from "../lib/renderApply";
import { parseDocxStyleProfile, type WordStyleProfile } from "../lib/styleProfile";
import type { DocxParseReport } from "../lib/docxHtml";

const VERSION = "0.1.5";

type Locale = "zh" | "en";
type ChangeSource = "paste" | "upload" | "api" | "clear";

const MESSAGES: Record<Locale, {
  readClipboard: string;
  uploadWord: string;
  clear: string;
  pastePlaceholder: string;
  waitImport: string;
  loadedHtml: string;
  cleared: string;
  loadedWord: (name: string) => string;
  importedClipboard: string;
  noContent: string;
  noClipboardRead: string;
  parseFailed: string;
  clipboardReadFailed: string;
  errorPrefix: string;
}> = {
  zh: {
    readClipboard: "从系统剪贴板读取",
    uploadWord: "上传 Word",
    clear: "清空",
    pastePlaceholder: "在此处粘贴 Word/WPS/Google Docs 内容（Ctrl/Cmd+V）",
    waitImport: "等待内容导入",
    loadedHtml: "已加载 HTML 快照",
    cleared: "文档已清空",
    loadedWord: (name) => `已加载 Word 文件: ${name}`,
    importedClipboard: "已导入剪贴板内容",
    noContent: "未检测到可导入内容",
    noClipboardRead: "当前浏览器不支持 clipboard.read",
    parseFailed: "Word 解析失败",
    clipboardReadFailed: "读取剪贴板失败",
    errorPrefix: "错误: "
  },
  en: {
    readClipboard: "Read clipboard",
    uploadWord: "Upload Word",
    clear: "Clear",
    pastePlaceholder: "Paste Word/WPS/Google Docs content here (Ctrl/Cmd+V)",
    waitImport: "Waiting for input",
    loadedHtml: "HTML snapshot loaded",
    cleared: "Document cleared",
    loadedWord: (name) => `Word file loaded: ${name}`,
    importedClipboard: "Clipboard content imported",
    noContent: "No importable content detected",
    noClipboardRead: "navigator.clipboard.read is not supported in this browser",
    parseFailed: "Word parse failed",
    clipboardReadFailed: "Failed to read clipboard",
    errorPrefix: "Error: "
  }
};

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
  private toolbar: HTMLDivElement;
  private btnRead: HTMLButtonElement;
  private btnUpload: HTMLButtonElement;
  private btnClear: HTMLButtonElement;
  private frame: HTMLIFrameElement;
  private pasteArea: HTMLTextAreaElement;
  private fileInput: HTMLInputElement;
  private hint: HTMLSpanElement;
  private htmlSnapshot: string;
  private styleProfile: WordStyleProfile | null = null;
  private frameHeight = 0;
  private locale: Locale = "zh";

  constructor() {
    super();
    this.rootRef = this.attachShadow({ mode: "open" });
    this.locale = this.parseLocale(this.getAttribute("lang"));
    this.htmlSnapshot = buildHtmlSnapshot("<p><br/></p>");

    const style = document.createElement("style");
    style.textContent = BASE_CSS;

    this.toolbar = document.createElement("div");
    this.toolbar.className = "toolbar";

    this.btnRead = document.createElement("button");
    this.btnRead.onclick = () => void this.loadClipboard();

    this.btnUpload = document.createElement("button");
    this.btnUpload.onclick = () => this.fileInput.click();

    this.btnClear = document.createElement("button");
    this.btnClear.onclick = () => this.clear();

    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = ".docx";
    this.fileInput.style.display = "none";
    this.fileInput.onchange = () => void this.onUpload();

    this.toolbar.append(this.btnRead, this.btnUpload, this.btnClear, this.fileInput);

    this.pasteArea = document.createElement("textarea");
    this.pasteArea.className = "paste";
    this.pasteArea.placeholder = "";
    this.pasteArea.onpaste = (event) => {
      event.preventDefault();
      void this.applyFromClipboardData(event.clipboardData);
    };

    this.hint = document.createElement("span");
    this.hint.className = "hint";
    this.hint.textContent = "";

    this.frame = document.createElement("iframe");
    this.frame.sandbox.add("allow-same-origin", "allow-scripts");
    this.frame.onload = () => this.onFrameLoad();

    this.rootRef.append(style, this.toolbar, this.pasteArea, this.hint, this.frame);
    this.syncLocaleText();
    this.syncToolbarVisibility();
  }

  static get observedAttributes(): string[] {
    return ["lang", "show-toolbar"];
  }

  attributeChangedCallback(name: string, _: string | null, newValue: string | null): void {
    if (name === "lang") {
      this.locale = this.parseLocale(newValue);
      this.syncLocaleText();
      return;
    }
    if (name === "show-toolbar") {
      this.syncToolbarVisibility();
    }
  }

  connectedCallback(): void {
    this.renderSnapshot();
    this.dispatchEvent(new CustomEvent("docsjs-ready", { detail: { version: VERSION } }));
  }

  public setSnapshot(rawHtml: string): void {
    this.loadHtml(rawHtml);
  }

  public loadHtml(rawHtml: string): void {
    this.styleProfile = null;
    this.htmlSnapshot = buildHtmlSnapshot(rawHtml);
    this.renderSnapshot();
    this.setHint(MESSAGES[this.locale].loadedHtml);
    this.emitChange("api");
  }

  public getSnapshot(): string {
    return this.htmlSnapshot;
  }

  public clear(): void {
    this.styleProfile = null;
    this.htmlSnapshot = buildHtmlSnapshot("<p><br/></p>");
    this.renderSnapshot();
    this.setHint(MESSAGES[this.locale].cleared);
    this.emitChange("clear");
  }

  public async loadDocx(file: File): Promise<void> {
    await this.applyDocx(file);
  }

  private async onUpload(): Promise<void> {
    const file = this.fileInput.files?.[0];
    if (!file) return;
    await this.applyDocx(file);
    this.fileInput.value = "";
  }

  private async applyDocx(file: File): Promise<void> {
    try {
      const [parseResult, profile] = await Promise.all([
        parseDocxToHtmlSnapshotWithReport(file),
        parseDocxStyleProfile(file)
      ]);
      this.styleProfile = profile;
      this.htmlSnapshot = parseResult.htmlSnapshot;
      this.renderSnapshot();
      this.setHint(MESSAGES[this.locale].loadedWord(profile.sourceFileName));
      this.emitChange("upload", profile.sourceFileName, parseResult.report);
    } catch (error) {
      this.emitError(error instanceof Error ? error.message : MESSAGES[this.locale].parseFailed);
    }
  }

  public async loadClipboard(): Promise<void> {
    if (!navigator.clipboard?.read) {
      this.emitError(MESSAGES[this.locale].noClipboardRead);
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      const payload = await extractFromClipboardItems(items);
      this.applyPayload(payload.html, payload.text);
    } catch (error) {
      this.emitError(error instanceof Error ? error.message : MESSAGES[this.locale].clipboardReadFailed);
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
      this.setHint(MESSAGES[this.locale].noContent);
      return;
    }
    this.renderSnapshot();
    this.setHint(MESSAGES[this.locale].importedClipboard);
    this.emitChange("paste");
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

  private emitChange(source: ChangeSource, fileName?: string, parseReport?: DocxParseReport): void {
    this.dispatchEvent(
      new CustomEvent("docsjs-change", { detail: { htmlSnapshot: this.htmlSnapshot, source, fileName, parseReport } })
    );
  }

  private emitError(message: string): void {
    this.dispatchEvent(new CustomEvent("docsjs-error", { detail: { message } }));
    this.setHint(`${MESSAGES[this.locale].errorPrefix}${message}`);
  }

  private setHint(text: string): void {
    this.hint.textContent = text;
  }

  private parseLocale(value: string | null): Locale {
    return value?.toLowerCase() === "en" ? "en" : "zh";
  }

  private syncToolbarVisibility(): void {
    const raw = this.getAttribute("show-toolbar");
    const show = raw === null || raw === "" || raw === "1" || raw.toLowerCase() === "true";
    this.toolbar.style.display = show ? "flex" : "none";
  }

  private syncLocaleText(): void {
    const t = MESSAGES[this.locale];
    this.btnRead.textContent = t.readClipboard;
    this.btnUpload.textContent = t.uploadWord;
    this.btnClear.textContent = t.clear;
    this.pasteArea.placeholder = t.pastePlaceholder;
    if (!this.hint.textContent || this.hint.textContent === MESSAGES.en.waitImport || this.hint.textContent === MESSAGES.zh.waitImport) {
      this.hint.textContent = t.waitImport;
    }
  }
}

export function defineDocsWordElement(): void {
  if (!customElements.get("docs-word-editor")) {
    customElements.define("docs-word-editor", DocsWordElement);
  }
}
