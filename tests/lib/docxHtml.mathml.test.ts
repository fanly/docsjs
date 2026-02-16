import { describe, expect, it } from "vitest";
import { parseDocxToHtmlSnapshot, parseDocxToHtmlSnapshotWithReport } from "../../src/lib/docxHtml";
import { makeDocxFile } from "./helpers/docxFactory";

describe("parseDocxToHtmlSnapshot OMML/MathML", () => {
  it("renders OMML to linear fallback by default", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>2</m:t></m:r></m:den></m:f>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("data-word-omml=\"1\"");
    expect(snapshot).toContain("(1)/(2)");
  });

  it("renders superscript to linear fallback", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:sSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("data-word-omml=\"1\"");
    expect(snapshot).toContain("x^(2)");
  });

  it("renders subscript to linear fallback", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:sSub><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>n</m:t></m:r></m:sub></m:sSub>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("data-word-omml=\"1\"");
    expect(snapshot).toContain("x_(n)");
  });

  it("renders sqrt to linear fallback", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:rad><m:e><m:r><m:t>x</m:t></m:r></m:e></m:rad>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("data-word-omml=\"1\"");
    expect(snapshot).toContain("sqrt(x)");
  });

  it("renders nth root to linear fallback", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:rad><m:deg><m:r><m:t>3</m:t></m:r></m:deg><m:e><m:r><m:t>x</m:t></m:r></m:e></m:rad>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("data-word-omml=\"1\"");
    expect(snapshot).toContain("sqrt(x)");
  });

  it("renders barOver to linear fallback", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:barOver><m:e><m:r><m:t>x</m:t></m:r></m:e></m:barOver>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("data-word-omml=\"1\"");
  });

  it("renders barUnder to linear fallback", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:barUnder><m:e><m:r><m:t>x</m:t></m:r></m:e></m:barUnder>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("data-word-omml=\"1\"");
  });

  it("renders bold math to linear fallback", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:b><m:r><m:t>x</m:t></m:r></m:b>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("data-word-omml=\"1\"");
  });

  it("renders italic math to linear fallback", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:i><m:r><m:t>x</m:t></m:r></m:i>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("data-word-omml=\"1\"");
  });

  it("renders complex expression to linear fallback", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:f><m:num><m:r><m:t>a</m:t></m:r></m:num><m:den><m:sup><m:e><m:r><m:t>b</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sup></m:den></m:f>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("data-word-omml=\"1\"");
    expect(snapshot).toContain("(a)/(b2)");
  });

  it("counts omml in parse report", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:r><m:t>x</m:t></m:r>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const result = await parseDocxToHtmlSnapshotWithReport(file);
    expect(result.report.features.ommlCount).toBeGreaterThan(0);
  });

  it("handles operator in math", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:r><m:t>x</m:t></m:r><m:r><m:t> </m:t></m:r><m:o><m:t>+</m:t></m:o><m:r><m:t> </m:t></m:r><m:r><m:t>y</m:t></m:r>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("data-word-omml=\"1\"");
  });

  it("handles number in math", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:r><m:t>123</m:t></m:r>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("data-word-omml=\"1\"");
    expect(snapshot).toContain("123");
  });

  it("handles nested fraction in superscript", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:sSup><m:e><m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>2</m:t></m:r></m:den></m:f></m:e><m:sup><m:r><m:t>3</m:t></m:r></m:sup></m:sSup>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("data-word-omml=\"1\"");
    expect(snapshot).toContain("^(3)");
  });

  it("handles multiple operators in sequence", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:r><m:t>a</m:t></m:r><m:o><m:t>+</m:t></m:o><m:r><m:t>b</m:t></m:r><m:o><m:t>*</m:t></m:o><m:r><m:t>c</m:t></m:r>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("data-word-omml=\"1\"");
    expect(snapshot).toContain("a");
    expect(snapshot).toContain("+");
    expect(snapshot).toContain("*");
    expect(snapshot).toContain("c");
  });

  it("handles empty math element gracefully", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath></m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).not.toContain("data-word-omml=\"1\"");
  });

  it("handles math with only whitespace gracefully", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>   </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).not.toContain("data-word-omml=\"1\"");
  });

  it("handles group character with custom character", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:groupChr chr="["><m:e><m:r><m:t>x</m:t></m:r></m:e></m:groupChr>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("data-word-omml=\"1\"");
  });

  it("handles lim element with base and limit", async () => {
    const file = await makeDocxFile({
      documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:body>
          <w:p>
            <m:oMath>
              <m:lim><m:e><m:r><m:t>x</m:t></m:r></m:e><m:lim><m:r><m:t>y</m:t></m:r></m:lim></m:lim>
            </m:oMath>
          </w:p>
        </w:body>
      </w:document>`
    });
    const snapshot = await parseDocxToHtmlSnapshot(file);
    expect(snapshot).toContain("data-word-omml=\"1\"");
  });
});
