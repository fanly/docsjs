import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { parseDocxToHtmlSnapshot } from "../../src/lib/docxHtml";

async function makeDocxWithComments(): Promise<File> {
  const zip = new JSZip();
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p>
          <w:r><w:t>Commented text</w:t></w:r>
          <w:r><w:commentReference w:id="5"/></w:r>
        </w:p>
      </w:body>
    </w:document>`
  );
  zip.file(
    "word/comments.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:comment w:id="5" w:author="Alice" w:date="2026-02-14T12:00:00Z">
        <w:p><w:r><w:t>Review note</w:t></w:r></w:p>
      </w:comment>
    </w:comments>`
  );
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
  );

  const bytes = await zip.generateAsync({ type: "uint8array" });
  const start = bytes.byteOffset;
  const end = bytes.byteOffset + bytes.byteLength;
  return {
    name: "comments.docx",
    arrayBuffer: async () => bytes.buffer.slice(start, end)
  } as unknown as File;
}

describe("parseDocxToHtmlSnapshot comments", () => {
  it("renders comment reference and comments section", async () => {
    const file = await makeDocxWithComments();
    const snapshot = await parseDocxToHtmlSnapshot(file);

    expect(snapshot).toContain(`data-word-comment-ref="5"`);
    expect(snapshot).toContain(`data-word-comments="1"`);
    expect(snapshot).toContain("Review note");
    expect(snapshot).toContain("Alice");
  });

  it("deduplicates repeated comment references in comment list", async () => {
    const file = await makeDocxWithComments();
    const snapshot = await parseDocxToHtmlSnapshot(file);
    const count = snapshot.match(/data-word-comment-id="5"/g)?.length ?? 0;
    expect(count).toBe(1);
  });

  it("renders comment range markers from commentRangeStart/commentRangeEnd", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:commentRangeStart w:id="7"/>
            <w:r><w:t>Range</w:t></w:r>
            <w:commentRangeEnd w:id="7"/>
            <w:r><w:commentReference w:id="7"/></w:r>
          </w:p>
        </w:body>
      </w:document>`
    );
    zip.file(
      "word/comments.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:comment w:id="7"><w:p><w:r><w:t>Range note</w:t></w:r></w:p></w:comment>
      </w:comments>`
    );
    zip.file(
      "word/_rels/document.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
    );
    const bytes = await zip.generateAsync({ type: "uint8array" });
    const file = {
      name: "comment-range.docx",
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    } as unknown as File;

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(`data-word-comment-range-start="7"`);
    expect(snapshot).toContain(`data-word-comment-range-end="7"`);
    expect(snapshot).toContain(`data-word-comment-ref="7"`);
  });
});
