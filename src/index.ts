export { defineDocsWordElement, DocsWordElement } from "./core/DocsWordElement";
export { collectSemanticStatsFromDocument, collectSemanticStatsFromHtml } from "./lib/semanticStats";
export { calculateFidelityScore } from "./lib/fidelityScore";
export type { SemanticStats } from "./lib/semanticStats";
export type { FidelityScore } from "./lib/fidelityScore";
export type {
  DocsWordEditorChangeDetail,
  DocsWordEditorElementApi,
  DocsWordEditorErrorDetail,
  DocsWordEditorReadyDetail
} from "./core/types";
