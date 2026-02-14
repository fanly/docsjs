import JSZip from "jszip";

export interface DocxFactoryInput {
  documentXml: string;
  relsXml?: string;
  footnotesXml?: string;
  endnotesXml?: string;
  commentsXml?: string;
  media?: Record<string, Uint8Array>;
  name?: string;
}

const EMPTY_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;

export async function makeDocxFile(input: DocxFactoryInput): Promise<File> {
  const zip = new JSZip();
  zip.file("word/document.xml", input.documentXml);
  zip.file("word/_rels/document.xml.rels", input.relsXml ?? EMPTY_RELS);
  if (input.footnotesXml) zip.file("word/footnotes.xml", input.footnotesXml);
  if (input.endnotesXml) zip.file("word/endnotes.xml", input.endnotesXml);
  if (input.commentsXml) zip.file("word/comments.xml", input.commentsXml);

  for (const [path, bytes] of Object.entries(input.media ?? {})) {
    zip.file(`word/${path}`, bytes);
  }

  const bytes = await zip.generateAsync({ type: "uint8array" });
  const start = bytes.byteOffset;
  const end = bytes.byteOffset + bytes.byteLength;
  return {
    name: input.name ?? "fixture.docx",
    arrayBuffer: async () => bytes.buffer.slice(start, end)
  } as unknown as File;
}
