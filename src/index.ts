// Core exports
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

// Server exports
export { DocsJSServer } from "./server/server";
export type { ServerConfig, ConvertRequest, ConvertResponse, ApiResponse } from "./server/types";

// Cloud infrastructure exports
export { DistributedQueue, BatchProcessor, CDNManager, WebhookManager, EdgeCache, createWebhookEvent } from "./cloud";
export { createLambdaHandler, createVercelHandler, createNetlifyHandler } from "./cloud";
export type { ServerlessConfig, QueueMessage, BatchJob, WebhookEvent, CDNConfig, ConversionRequest, ConversionResult, RateLimitConfig } from "./cloud";
// Enterprise exports
export { LicenseManager, AuditLogger, SecurityManager, ComplianceManager, createEnterpriseFeatures, ComplianceFramework, ComplianceFeature, OnPremisesDeploymentManager } from "./enterprise";
export type { LicenseInfo, LicenseValidationResult, ComplianceAuditLog, SecurityConfig } from "./enterprise";

// CMS exports
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

// Legacy alias
export { parseDocxToHtmlSnapshot as legacyParseDocxToHtml } from "./lib/docxHtml";

// Marketplace exports
export { PluginApprovalWorkflow, ApprovalStatus } from "./marketplace/approval";
export { PluginVersionManager, PluginCompatibilityChecker } from "./marketplace/version";
export { PluginAnalytics, AnalyticsAggregator, EventType } from "./marketplace/analytics";
export type { 
  ReviewCriteria, 
  SecurityAuditResult, 
  SubmissionResult,
  VersionConstraint,
  UpdateInfo,
  CompatibilityResult,
  UsageEvent,
  DashboardSummary,
  PerformanceMetrics
} from "./marketplace/approval";
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

// Editor exports
export { astToTipTap, tipTapToAst } from "./editors/tiptap";
export { astToSlate, slateToAst } from "./editors/slate";
export { astToProseMirror, proseMirrorToAst } from "./editors/prosemirror";

// SSO exports
export { SSOService, createOktaOAuth, createAzureADOAuth, createAuth0OAuth, createOktaSAML, createAzureADSAML } from "./sso";
export type { 
  OAuthConfig, 
  SAMLConfig, 
  SSOProvider, 
  SSOSession, 
  SSOUserProfile 
} from "./sso";

// Structure detection exports
export { StructureDetector, autoDetectAndApply } from "./structure";
export type { 
  DocumentStructureType, 
  StructureElement, 
  StructureAnalysis 
} from "./structure";

// Editor profiles exports
export { EDITOR_PROFILES, getEditorProfile, listEditorProfiles, createCustomEditorProfile } from "./profiles/editor-profiles";
export type { EditorProfile } from "./profiles/editor-profiles";

// Diff exports
export { DocumentDiffer, diffDocuments, compareDocuments } from "./lib/diff";
export type { DiffResult, DiffChange, ChangeHighlight, ComparisonReport, BlockDiff } from "./lib/diff";

// SaaS exports
export { 
  OrganizationManager,
  AdminManager,
  BillingManager,
  UsageBillingManager,
  PLAN_PRICING
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

// Embedded SDK exports
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

// AI exports
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

// Plugin economy exports
export { PluginEconomyManager, REVENUE_SHARE } from "./marketplace/economy";
export type {
  PluginPricing,
  FeatureTier,
  PluginRevenue,
  CreatorPayout,
  CreatorAccount,
  SalesRecord,
  Review
} from "./marketplace/economy";
