import { describe, expect, it } from "vitest";
import { parseDocxToHtmlSnapshot } from "../../src/lib/docxHtml";
import { DOCX_HTML_BASELINES } from "./baselines/docxHtml.baselines";
import { makeDocxFile } from "./helpers/docxFactory";

describe("docxHtml baseline suite", () => {
  for (const baseline of DOCX_HTML_BASELINES) {
    it(`matches baseline: ${baseline.name}`, async () => {
      const file = await makeDocxFile({ documentXml: baseline.documentXml, name: `${baseline.name}.docx` });
      const html = await parseDocxToHtmlSnapshot(file);
      for (const token of baseline.expects) {
        expect(html).toContain(token);
      }
    });
  }
});
