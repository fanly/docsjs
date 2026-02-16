import type { DocxParseReport } from "../lib/docxHtml";

export interface DocsWordEditorChangeDetail {
  htmlSnapshot: string;
  source: "paste" | "upload" | "api" | "clear";
  fileName?: string;
  parseReport?: DocxParseReport;
  timestamp: number;
  sequenceId: string;
}

export interface DocsWordEditorErrorDetail {
  message: string;
}

export interface DocsWordEditorReadyDetail {
  version: string;
}

export interface DocsWordEditorElementApi extends HTMLElement {
  loadDocx(file: File): Promise<void>;
  loadHtml(rawHtml: string): void;
  loadClipboard(): Promise<void>;
  clear(): void;
  getSnapshot(): string;
}

export interface CollaborationAdapter {
  onChange(detail: DocsWordEditorChangeDetail): void;
  getState(): DocsWordEditorChangeDetail | null;
}
