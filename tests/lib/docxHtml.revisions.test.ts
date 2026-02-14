import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { parseDocxToHtmlSnapshot } from "../../src/lib/docxHtml";

async function makeDocxWithRevisions(): Promise<File> {
  const zip = new JSZip();
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p>
          <w:ins w:id="1">
            <w:r><w:t>Inserted</w:t></w:r>
          </w:ins>
          <w:del w:id="2">
            <w:r><w:delText>Deleted</w:delText></w:r>
          </w:del>
        </w:p>
      </w:body>
    </w:document>`
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
    name: "revisions.docx",
    arrayBuffer: async () => bytes.buffer.slice(start, end)
  } as unknown as File;
}

describe("parseDocxToHtmlSnapshot revisions", () => {
  it("renders inserted and deleted text markers", async () => {
    const file = await makeDocxWithRevisions();
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(`data-word-revision="ins"`);
    expect(snapshot).toContain(`data-word-revision="del"`);
    expect(snapshot).toContain(">Inserted<");
    expect(snapshot).toContain(">Deleted<");
  });

  it("keeps revision marker when run has inline style", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:ins w:id="1"><w:r><w:rPr><w:b/></w:rPr><w:t>BoldIns</w:t></w:r></w:ins>
          </w:p>
        </w:body>
      </w:document>`
    );
    zip.file(
      "word/_rels/document.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
    );
    const bytes = await zip.generateAsync({ type: "uint8array" });
    const file = {
      name: "revisions-style.docx",
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    } as unknown as File;
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(`data-word-revision="ins"`);
    expect(snapshot).toContain("font-weight:700");
  });

  it("keeps revision metadata attributes from ins/del container", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:ins w:id="11" w:author="Alice" w:date="2026-02-14T12:00:00Z">
              <w:r><w:t>InsMeta</w:t></w:r>
            </w:ins>
            <w:del w:id="12" w:author="Bob" w:date="2026-02-14T13:00:00Z">
              <w:r><w:delText>DelMeta</w:delText></w:r>
            </w:del>
          </w:p>
        </w:body>
      </w:document>`
    );
    zip.file(
      "word/_rels/document.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
    );
    const bytes = await zip.generateAsync({ type: "uint8array" });
    const file = {
      name: "revisions-meta.docx",
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    } as unknown as File;

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(`data-word-revision-id="11"`);
    expect(snapshot).toContain(`data-word-revision-author="Alice"`);
    expect(snapshot).toContain(`data-word-revision-date="2026-02-14T12:00:00Z"`);
    expect(snapshot).toContain(`data-word-revision-id="12"`);
    expect(snapshot).toContain(`data-word-revision-author="Bob"`);
    expect(snapshot).toContain(`data-word-revision-date="2026-02-14T13:00:00Z"`);
  });
});
