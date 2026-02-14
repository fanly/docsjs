import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { parseDocxToHtmlSnapshot } from "../../src/lib/docxHtml";

function makeDocxWithEndnotes(): Promise<File> {
  const zip = new JSZip();
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p>
          <w:r><w:t>Body</w:t></w:r>
          <w:r><w:endnoteReference w:id="3"/></w:r>
        </w:p>
      </w:body>
    </w:document>`
  );
  zip.file(
    "word/endnotes.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:endnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:endnote w:id="-1"><w:p><w:r><w:t>separator</w:t></w:r></w:p></w:endnote>
      <w:endnote w:id="3">
        <w:p><w:r><w:t>Endnote content</w:t></w:r></w:p>
      </w:endnote>
    </w:endnotes>`
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
      name: "endnote.docx",
      arrayBuffer: async () => bytes.buffer.slice(start, end)
    } as unknown as File;
  });
}

describe("parseDocxToHtmlSnapshot endnotes", () => {
  it("renders endnote references and endnote section", async () => {
    const file = await makeDocxWithEndnotes();
    const snapshot = await parseDocxToHtmlSnapshot(file);

    expect(snapshot).toContain(`data-word-endnote-ref="3"`);
    expect(snapshot).toContain(`data-word-endnotes="1"`);
    expect(snapshot).toContain("Endnote content");
  });
});
