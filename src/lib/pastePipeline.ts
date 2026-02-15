import {
  globalRegistry,
  createGoogleDocsCleanupPlugin,
  createWpsCleanupPlugin,
  createWordCleanupPlugin,
  defaultPluginConfig,
  type PluginContext
} from "../plugins";

function escapeAttr(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

let cleanupPluginsInitialized = false;

function initializeCleanupPlugins(): void {
  if (cleanupPluginsInitialized) return;
  globalRegistry.register(createGoogleDocsCleanupPlugin());
  globalRegistry.register(createWpsCleanupPlugin());
  globalRegistry.register(createWordCleanupPlugin());
  cleanupPluginsInitialized = true;
}

async function runCleanupPlugins(html: string): Promise<string> {
  initializeCleanupPlugins();
  const context: PluginContext = {
    zip: null,
    documentXml: null,
    stylesXml: null,
    numberingXml: null,
    relsMap: {},
    metadata: {},
    config: defaultPluginConfig
  };
  return globalRegistry.cleanup(html, context);
}

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = await new Response(file).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary);
  const mime = file.type || "application/octet-stream";
  return `data:${mime};base64,${base64}`;
}

function isUnstableImageSrc(src: string): boolean {
  const normalized = src.trim().toLowerCase();
  return (
    normalized.startsWith("file:") ||
    normalized.startsWith("blob:") ||
    normalized.startsWith("cid:") ||
    normalized.startsWith("mhtml:") ||
    normalized.startsWith("ms-appx:") ||
    normalized.startsWith("ms-appdata:")
  );
}

async function replaceUnstableImageSrc(rawHtml: string, imageFiles: File[]): Promise<string> {
  if (!rawHtml.trim() || imageFiles.length === 0) return rawHtml;

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");
  const images = Array.from(doc.querySelectorAll("img"));

  const replacementDataUrls = await Promise.all(imageFiles.map((file) => fileToDataUrl(file)));
  let replacementIndex = 0;

  for (const img of images) {
    const src = img.getAttribute("src") ?? "";
    if (isUnstableImageSrc(src) && replacementIndex < replacementDataUrls.length) {
      img.setAttribute("src", replacementDataUrls[replacementIndex]);
      replacementIndex += 1;
    }
  }

  return doc.body.innerHTML;
}

async function buildImageOnlyHtml(imageFiles: File[]): Promise<string> {
  if (imageFiles.length === 0) return "";
  const urls = await Promise.all(imageFiles.map((f) => fileToDataUrl(f)));
  return urls.map((url) => `<p><img src="${escapeAttr(url)}" alt="clipboard-image" /></p>`).join("\n");
}

export interface PastePayload {
  html: string;
  text: string;
  imageFiles: File[];
}

export async function extractFromClipboardDataTransfer(dataTransfer: DataTransfer): Promise<PastePayload> {
  const html = dataTransfer.getData("text/html") || "";
  const text = dataTransfer.getData("text/plain") || "";

  const imageFiles = Array.from(dataTransfer.items)
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);

  const hydratedHtml = await replaceUnstableImageSrc(html, imageFiles);
  const cleanedHtml = await runCleanupPlugins(hydratedHtml);
  const finalHtml = cleanedHtml.trim() ? cleanedHtml : await buildImageOnlyHtml(imageFiles);

  return {
    html: finalHtml,
    text,
    imageFiles
  };
}

export async function extractFromClipboardItems(items: ClipboardItem[]): Promise<PastePayload> {
  let html = "";
  let text = "";
  const imageFiles: File[] = [];

  for (const item of items) {
    if (item.types.includes("text/html") && !html) {
      const blob = await item.getType("text/html");
      html = await blob.text();
    }
    if (item.types.includes("text/plain") && !text) {
      const blob = await item.getType("text/plain");
      text = await blob.text();
    }

    for (const type of item.types) {
      if (!type.startsWith("image/")) continue;
      const blob = await item.getType(type);
      const name = `clipboard-${Date.now()}-${imageFiles.length}.${type.split("/")[1] ?? "bin"}`;
      imageFiles.push(new File([blob], name, { type }));
    }
  }

  const hydratedHtml = await replaceUnstableImageSrc(html, imageFiles);
  const cleanedHtml = await runCleanupPlugins(hydratedHtml);
  const finalHtml = cleanedHtml.trim() ? cleanedHtml : await buildImageOnlyHtml(imageFiles);

  return {
    html: finalHtml,
    text,
    imageFiles
  };
}
