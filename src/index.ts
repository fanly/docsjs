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

export { 
  createCMSAdapter, 
  createWordPressAdapter, 
  createContentfulAdapter, 
  createStrapiAdapter,
  createGhostAdapter,
  createNotionAdapter,
  createConfluenceAdapter,
  createGitBookAdapter
} from "./cms";
export type { 
  CMSAdapter, 
  CMSImportOptions, 
  CMSContent,
  WordPressOptions,
  ContentfulOptions,
  StrapiOptions,
  GhostOptions,
  NotionOptions,
  ConfluenceOptions,
  GitBookOptions
} from "./cms";
export type { CMSAdapter, CMSImportOptions, CMSContent } from "./cms";

export { parseDocxToHtmlSnapshot as legacyParseDocxToHtml } from "./lib/docxHtml";


export { SecurePluginRegistry, MarketplaceAPISimulator } from "./marketplace/registry";
export { PluginManager, generatePluginDocs } from "./marketplace/manager";
export type { 
  MarketplacePlugin, 
  PluginAuthor, 
  PluginSubmission, 
  PluginReview, 
  PluginSearchFilters,
  MarketplaceConfig,
  PluginInstallResult,
  PluginUpdateInfo
} from "./marketplace/types";
export type { 
  PluginVersion,
  PluginMetrics,
  PluginCompatibilityResult,
  PluginSearchQuery,
  PluginSearchResult,
  MarketplacePluginBrief,
  PluginSubmissionRequest,
  PluginApprovalStatus
} from "./marketplace/manager";
export type { 
  MarketplacePlugin, 
  PluginAuthor, 
  PluginSubmission, 
  PluginReview, 
  PluginSearchFilters,
  MarketplaceConfig,
  PluginInstallResult,
  PluginUpdateInfo
} from "./marketplace/types";

export { astToTipTap, tipTapToAst } from "./editors/tiptap";
export { astToSlate, slateToAst } from "./editors/slate";
export { astToProseMirror, proseMirrorToAst } from "./editors/prosemirror";

export { SSOService, createOktaOAuth, createAzureADOAuth, createAuth0OAuth, createOktaSAML, createAzureADSAML } from "./sso";
export type { 
  OAuthConfig, 
  SAMLConfig, 
  SSOProvider, 
  SSOSession, 
  SSOUserProfile 
} from "./sso";

export { StructureDetector, autoDetectAndApply } from "./structure";
export type { 
  DocumentStructureType, 
  StructureElement, 
  StructureAnalysis 
} from "./structure";

export { EDITOR_PROFILES, getEditorProfile, listEditorProfiles, createCustomEditorProfile } from "./profiles/editor-profiles";
export type { EditorProfile } from "./profiles/editor-profiles";

export { DocumentDiffer, diffDocuments, compareDocuments } from "./lib/diff";
export type { DiffResult, DiffChange, ChangeHighlight, ComparisonReport, BlockDiff } from "./lib/diff";
export type { 
  DocumentStructureType, 
  StructureElement, 
  StructureAnalysis 
} from "./structure";

export { 
  OrganizationManager,
  AdminManager,
  BillingManager,
  UsageBillingManager,
  PLAN_PRICING,
  REVENUE_SHARE
} from "./saas";
export type {
  Organization,
  OrganizationSettings,
  OrganizationMember,
  OrganizationInvitation,
  OrganizationRole,
  Subscription,
  SubscriptionPlan,
  UsageRecord,
  BillingInfo,
  Invoice,
  AdminStats,
  AdminAuditLog,
  SystemHealth,
  PaymentConfig,
  PaymentIntent,
  CheckoutSession
} from "./saas";

export { createEmbeddedClient, createEmbed, OEMLicenseManager } from "./embedded";
export type {
  EmbeddedSDKConfig,
  WhiteLabelConfig,
  SDKFeatures,
  EmbedOptions,
  EmbedInstance,
  WidgetConfig,
  WidgetInstance,
  OEMLicense,
  LicenseValidation
} from "./embedded";

export { AIDocumentEngine, ExtractionEngine, AIDocumentComparison, DOCUMENT_TEMPLATES } from "./ai/advanced";
export type {
  GenerationRequest,
  GenerationParams,
  GenerationResult,
  DocumentTemplate,
  TemplateField,
  DocumentAnalysis,
  Entity,
  Topic,
  ReadabilityScore,
  AssistantConfig,
  AssistantMessage,
  AssistantSession,
  ExtractionRequest,
  ContactInfo,
  TableData,
  DateInfo,
  LinkInfo,
  ComparisonInsight,
  AIDiffResult
} from "./ai/advanced";

export { PluginEconomyManager } from "./marketplace/economy";
export type {
  PluginPricing,
  FeatureTier,
  PluginRevenue,
  CreatorPayout,
  CreatorAccount,
  SalesRecord,
  Review
} from "./marketplace/economy";