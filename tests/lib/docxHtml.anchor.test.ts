import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { parseDocxToHtmlSnapshot } from "../../src/lib/docxHtml";

async function makeDocx(anchor = true): Promise<File> {
  const zip = new JSZip();
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document
      xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
      xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
      xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
      xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
      xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <w:body>
        <w:p>
          <w:r>
            <w:drawing>
              ${
                anchor
                  ? `<wp:anchor>
                      <wp:wrapSquare/>
                      <wp:positionH><wp:posOffset>914400</wp:posOffset></wp:positionH>
                      <wp:positionV><wp:posOffset>457200</wp:posOffset></wp:positionV>
                      <wp:extent cx="914400" cy="457200"/>
                      <a:graphic>
                        <a:graphicData>
                          <pic:pic><pic:blipFill><a:blip r:embed="rId1"/></pic:blipFill></pic:pic>
                        </a:graphicData>
                      </a:graphic>
                    </wp:anchor>`
                  : `<wp:inline>
                      <wp:extent cx="914400" cy="457200"/>
                      <a:graphic>
                        <a:graphicData>
                          <pic:pic><pic:blipFill><a:blip r:embed="rId1"/></pic:blipFill></pic:pic>
                        </a:graphicData>
                      </a:graphic>
                    </wp:inline>`
              }
            </w:drawing>
          </w:r>
        </w:p>
      </w:body>
    </w:document>`
  );
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Target="media/image1.png" />
    </Relationships>`
  );
  zip.file("word/media/image1.png", new Uint8Array([137, 80, 78, 71, 1, 2, 3]));

  const bytes = await zip.generateAsync({ type: "uint8array" });
  const start = bytes.byteOffset;
  const end = bytes.byteOffset + bytes.byteLength;
  return {
    name: "anchor.docx",
    arrayBuffer: async () => bytes.buffer.slice(start, end)
  } as unknown as File;
}

describe("parseDocxToHtmlSnapshot anchor image", () => {
  it("maps wp:anchor to absolute image style", async () => {
    const file = await makeDocx(true);
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(`data-word-anchor="1"`);
    expect(snapshot).toContain("position:absolute");
    expect(snapshot).toContain("left:96.00px");
    expect(snapshot).toContain("top:48.00px");
    expect(snapshot).toContain(`data-word-wrap="square"`);
  });

  it("keeps inline image without anchor marker", async () => {
    const file = await makeDocx(false);
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).not.toContain(`data-word-anchor="1"`);
    expect(snapshot).not.toContain("position:absolute");
  });

  it("maps topAndBottom wrap mode", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document
        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
        xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
        xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
        xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
        xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <w:body><w:p><w:r><w:drawing><wp:anchor><wp:wrapTopAndBottom/><wp:positionH><wp:posOffset>0</wp:posOffset></wp:positionH><wp:positionV><wp:posOffset>0</wp:posOffset></wp:positionV><wp:extent cx="914400" cy="457200"/><a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:embed="rId1"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p></w:body>
      </w:document>`
    );
    zip.file(
      "word/_rels/document.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Target="media/image1.png" />
      </Relationships>`
    );
    zip.file("word/media/image1.png", new Uint8Array([137, 80, 78, 71, 1, 2, 3]));
    const bytes = await zip.generateAsync({ type: "uint8array" });
    const file = {
      name: "anchor-wrap.docx",
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    } as unknown as File;
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain(`data-word-wrap="topAndBottom"`);
  });
});
