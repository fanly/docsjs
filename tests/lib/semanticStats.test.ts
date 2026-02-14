import { describe, expect, it } from "vitest";
import { collectSemanticStatsFromHtml } from "../../src/lib/semanticStats";

describe("collectSemanticStatsFromHtml", () => {
  it("collects structure and semantic counters", () => {
    const stats = collectSemanticStatsFromHtml(`
      <body>
        <h1>Title</h1>
        <p data-word-list="1"><span class="__word-list-marker">1.</span> item one</p>
        <p>plain</p>
        <table><tr><td>a</td><td>b</td></tr></table>
        <img src="x.png" />
      </body>
    `);

    expect(stats.headingCount).toBe(1);
    expect(stats.paragraphCount).toBe(2);
    expect(stats.listParagraphCount).toBe(1);
    expect(stats.tableCount).toBe(1);
    expect(stats.tableCellCount).toBe(2);
    expect(stats.imageCount).toBe(1);
    expect(stats.anchorImageCount).toBe(0);
    expect(stats.wrappedImageCount).toBe(0);
    expect(stats.textCharCount).toBeGreaterThan(0);
  });

  it("counts pagination spacer markers", () => {
    const stats = collectSemanticStatsFromHtml(`
      <body>
        <div data-word-page-spacer="1"></div>
        <p>demo</p>
      </body>
    `);
    expect(stats.pageSpacerCount).toBe(1);
  });

  it("detects mso-list styled paragraphs as list-like", () => {
    const stats = collectSemanticStatsFromHtml(`
      <body>
        <p style="mso-list:l0 level1 lfo1">ms list item</p>
      </body>
    `);
    expect(stats.listParagraphCount).toBe(1);
  });

  it("counts comments, revisions, and anchored images", () => {
    const stats = collectSemanticStatsFromHtml(`
      <body>
        <p><img data-word-anchor="1" src="a.png" /></p>
        <p><img data-word-wrap="square" src="w.png" /></p>
        <p><sup data-word-comment-ref="1">[c1]</sup></p>
        <p><ins data-word-revision="ins">I</ins><del data-word-revision="del">D</del></p>
      </body>
    `);
    expect(stats.anchorImageCount).toBe(1);
    expect(stats.wrappedImageCount).toBe(1);
    expect(stats.commentRefCount).toBe(1);
    expect(stats.revisionInsCount).toBe(1);
    expect(stats.revisionDelCount).toBe(1);
    expect(stats.pageBreakCount).toBe(0);
  });

  it("counts page break semantic markers", () => {
    const stats = collectSemanticStatsFromHtml(`
      <body>
        <span data-word-page-break="1"></span>
        <span data-word-page-break="1"></span>
      </body>
    `);
    expect(stats.pageBreakCount).toBe(2);
  });
});
