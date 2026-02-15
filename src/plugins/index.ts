export { PluginRegistry, globalRegistry } from "./registry";
export { PluginPhase, PluginPriority, defaultPluginConfig } from "./base";
export type {
  DocxPlugin,
  PluginContext,
  PluginConfig,
  PluginRegistrationOptions,
  CleanupPlugin,
  TransformPlugin,
  ParagraphPlugin,
  RunPlugin,
  TablePlugin,
  ParagraphParseResult,
  RunParseResult,
  TableParseResult
} from "./base";

export { createGoogleDocsCleanupPlugin } from "./cleanup/googleDocs";
export { createWpsCleanupPlugin } from "./cleanup/wps";
export { createWordCleanupPlugin } from "./cleanup/word";

export { createBookmarkPlugin } from "./content/bookmark";
export { createHeaderFooterPlugin } from "./content/headerFooter";
export { createSectionPlugin } from "./content/section";
export { createDropCapPlugin } from "./content/dropCap";
export { createFieldPlugin } from "./content/field";
export { createCrossRefPlugin } from "./content/crossRef";

export { createShapePlugin } from "./render/shape";
export { createWordArtPlugin } from "./render/wordArt";
export { createOlePlugin } from "./render/ole";
export { createSdtPlugin } from "./render/sdt";

export { createStyleInheritancePlugin } from "./style/inheritance";
export { createListStylePlugin } from "./style/listStyle";

export { createMathMlPlugin } from "./math/mathMl";
export { createCaptionPlugin } from "./content/caption";
export { createWatermarkPlugin } from "./render/watermark";
export { createPageBackgroundPlugin } from "./render/pageBackground";
