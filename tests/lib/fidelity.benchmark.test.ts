import { describe, expect, it } from "vitest";
import { parseDocxToHtmlSnapshotWithReport } from "../../src/lib/docxHtml";
import { collectSemanticStatsFromHtml } from "../../src/lib/semanticStats";
import { calculateFidelityScore } from "../../src/lib/fidelityScore";
import { getAllFixtureNames, getFixture } from "../fixtures";

describe("Fidelity Benchmark Suite", () => {
  describe("Basic Documents", () => {
    it("parses empty document without error", async () => {
      const { file } = await getFixture("empty");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toBeDefined();
      expect(result.htmlSnapshot).toContain("<!DOCTYPE html>");
      expect(result.report.elapsedMs).toBeGreaterThanOrEqual(0);
    });

    it("parses simple paragraph with correct structure", async () => {
      const { file, config } = await getFixture("simple-paragraph");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain("<p");
      expect(result.htmlSnapshot).toContain("Hello, World!");
      expect(result.htmlSnapshot).toContain("</p>");

      const stats = collectSemanticStatsFromHtml(result.htmlSnapshot);
      expect(stats.paragraphCount).toBe(config.expectedStats.paragraphCount);
    });

    it("parses multi-paragraph document with heading mapping", async () => {
      const { file, config } = await getFixture("multi-paragraph");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain("<h1");
      expect(result.htmlSnapshot).toContain("Document Title");
      expect(result.htmlSnapshot).toContain("<p");

      const stats = collectSemanticStatsFromHtml(result.htmlSnapshot);
      expect(stats.paragraphCount).toBe(config.expectedStats.paragraphCount);
      expect(stats.headingCount).toBeGreaterThanOrEqual(1);
    });

    it("parses mixed language document preserving characters", async () => {
      const { file, config } = await getFixture("mixed-language");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain("这是一段中文内容");
      expect(result.htmlSnapshot).toContain("This is English");
      expect(result.htmlSnapshot).toContain("©");
      expect(result.htmlSnapshot).toContain("→");

      const stats = collectSemanticStatsFromHtml(result.htmlSnapshot);
      expect(stats.paragraphCount).toBe(config.expectedStats.paragraphCount);
    });

    it("parses formatted text with style preservation", async () => {
      const { file } = await getFixture("formatted-text");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain("font-weight:700");
      expect(result.htmlSnapshot).toContain("font-style:italic");
      expect(result.htmlSnapshot).toContain("text-decoration:underline");
      expect(result.htmlSnapshot).toContain("#FF0000");
      expect(result.htmlSnapshot).toContain("vertical-align:super");
    });
  });

  describe("Table Fidelity", () => {
    it("parses simple table with correct structure", async () => {
      const { file, config } = await getFixture("simple-table");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain("<table");
      expect(result.htmlSnapshot).toContain("<tr");
      expect(result.htmlSnapshot).toContain("<td");
      expect(result.htmlSnapshot).toContain(">A1<");
      expect(result.htmlSnapshot).toContain(">C2<");

      const stats = collectSemanticStatsFromHtml(result.htmlSnapshot);
      expect(stats.tableCount).toBe(config.expectedStats.tableCount);
    });

    it("parses merged cell table with colspan/rowspan", async () => {
      const { file, config } = await getFixture("merged-cell-table");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain('colspan="3"');
      expect(result.htmlSnapshot).toContain('rowspan="2"');
      expect(result.htmlSnapshot).toContain("Header spanning 3 columns");

      const stats = collectSemanticStatsFromHtml(result.htmlSnapshot);
      expect(stats.tableCount).toBe(config.expectedStats.tableCount);
    });

    it("parses nested table preserving hierarchy", async () => {
      const { file, config } = await getFixture("nested-table");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain(">Outer cell<");
      expect(result.htmlSnapshot).toContain(">Inner cell 1<");
      expect(result.htmlSnapshot).toContain(">Inner cell 2<");

      const tableMatches = result.htmlSnapshot.match(/<table /g);
      expect(tableMatches?.length ?? 0).toBeGreaterThanOrEqual(2);

      const stats = collectSemanticStatsFromHtml(result.htmlSnapshot);
      expect(stats.tableCount).toBe(config.expectedStats.tableCount);
    });
  });

  describe("List Fidelity", () => {
    it("parses simple numbered list preserving content", async () => {
      const { file } = await getFixture("simple-numbered-list");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain("First item");
      expect(result.htmlSnapshot).toContain("Second item");
      expect(result.htmlSnapshot).toContain("Third item");
      expect(result.htmlSnapshot).toContain("data-word-p-index");
    });

    it("parses multi-level list preserving nested content", async () => {
      const { file } = await getFixture("multi-level-list");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain("Level 1 - Item 1");
      expect(result.htmlSnapshot).toContain("Level 2 - Item 1.1");
      expect(result.htmlSnapshot).toContain("Level 2 - Item 1.2");
      expect(result.htmlSnapshot).toContain("Level 3 - Item 1.2.1");
      expect(result.htmlSnapshot).toContain("Level 1 - Item 2");
    });
  });

  describe("Annotation Fidelity", () => {
    it("parses document with comments preserving references", async () => {
      const { file } = await getFixture("with-comments");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain('data-word-comment-ref="0"');
      expect(result.htmlSnapshot).toContain('data-word-comments="1"');
      expect(result.htmlSnapshot).toContain("This is a test comment");

      const stats = collectSemanticStatsFromHtml(result.htmlSnapshot);
      expect(stats.commentRefCount).toBeGreaterThanOrEqual(1);
    });

    it("parses document with footnotes preserving structure", async () => {
      const { file } = await getFixture("with-footnotes");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain('data-word-footnote-ref="1"');
      expect(result.htmlSnapshot).toContain('data-word-footnotes="1"');
      expect(result.htmlSnapshot).toContain("Footnote content here");

      expect(result.htmlSnapshot).toContain('data-word-footnotes="1"');
    });
  });

  describe("Revision Fidelity", () => {
    it("parses document with insertions and deletions", async () => {
      const { file } = await getFixture("with-revisions");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain('data-word-revision="ins"');
      expect(result.htmlSnapshot).toContain('data-word-revision="del"');
      expect(result.htmlSnapshot).toContain("Inserted text");
      expect(result.htmlSnapshot).toContain("Deleted text");

      const stats = collectSemanticStatsFromHtml(result.htmlSnapshot);
      expect(stats.revisionInsCount).toBeGreaterThanOrEqual(1);
      expect(stats.revisionDelCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Complex Document Fidelity", () => {
    it("parses contract template with mixed content", async () => {
      const { file, config } = await getFixture("contract-template");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain("合同编号");
      expect(result.htmlSnapshot).toContain("甲方");
      expect(result.htmlSnapshot).toContain("乙方");
      expect(result.htmlSnapshot).toContain("<table");
      expect(result.htmlSnapshot).toContain("¥100,000.00");

      const stats = collectSemanticStatsFromHtml(result.htmlSnapshot);
      expect(stats.tableCount).toBe(config.expectedStats.tableCount);
      expect(stats.headingCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Semantic Statistics Validation", () => {
    it("collects accurate stats for all fixture types", async () => {
      const fixtureNames = getAllFixtureNames();
      expect(fixtureNames.length).toBeGreaterThanOrEqual(10);

      for (const name of fixtureNames) {
        const { file, config } = await getFixture(name);
        const result = await parseDocxToHtmlSnapshotWithReport(file);
        const stats = collectSemanticStatsFromHtml(result.htmlSnapshot);

        if (config.expectedStats.paragraphCount !== undefined) {
          expect(stats.paragraphCount).toBe(config.expectedStats.paragraphCount);
        }
        if (config.expectedStats.tableCount !== undefined) {
          expect(stats.tableCount).toBe(config.expectedStats.tableCount);
        }
        if (config.expectedStats.listParagraphCount !== undefined) {
          expect(stats.listParagraphCount).toBe(
            config.expectedStats.listParagraphCount
          );
        }
      }
    });
  });

  describe("Fidelity Score Calculation", () => {
    it("calculates perfect score for identical documents", async () => {
      const { file } = await getFixture("simple-paragraph");
      const result = await parseDocxToHtmlSnapshotWithReport(file);
      const stats = collectSemanticStatsFromHtml(result.htmlSnapshot);

      const score = calculateFidelityScore(stats, stats);

      expect(score.structure).toBe(1);
      expect(score.styleProxy).toBe(1);
      expect(score.overall).toBe(1);
    });

    it("calculates lower score for different documents", async () => {
      const { file: file1 } = await getFixture("simple-paragraph");
      const { file: file2 } = await getFixture("multi-paragraph");

      const result1 = await parseDocxToHtmlSnapshotWithReport(file1);
      const result2 = await parseDocxToHtmlSnapshotWithReport(file2);

      const stats1 = collectSemanticStatsFromHtml(result1.htmlSnapshot);
      const stats2 = collectSemanticStatsFromHtml(result2.htmlSnapshot);

      const score = calculateFidelityScore(stats1, stats2);

      expect(score.structure).toBeLessThan(1);
      expect(score.overall).toBeLessThan(1);
    });
  });

  describe("Performance Baselines", () => {
    it("parses simple document within 100ms", async () => {
      const { file } = await getFixture("simple-paragraph");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.report.elapsedMs).toBeLessThan(100);
    });

    it("parses complex document within 500ms", async () => {
      const { file } = await getFixture("contract-template");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.report.elapsedMs).toBeLessThan(500);
    });

    it("reports feature counts accurately", async () => {
      const { file } = await getFixture("multi-paragraph");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.report.features).toBeDefined();
      expect(typeof result.report.features.tableCount).toBe("number");
      expect(typeof result.report.features.hyperlinkCount).toBe("number");
    });
  });

  describe("Lossless Paste Verification", () => {
    it("preserves all text content in simple document", async () => {
      const { file } = await getFixture("simple-paragraph");
      const result = await parseDocxToHtmlSnapshotWithReport(file);
      const stats = collectSemanticStatsFromHtml(result.htmlSnapshot);

      expect(stats.textCharCount).toBeGreaterThan(0);
      expect(result.htmlSnapshot).toContain("Hello, World!");
    });

    it("preserves all text content in mixed language document", async () => {
      const { file } = await getFixture("mixed-language");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain("这是一段中文内容");
      expect(result.htmlSnapshot).toContain("English content");
      expect(result.htmlSnapshot).toContain("特殊字符");
    });

    it("preserves table cell content without loss", async () => {
      const { file } = await getFixture("simple-table");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain(">A1<");
      expect(result.htmlSnapshot).toContain(">B1<");
      expect(result.htmlSnapshot).toContain(">C1<");
      expect(result.htmlSnapshot).toContain(">A2<");
      expect(result.htmlSnapshot).toContain(">B2<");
      expect(result.htmlSnapshot).toContain(">C2<");
    });

    it("preserves list item content without loss", async () => {
      const { file } = await getFixture("simple-numbered-list");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain("First item");
      expect(result.htmlSnapshot).toContain("Second item");
      expect(result.htmlSnapshot).toContain("Third item");
    });

    it("preserves revision content without loss", async () => {
      const { file } = await getFixture("with-revisions");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain("Normal text");
      expect(result.htmlSnapshot).toContain("Inserted text");
      expect(result.htmlSnapshot).toContain("Deleted text");
    });

    it("preserves annotation content without loss", async () => {
      const { file } = await getFixture("with-comments");
      const result = await parseDocxToHtmlSnapshotWithReport(file);

      expect(result.htmlSnapshot).toContain("Text with comment");
      expect(result.htmlSnapshot).toContain("This is a test comment");
    });
  });
});
