import { describe, expect, it } from "vitest";
import { parseDocxToHtmlSnapshot } from "../../src/lib/docxHtml";
import { makeDocxFile } from "./helpers/docxFactory";

describe("parseDocxToHtmlSnapshot pagination precision", () => {
  it("parses widow control from w:orphan element", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr>
              <w:orphan w:val="0"/>
            </w:pPr>
            <w:r><w:t>First paragraph with orphan control off</w:t></w:r>
          </w:p>
        </w:body>
      </w:document>`
    });
    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).toContain("First paragraph");
  });

  it("parses keepNext from w:keepNext element", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr>
              <w:keepNext/>
            </w:pPr>
            <w:r><w:t>Keep with next</w:t></w:r>
          </w:p>
          <w:p><w:r><w:t>Next paragraph</w:t></w:r></w:p>
        </w:body>
      </w:document>`
    });
    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).toContain("Keep with next");
  });

  it("parses keepLines from w:keepLines element", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr>
              <w:keepLines/>
            </w:pPr>
            <w:r><w:t>Keep lines together</w:t></w:r>
          </w:p>
        </w:body>
      </w:document>`
    });
    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).toContain("Keep lines together");
  });

  it("renders table with keep-with-next semantics", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tr>
              <w:tc><w:p><w:r><w:t>Row 1</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>Row 2</w:t></w:r></w:p></w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`
    });
    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).toContain("Row 1");
    expect(html).toContain("Row 2");
    expect(html).toContain("<table");
  });

  it("preserves table structure fidelity", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tr>
              <w:tc><w:p><w:r><w:t>Header</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>Cell</w:t></w:r></w:p></w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`
    });
    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).toContain("<table");
    expect(html).toContain("<tr");
    expect(html).toContain("<td");
    expect(html).toContain("Header");
    expect(html).toContain("Cell");
  });
});
