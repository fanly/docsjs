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
    expect(snapshot).toContain("Inserted");
    expect(snapshot).toContain("Deleted");
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

describe("parseDocxToHtmlSnapshot revision advanced features", () => {
  it("handles multiple insertions in same paragraph", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:r><w:t>Text </w:t></w:r>
            <w:ins w:id="1"><w:r><w:t>First</w:t></w:r></w:ins>
            <w:r><w:t> more </w:t></w:r>
            <w:ins w:id="2"><w:r><w:t>Second</w:t></w:r></w:ins>
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
      name: "multi-ins.docx",
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    } as unknown as File;

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("Text");
    expect(snapshot).toContain("First");
    expect(snapshot).toContain("more");
    expect(snapshot).toContain("Second");
    const insCount = (snapshot.match(/data-word-revision="ins"/g) ?? []).length;
    expect(insCount).toBe(2);
  });

  it("handles multiple deletions in same paragraph", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:del w:id="1"><w:r><w:delText>Old1</w:delText></w:r></w:del>
            <w:r><w:t> kept </w:t></w:r>
            <w:del w:id="2"><w:r><w:delText>Old2</w:delText></w:r></w:del>
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
      name: "multi-del.docx",
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    } as unknown as File;

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("Old1");
    expect(snapshot).toContain("kept");
    expect(snapshot).toContain("Old2");
    const delCount = (snapshot.match(/data-word-revision="del"/g) ?? []).length;
    expect(delCount).toBe(2);
  });

  it("preserves mixed insertion and deletion order", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:del w:id="1"><w:r><w:delText>Removed</w:delText></w:r></w:del>
            <w:ins w:id="2"><w:r><w:t>Added</w:t></w:r></w:ins>
            <w:r><w:t> unchanged</w:t></w:r>
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
      name: "mixed-rev.docx",
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    } as unknown as File;

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("Removed");
    expect(snapshot).toContain("Added");
    expect(snapshot).toContain("unchanged");
    const delIdx = snapshot.indexOf('data-word-revision="del"');
    const insIdx = snapshot.indexOf('data-word-revision="ins"');
    expect(delIdx).toBeLessThan(insIdx);
  });

  it("preserves formatting in deleted text", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:del w:id="1" w:author="Editor" w:date="2026-02-14T10:00:00Z">
              <w:r>
                <w:rPr><w:i/></w:rPr>
                <w:delText>ItalicDeleted</w:delText>
              </w:r>
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
      name: "formatted-del.docx",
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    } as unknown as File;

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("ItalicDeleted");
    expect(snapshot).toContain("font-style:italic");
  });

  it("handles revisions with different colors", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:ins w:id="1">
              <w:r>
                <w:rPr><w:color w:val="FF0000"/></w:rPr>
                <w:t>RedInsert</w:t>
              </w:r>
            </w:ins>
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
      name: "color-rev.docx",
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    } as unknown as File;

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("RedInsert");
    expect(snapshot).toContain("#FF0000");
  });

  it("handles revision across paragraph boundaries", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:ins w:id="1"><w:r><w:t>Para1Ins</w:t></w:r></w:ins>
          </w:p>
          <w:p>
            <w:del w:id="2"><w:r><w:delText>Para2Del</w:delText></w:r></w:del>
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
      name: "para-rev.docx",
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    } as unknown as File;

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("Para1Ins");
    expect(snapshot).toContain("Para2Del");
  });

  it("handles revision with underline and strikethrough", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:ins w:id="1">
              <w:r>
                <w:rPr><w:u/></w:rPr>
                <w:t>UnderlinedInsert</w:t>
              </w:r>
            </w:ins>
            <w:del w:id="2">
              <w:r>
                <w:rPr><w:strike/></w:rPr>
                <w:delText>StruckDel</w:delText>
              </w:r>
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
      name: "styled-rev.docx",
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    } as unknown as File;

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("UnderlinedInsert");
    expect(snapshot).toContain("StruckDel");
    expect(snapshot).toContain("text-decoration:underline");
    expect(snapshot).toContain("text-decoration:line-through");
  });
});
