import { describe, expect, it } from "vitest";
import { parseDocxToHtmlSnapshot } from "../../src/lib/docxHtml";
import { makeDocxFile } from "./helpers/docxFactory";

describe("parseDocxToHtmlSnapshot page break markers", () => {
  it("renders explicit page break from w:br w:type=page", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body><w:p><w:r><w:t>A</w:t><w:br w:type="page"/><w:t>B</w:t></w:r></w:p></w:body>
      </w:document>`
    });
    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).toContain(`data-word-page-break="1"`);
  });

  it("renders lastRenderedPageBreak marker", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p><w:r><w:t>Before</w:t></w:r><w:lastRenderedPageBreak/><w:r><w:t>After</w:t></w:r></w:p>
        </w:body>
      </w:document>`
    });
    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).toContain(`data-word-page-break="1"`);
  });
});
