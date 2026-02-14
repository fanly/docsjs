import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { parseDocxToHtmlSnapshot } from "../../src/lib/docxHtml";

function makeDocxFile(documentXml: string): Promise<File> {
  const zip = new JSZip();
  zip.file("word/document.xml", documentXml);
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
  );
  return zip.generateAsync({ type: "uint8array" }).then((bytes) => {
    const start = bytes.byteOffset;
    const end = bytes.byteOffset + bytes.byteLength;
    return {
      name: "table.docx",
      arrayBuffer: async () => bytes.buffer.slice(start, end)
    } as unknown as File;
  });
}

describe("parseDocxToHtmlSnapshot table fidelity", () => {
  it("maps vMerge and gridSpan to rowspan/colspan", async () => {
    const file = await makeDocxFile(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tr>
              <w:tc>
                <w:tcPr>
                  <w:gridSpan w:val="2"/>
                  <w:vMerge w:val="restart"/>
                </w:tcPr>
                <w:p><w:r><w:t>A</w:t></w:r></w:p>
              </w:tc>
              <w:tc>
                <w:p><w:r><w:t>B</w:t></w:r></w:p>
              </w:tc>
            </w:tr>
            <w:tr>
              <w:tc>
                <w:tcPr>
                  <w:gridSpan w:val="2"/>
                  <w:vMerge/>
                </w:tcPr>
                <w:p><w:r><w:t></w:t></w:r></w:p>
              </w:tc>
              <w:tc>
                <w:p><w:r><w:t>C</w:t></w:r></w:p>
              </w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`);

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(`colspan="2"`);
    expect(snapshot).toContain(`rowspan="2"`);
    expect(snapshot).toContain(">A<");
    expect(snapshot).toContain(">B<");
    expect(snapshot).toContain(">C<");
  });

  it("renders nested tables inside table cells", async () => {
    const file = await makeDocxFile(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tr>
              <w:tc>
                <w:p><w:r><w:t>Outer</w:t></w:r></w:p>
                <w:tbl>
                  <w:tr>
                    <w:tc>
                      <w:p><w:r><w:t>Inner</w:t></w:r></w:p>
                    </w:tc>
                  </w:tr>
                </w:tbl>
              </w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`);

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(">Outer<");
    expect(snapshot).toContain(">Inner<");
    expect(snapshot.match(/<table /g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
});
