import { describe, expect, it } from "vitest";
import { parseDocxToHtmlSnapshot, parseDocxToHtmlSnapshotWithReport } from "../../src/lib/docxHtml";
import { makeDocxFile } from "./helpers/docxFactory";

describe("parseDocxToHtmlSnapshot modes and hyperlink", () => {
  it("renders external hyperlink from r:id relationship", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <w:body>
          <w:p>
            <w:hyperlink r:id="rId9">
              <w:r><w:t>Open Docs</w:t></w:r>
            </w:hyperlink>
          </w:p>
        </w:body>
      </w:document>`,
      relsXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId9" Target="https://example.com/docs" />
      </Relationships>`
    });

    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).toContain(`data-word-hyperlink="1"`);
    expect(html).toContain(`href="https://example.com/docs"`);
    expect(html).toContain(">Open Docs<");
  });

  it("renders anchor hyperlink from w:anchor", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:hyperlink w:anchor="chapter_2"><w:r><w:t>Jump</w:t></w:r></w:hyperlink>
          </w:p>
        </w:body>
      </w:document>`
    });

    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).toContain(`href="#chapter_2"`);
  });

  it("returns parse report under strict-only policy", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
        xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
        xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
        xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
        xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
        xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath><m:r><m:t>x</m:t></m:r></m:oMath>
            <w:r><w:drawing><wp:inline><a:graphic><a:graphicData><c:chart r:id="rId2"/></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>
          </w:p>
        </w:body>
      </w:document>`,
      relsXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId2" Target="charts/chart1.xml" />
      </Relationships>`,
      files: {
        "word/charts/chart1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart><c:plotArea><c:barChart/></c:plotArea></c:chart></c:chartSpace>`
      }
    });

    const result = await parseDocxToHtmlSnapshotWithReport(file);
    expect(result.report.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(result.report.features.ommlCount).toBe(1);
    expect(result.report.features.chartCount).toBe(1);
    expect(result.htmlSnapshot).toContain(`data-word-chart="1"`);
    expect(result.htmlSnapshot).toContain(`data-word-omml="1"`);
  });
});
