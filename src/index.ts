export { defineDocsWordElement, DocsWordElement } from "./core/DocsWordElement";
export { collectSemanticStatsFromDocument, collectSemanticStatsFromHtml } from "./lib/semanticStats";
export { calculateFidelityScore } from "./lib/fidelityScore";
export { parseDocxToHtmlSnapshot, parseDocxToHtmlSnapshotWithReport } from "./lib/docxHtml";
export { DocxPluginPipeline, getGlobalPipeline, createPipeline } from "./lib/pluginPipeline";
export type { DocxPluginPipelineConfig } from "./lib/pluginPipeline";
export type { SemanticStats } from "./lib/semanticStats";
export type { FidelityScore } from "./lib/fidelityScore";
export type { DocxParseFeatureCounts, DocxParseReport } from "./lib/docxHtml";
export type {
  DocsWordEditorChangeDetail,
  DocsWordEditorElementApi,
  DocsWordEditorErrorDetail,
  DocsWordEditorReadyDetail,
  CollaborationAdapter
} from "./core/types";
