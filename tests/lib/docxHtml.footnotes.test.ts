import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { parseDocxToHtmlSnapshot } from "../../src/lib/docxHtml";

function makeDocxWithFootnotes(): Promise<File> {
  const zip = new JSZip();
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p>
          <w:r><w:t>Hello</w:t></w:r>
          <w:r><w:footnoteReference w:id="2"/></w:r>
        </w:p>
      </w:body>
    </w:document>`
  );
  zip.file(
    "word/footnotes.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:footnote w:id="-1"><w:p><w:r><w:t>separator</w:t></w:r></w:p></w:footnote>
      <w:footnote w:id="2">
        <w:p><w:r><w:t>Footnote content</w:t></w:r></w:p>
      </w:footnote>
    </w:footnotes>`
  );
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
  );
  return zip.generateAsync({ type: "uint8array" }).then((bytes) => {
    const start = bytes.byteOffset;
    const end = bytes.byteOffset + bytes.byteLength;
    return {
      name: "footnote.docx",
      arrayBuffer: async () => bytes.buffer.slice(start, end)
    } as unknown as File;
  });
}

describe("parseDocxToHtmlSnapshot footnotes", () => {
  it("renders footnote references and footnote section", async () => {
    const file = await makeDocxWithFootnotes();
    const snapshot = await parseDocxToHtmlSnapshot(file);

    expect(snapshot).toContain(`data-word-footnote-ref="2"`);
    expect(snapshot).toContain(`data-word-footnotes="1"`);
    expect(snapshot).toContain("Footnote content");
  });
});
