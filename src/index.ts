export { defineDocsWordElement, DocsWordElement } from "./core/DocsWordElement";

export { collectSemanticStatsFromDocument, collectSemanticStatsFromHtml } from "./lib/semanticStats";
export { calculateFidelityScore } from "./lib/fidelityScore";

export { parseDocxToHtmlSnapshot, parseDocxToHtmlSnapshotWithReport } from "./lib/docxHtml";
export { DocxPluginPipeline, getGlobalPipeline, createPipeline } from "./lib/pluginPipeline";

export type { 
  DocsWordEditorChangeDetail,
  DocsWordEditorElementApi,
  DocsWordEditorErrorDetail, 
  DocsWordEditorReadyDetail
} from "./core/types";

export type {
  DocumentNode,
  SectionNode,
  BlockNode,
  ParagraphNode,
  HeadingNode,
  ListNode,
  TableNode,
  TextNode,
  HyperlinkNode,
  ImageNode
} from "./ast/types";

export { CoreEngine, getGlobalEngine, globalEngine } from "./engine/core";

export { PipelineManager } from "./pipeline/manager";

export { ProfileManager, SYSTEM_PROFILES } from "./profiles/profile-manager";

export { generateId, serializeAST, deserializeAST, cloneAST, walkAST, extractText } from "./ast/utils";

export { parseDocxToAST } from "./parsers/docx/parser";

export { DocsJSServer } from "./server/server";
export type { ServerConfig, ConvertRequest, ConvertResponse, ApiResponse } from "./server/types";

export { LicenseManager, AuditLogger, SecurityManager, ComplianceManager, createEnterpriseFeatures } from "./enterprise";
export type { LicenseInfo, LicenseValidationResult, ComplianceAuditLog, SecurityConfig } from "./enterprise";

export { createCMSAdapter, createWordPressAdapter, createContentfulAdapter, createStrapiAdapter } from "./cms";
export type { CMSAdapter, CMSImportOptions, CMSContent } from "./cms";

export { parseDocxToHtmlSnapshot as legacyParseDocxToHtml } from "./lib/docxHtml";
