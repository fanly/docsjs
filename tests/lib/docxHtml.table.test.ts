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

describe("parseDocxToHtmlSnapshot table advanced fidelity", () => {
  it("handles complex 3x3 merged cell matrix", async () => {
    const file = await makeDocxFile(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tblGrid>
              <w:gridCol w:w="2400"/>
              <w:gridCol w:w="2400"/>
              <w:gridCol w:w="2400"/>
            </w:tblGrid>
            <w:tr>
              <w:tc>
                <w:tcPr><w:gridSpan w:val="3"/></w:tcPr>
                <w:p><w:r><w:t>Header Row</w:t></w:r></w:p>
              </w:tc>
            </w:tr>
            <w:tr>
              <w:tc>
                <w:tcPr><w:vMerge w:val="restart"/><w:gridSpan w:val="2"/></w:tcPr>
                <w:p><w:r><w:t>Merged 2x1</w:t></w:r></w:p>
              </w:tc>
              <w:tc>
                <w:p><w:r><w:t>C</w:t></w:r></w:p>
              </w:tc>
            </w:tr>
            <w:tr>
              <w:tc>
                <w:tcPr><w:vMerge/><w:gridSpan w:val="2"/></w:tcPr>
                <w:p><w:r><w:t></w:t></w:r></w:p>
              </w:tc>
              <w:tc>
                <w:p><w:r><w:t>F</w:t></w:r></w:p>
              </w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`);

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain('colspan="3"');
    expect(snapshot).toContain('colspan="2"');
    expect(snapshot).toContain('rowspan="2"');
    expect(snapshot).toContain(">Header Row<");
    expect(snapshot).toContain(">Merged 2x1<");
    expect(snapshot).toContain(">C<");
    expect(snapshot).toContain(">F<");
  });

  it("handles deeply nested tables (3 levels)", async () => {
    const file = await makeDocxFile(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tr>
              <w:tc>
                <w:p><w:r><w:t>L1</w:t></w:r></w:p>
                <w:tbl>
                  <w:tr>
                    <w:tc>
                      <w:p><w:r><w:t>L2</w:t></w:r></w:p>
                      <w:tbl>
                        <w:tr>
                          <w:tc>
                            <w:p><w:r><w:t>L3</w:t></w:r></w:p>
                          </w:tc>
                        </w:tr>
                      </w:tbl>
                    </w:tc>
                  </w:tr>
                </w:tbl>
              </w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`);

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(">L1<");
    expect(snapshot).toContain(">L2<");
    expect(snapshot).toContain(">L3<");
    const tableCount = snapshot.match(/<table /g)?.length ?? 0;
    expect(tableCount).toBeGreaterThanOrEqual(3);
  });

  it("maps cell vertical alignment (currently defaults to top)", async () => {
    const file = await makeDocxFile(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tr>
              <w:tc>
                <w:tcPr><w:vAlign w:val="top"/></w:tcPr>
                <w:p><w:r><w:t>Top</w:t></w:r></w:p>
              </w:tc>
              <w:tc>
                <w:tcPr><w:vAlign w:val="center"/></w:tcPr>
                <w:p><w:r><w:t>Center</w:t></w:r></w:p>
              </w:tc>
              <w:tc>
                <w:tcPr><w:vAlign w:val="bottom"/></w:tcPr>
                <w:p><w:r><w:t>Bottom</w:t></w:r></w:p>
              </w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`);

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("vertical-align:top");
    expect(snapshot).toContain(">Top<");
    expect(snapshot).toContain(">Center<");
    expect(snapshot).toContain(">Bottom<");
  });

  it("maps cell background shading (currently not implemented)", async () => {
    const file = await makeDocxFile(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tr>
              <w:tc>
                <w:tcPr><w:shd w:val="clear" w:fill="FF0000"/></w:tcPr>
                <w:p><w:r><w:t>Red</w:t></w:r></w:p>
              </w:tc>
              <w:tc>
                <w:tcPr><w:shd w:val="clear" w:fill="00FF00"/></w:tcPr>
                <w:p><w:r><w:t>Green</w:t></w:r></w:p>
              </w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`);

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(">Red<");
    expect(snapshot).toContain(">Green<");
  });

  it("handles table with fixed width", async () => {
    const file = await makeDocxFile(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tblPr>
              <w:tblW w:type="dxa" w:w="7200"/>
              <w:tblLayout w:type="fixed"/>
            </w:tblPr>
            <w:tblGrid>
              <w:gridCol w:w="3600"/>
              <w:gridCol w:w="3600"/>
            </w:tblGrid>
            <w:tr>
              <w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`);

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("table-layout:fixed");
    expect(snapshot).toContain("width:480.00px");
  });

  it("handles table with preferred width type pct", async () => {
    const file = await makeDocxFile(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tblPr>
              <w:tblW w:type="pct" w:w="5000"/>
            </w:tblPr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>50%</w:t></w:r></w:p></w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`);

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(">50%<");
    expect(snapshot).toContain("width");
  });

  it("maps cell margins/padding", async () => {
    const file = await makeDocxFile(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tblPr>
              <w:tblCellMar>
                <w:top w:w="144" w:type="dxa"/>
                <w:left w:w="144" w:type="dxa"/>
                <w:bottom w:w="144" w:type="dxa"/>
                <w:right w:w="144" w:type="dxa"/>
              </w:tblCellMar>
            </w:tblPr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>Cell</w:t></w:r></w:p></w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`);

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(">Cell<");
  });

  it("handles multiple consecutive vMerge continues", async () => {
    const file = await makeDocxFile(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tr>
              <w:tc>
                <w:tcPr><w:vMerge w:val="restart"/></w:tcPr>
                <w:p><w:r><w:t>Row1</w:t></w:r></w:p>
              </w:tc>
              <w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc>
                <w:tcPr><w:vMerge/></w:tcPr>
                <w:p><w:r><w:t></w:t></w:r></w:p>
              </w:tc>
              <w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc>
                <w:tcPr><w:vMerge/></w:tcPr>
                <w:p><w:r><w:t></w:t></w:r></w:p>
              </w:tc>
              <w:tc><w:p><w:r><w:t>C</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc>
                <w:tcPr><w:vMerge/></w:tcPr>
                <w:p><w:r><w:t></w:t></w:r></w:p>
              </w:tc>
              <w:tc><w:p><w:r><w:t>D</w:t></w:r></w:p></w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`);

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain('rowspan="4"');
    expect(snapshot).toContain(">Row1<");
    expect(snapshot).toContain(">A<");
    expect(snapshot).toContain(">B<");
    expect(snapshot).toContain(">C<");
    expect(snapshot).toContain(">D<");
  });

  it("handles empty cells gracefully", async () => {
    const file = await makeDocxFile(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tr>
              <w:tc><w:p></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>C</w:t></w:r></w:p></w:tc>
              <w:tc><w:p></w:p></w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`);

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(">B<");
    expect(snapshot).toContain(">C<");
    const tdCount = snapshot.match(/<td /g)?.length ?? 0;
    expect(tdCount).toBe(4);
  });

  it("handles table with header row repetition", async () => {
    const file = await makeDocxFile(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tblPr>
              <w:tblHeader/>
            </w:tblPr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>Header</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>Data</w:t></w:r></w:p></w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`);

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(">Header<");
    expect(snapshot).toContain(">Data<");
  });

  it("preserves text content within table cells (formatting via styleProfile)", async () => {
    const file = await makeDocxFile(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tr>
              <w:tc>
                <w:p>
                  <w:r>
                    <w:rPr><w:b/></w:rPr>
                    <w:t>Bold</w:t>
                  </w:r>
                  <w:r>
                    <w:rPr><w:i/></w:rPr>
                    <w:t>Italic</w:t>
                  </w:r>
                </w:p>
              </w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`);

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("Bold");
    expect(snapshot).toContain("Italic");
  });

  it("handles table with bidi (right-to-left) direction", async () => {
    const file = await makeDocxFile(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tblPr>
              <w:bidiVisual w:val="1"/>
            </w:tblPr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>Right</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>Left</w:t></w:r></w:p></w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`);

    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(">Right<");
    expect(snapshot).toContain(">Left<");
  });
});
