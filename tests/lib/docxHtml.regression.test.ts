import { describe, expect, it } from "vitest";
import { parseDocxToHtmlSnapshot } from "../../src/lib/docxHtml";
import { makeDocxFile } from "./helpers/docxFactory";

describe("docxHtml regression baselines", () => {
  it("keeps heading tag mapping", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>T</w:t></w:r></w:p>
        </w:body>
      </w:document>`
    });
    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).toContain("<h1");
    expect(html).toContain(">T</h1>");
  });

  it("keeps paragraph alignment", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>C</w:t></w:r></w:p>
        </w:body>
      </w:document>`
    });
    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).toContain(`style="text-align:center;`);
  });

  it("maps run bold/italic/underline styles", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:r>
              <w:rPr><w:b/><w:i/><w:u w:val="single"/></w:rPr>
              <w:t>S</w:t>
            </w:r>
          </w:p>
        </w:body>
      </w:document>`
    });
    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).toContain("font-weight:700");
    expect(html).toContain("font-style:italic");
    expect(html).toContain("text-decoration:underline");
  });

  it("keeps text line breaks", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p><w:r><w:t>A</w:t><w:br/><w:t>B</w:t></w:r></w:p>
        </w:body>
      </w:document>`
    });
    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).toContain("A");
    expect(html).toContain("<br/>");
    expect(html).toContain("B");
  });

  it("renders fallback text when table cell has no paragraphs", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl><w:tr><w:tc><w:r><w:t>X</w:t></w:r></w:tc></w:tr></w:tbl>
        </w:body>
      </w:document>`
    });
    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).toContain(">X<");
  });

  it("ignores unresolved comment references safely", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body><w:p><w:r><w:commentReference w:id="999"/></w:r></w:p></w:body>
      </w:document>`
    });
    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).not.toContain("data-word-comment-ref");
  });

  it("ignores unresolved footnote references safely", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body><w:p><w:r><w:footnoteReference w:id="100"/></w:r></w:p></w:body>
      </w:document>`
    });
    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).not.toContain("data-word-footnote-ref");
  });

  it("renders image relation as data url", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
        xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
        xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
        xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
        xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <w:body>
          <w:p><w:r><w:drawing><wp:inline><wp:extent cx="914400" cy="914400"/><a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:embed="rId1"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>
        </w:body>
      </w:document>`,
      relsXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Target="media/image1.png" />
      </Relationships>`,
      media: { "media/image1.png": new Uint8Array([137, 80, 78, 71, 1, 2, 3]) }
    });
    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).toContain("data:image/png;base64");
  });
});
