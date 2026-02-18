import { describe, expect, it } from "vitest";
import { parseDocxToHtmlSnapshot } from "../../src/lib/docxHtml";
import { makeDocxFile } from "./helpers/docxFactory";

describe("docxHtml plugin integration", () => {
  it("applies paragraph parse plugins without dropping original paragraph content", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:bookmarkStart w:id="1" w:name="intro"/>
            <w:r><w:t>Hello</w:t></w:r>
          </w:p>
        </w:body>
      </w:document>`
    });

    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).toContain(`data-word-bookmark-id="1"`);
    expect(html).toContain(`data-word-bookmark-name="intro"`);
    expect(html).toContain(">Hello<");
  });

  it("applies run parse plugins for shape placeholders", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:v="urn:schemas-microsoft-com:vml">
        <w:body>
          <w:p>
            <w:r>
              <w:pict>
                <v:shape type="#_x0000_t75" style="width:120;height:80"/>
              </w:pict>
            </w:r>
          </w:p>
        </w:body>
      </w:document>`
    });

    const html = await parseDocxToHtmlSnapshot(file);
    expect(html).toContain(`data-word-shape="#_x0000_t75"`);
  });
});
