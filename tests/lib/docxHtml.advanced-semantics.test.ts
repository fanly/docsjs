import { describe, expect, it } from "vitest";
import { parseDocxToHtmlSnapshot } from "../../src/lib/docxHtml";
import { makeDocxFile } from "./helpers/docxFactory";

describe("parseDocxToHtmlSnapshot advanced semantics", () => {
  it("renders OMML formula to linear fallback", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:sSup>
                <m:e><m:r><m:t>x</m:t></m:r></m:e>
                <m:sup><m:r><m:t>2</m:t></m:r></m:sup>
              </m:sSup>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(`data-word-omml="1"`);
    expect(snapshot).toContain("x^(2)");
  });

  it("extracts chart semantic summary from chart relationship", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
        xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
        xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
        xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
        xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <w:body><w:p><w:r><w:drawing><wp:inline><a:graphic><a:graphicData><c:chart r:id="rId2"/></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p></w:body>
      </w:document>`,
      relsXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId2" Target="charts/chart1.xml" />
      </Relationships>`,
      files: {
        "word/charts/chart1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart">
          <c:chart>
            <c:title><c:tx><c:rich><a:p xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:r><a:t>Sales</a:t></a:r></a:p></c:rich></c:tx></c:title>
            <c:plotArea>
              <c:barChart>
                <c:ser><c:idx val="0"/><c:tx><c:v>Q1</c:v></c:tx><c:cat><c:strLit><c:pt idx="0"><c:v>A</c:v></c:pt></c:strLit></c:cat></c:ser>
              </c:barChart>
            </c:plotArea>
          </c:chart>
        </c:chartSpace>`
      }
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(`data-word-chart="1"`);
    expect(snapshot).toContain(`data-word-chart-type="bar"`);
    expect(snapshot).toContain("Sales");
  });

  it("renders SmartArt fallback preview from diagram data relationship", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
        xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
        xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
        xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram"
        xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <w:body>
          <w:p><w:r><w:drawing>
            <wp:inline>
              <a:graphic><a:graphicData>
                <dgm:relIds r:dm="rId5" />
              </a:graphicData></a:graphic>
            </wp:inline>
          </w:drawing></w:r></w:p>
        </w:body>
      </w:document>`,
      relsXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId5" Target="diagrams/data1.xml" />
      </Relationships>`,
      files: {
        "word/diagrams/data1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <dgm:dataModel xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <dgm:ptLst>
            <dgm:pt><dgm:t><a:r><a:t>Plan</a:t></a:r></dgm:t></dgm:pt>
            <dgm:pt><dgm:t><a:r><a:t>Build</a:t></a:r></dgm:t></dgm:pt>
          </dgm:ptLst>
        </dgm:dataModel>`
      }
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(`data-word-smartart="1"`);
    expect(snapshot).toContain("SmartArt fallback");
    expect(snapshot).toContain("Plan / Build");
  });
});
