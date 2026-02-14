import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { parseDocxStyleProfile } from "../../src/lib/styleProfile";

async function makeDocxFile(): Promise<File> {
  const zip = new JSZip();
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p>
          <w:pPr>
            <w:numPr>
              <w:ilvl w:val="0"/>
              <w:numId w:val="42"/>
            </w:numPr>
          </w:pPr>
          <w:r><w:t>Item</w:t></w:r>
        </w:p>
      </w:body>
    </w:document>`
  );
  zip.file(
    "word/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:docDefaults>
        <w:rPrDefault><w:rPr><w:sz w:val="24"/></w:rPr></w:rPrDefault>
        <w:pPrDefault><w:pPr><w:spacing w:line="276" w:lineRule="auto" w:after="120"/></w:pPr></w:pPrDefault>
      </w:docDefaults>
    </w:styles>`
  );
  zip.file(
    "word/numbering.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:abstractNum w:abstractNumId="1">
        <w:lvl w:ilvl="0">
          <w:start w:val="1"/>
          <w:numFmt w:val="decimal"/>
          <w:lvlText w:val="%1."/>
        </w:lvl>
      </w:abstractNum>
      <w:num w:numId="42">
        <w:abstractNumId w:val="1"/>
        <w:lvlOverride w:ilvl="0">
          <w:startOverride w:val="7"/>
          <w:lvl>
            <w:numFmt w:val="upperRoman"/>
            <w:lvlText w:val="%1)"/>
          </w:lvl>
        </w:lvlOverride>
      </w:num>
    </w:numbering>`
  );

  const bytes = await zip.generateAsync({ type: "uint8array" });
  const start = bytes.byteOffset;
  const end = bytes.byteOffset + bytes.byteLength;
  return {
    name: "numbering-override.docx",
    arrayBuffer: async () => bytes.buffer.slice(start, end)
  } as unknown as File;
}

describe("parseDocxStyleProfile numbering overrides", () => {
  it("applies lvlOverride and startOverride to paragraph list metadata", async () => {
    const file = await makeDocxFile();
    const profile = await parseDocxStyleProfile(file);
    const para = profile.paragraphProfiles[0];

    expect(para.listNumId).toBe(42);
    expect(para.listLevel).toBe(0);
    expect(para.listFormat).toBe("upperRoman");
    expect(para.listTextPattern).toBe("%1)");
    expect(para.listStartAt).toBe(7);
  });

  it("keeps abstract numbering defaults when override is absent", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="5"/></w:numPr></w:pPr>
            <w:r><w:t>X</w:t></w:r>
          </w:p>
        </w:body>
      </w:document>`
    );
    zip.file(
      "word/styles.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults/></w:styles>`
    );
    zip.file(
      "word/numbering.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:abstractNum w:abstractNumId="2">
          <w:lvl w:ilvl="0"><w:start w:val="3"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl>
        </w:abstractNum>
        <w:num w:numId="5"><w:abstractNumId w:val="2"/></w:num>
      </w:numbering>`
    );
    const bytes = await zip.generateAsync({ type: "uint8array" });
    const file = {
      name: "default-numbering.docx",
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    } as unknown as File;
    const profile = await parseDocxStyleProfile(file);
    const para = profile.paragraphProfiles[0];
    expect(para.listFormat).toBe("decimal");
    expect(para.listTextPattern).toBe("%1.");
    expect(para.listStartAt).toBe(3);
  });
});
