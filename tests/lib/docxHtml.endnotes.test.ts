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

  it("renders multiple endnote references", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:r><w:t>First</w:t></w:r>
            <w:r><w:endnoteReference w:id="1"/></w:r>
          </w:p>
          <w:p>
            <w:r><w:t>Second</w:t></w:r>
            <w:r><w:endnoteReference w:id="2"/></w:r>
          </w:p>
        </w:body>
      </w:document>`
    );
    zip.file(
      "word/endnotes.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:endnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:endnote w:id="-1"><w:p><w:r><w:t>separator</w:t></w:r></w:p></w:endnote>
        <w:endnote w:id="1"><w:p><w:r><w:t>Note A</w:t></w:r></w:p></w:endnote>
        <w:endnote w:id="2"><w:p><w:r><w:t>Note B</w:t></w:r></w:p></w:endnote>
      </w:endnotes>`
    );
    zip.file(
      "word/_rels/document.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
    );
    const bytes = await zip.generateAsync({ type: "uint8array" });
    const file = {
      name: "multi-endnote.docx",
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    } as unknown as File;

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(`data-word-endnote-ref="1"`);
    expect(snapshot).toContain(`data-word-endnote-ref="2"`);
    expect(snapshot).toContain("Note A");
    expect(snapshot).toContain("Note B");
  });

  it("preserves endnote content with formatting", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:r><w:t>Text</w:t></w:r>
            <w:r><w:endnoteReference w:id="1"/></w:r>
          </w:p>
        </w:body>
      </w:document>`
    );
    zip.file(
      "word/endnotes.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:endnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:endnote w:id="-1"><w:p><w:r><w:t>separator</w:t></w:r></w:p></w:endnote>
        <w:endnote w:id="1">
          <w:p>
            <w:r>
              <w:rPr><w:i/></w:rPr>
              <w:t>Italic</w:t>
            </w:r>
            <w:r><w:t> endnote</w:t></w:r>
          </w:p>
        </w:endnote>
      </w:endnotes>`
    );
    zip.file(
      "word/_rels/document.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
    );
    const bytes = await zip.generateAsync({ type: "uint8array" });
    const file = {
      name: "formatted-endnote.docx",
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    } as unknown as File;

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("Italic");
    expect(snapshot).toContain("endnote");
  });

  it("handles custom endnote numbering", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:r><w:t>Text</w:t></w:r>
            <w:r><w:endnoteReference w:id="1" customMarkFollows="1"/></w:r>
          </w:p>
        </w:body>
      </w:document>`
    );
    zip.file(
      "word/endnotes.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:endnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:endnote w:id="-1"><w:p><w:r><w:t>separator</w:t></w:r></w:p></w:endnote>
        <w:endnote w:id="1"><w:p><w:r><w:t>Custom note</w:t></w:r></w:p></w:endnote>
      </w:endnotes>`
    );
    zip.file(
      "word/_rels/document.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
    );
    const bytes = await zip.generateAsync({ type: "uint8array" });
    const file = {
      name: "custom-endnote.docx",
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    } as unknown as File;

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("Custom note");
  });

  it("preserves endnote section structure", async () => {
    const file = await makeDocxWithEndnotes();
    const snapshot = await parseDocxToHtmlSnapshot(file);

    expect(snapshot).toContain(`data-word-endnotes="1"`);
    const endnotesSection = snapshot.match(/data-word-endnotes="1"[^>]*>[\s\S]*?<\/section>/);
    expect(endnotesSection).toBeDefined();
  });
});
