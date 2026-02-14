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

  it("maps tblGrid and tcW to css widths", async () => {
    const file = await makeDocxFile(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tblGrid>
              <w:gridCol w:w="2400"/>
              <w:gridCol w:w="4800"/>
            </w:tblGrid>
            <w:tr>
              <w:tc>
                <w:tcPr><w:tcW w:type="dxa" w:w="2400"/></w:tcPr>
                <w:p><w:r><w:t>A</w:t></w:r></w:p>
              </w:tc>
              <w:tc>
                <w:p><w:r><w:t>B</w:t></w:r></w:p>
              </w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`);

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(`width:480.00px`);
    expect(snapshot).toContain(`width:160.00px`);
    expect(snapshot).toContain(`width:320.00px`);
  });

  it("maps table layout, cell spacing and border model", async () => {
    const file = await makeDocxFile(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tblPr>
              <w:tblLayout w:type="autofit"/>
              <w:tblCellSpacing w:type="dxa" w:w="120"/>
              <w:tblBorders>
                <w:top w:val="single" w:sz="12" w:color="FF0000"/>
                <w:insideH w:val="single" w:sz="8" w:color="00AA00"/>
                <w:insideV w:val="single" w:sz="8" w:color="0000AA"/>
              </w:tblBorders>
            </w:tblPr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc>
              <w:tc>
                <w:tcPr>
                  <w:tcBorders>
                    <w:top w:val="single" w:sz="16" w:color="111111"/>
                  </w:tcBorders>
                </w:tcPr>
                <w:p><w:r><w:t>B</w:t></w:r></w:p>
              </w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`);
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("table-layout:auto");
    expect(snapshot).toContain("border-collapse:separate");
    expect(snapshot).toContain("border-spacing:8.00px");
    expect(snapshot).toContain("border:2.00px solid #FF0000");
    expect(snapshot).toContain("border-top:2.67px solid #111111");
  });
});
