import { describe, expect, it } from "vitest";
import { calculateFidelityScore } from "../../src/lib/fidelityScore";
import type { SemanticStats } from "../../src/lib/semanticStats";

function makeStats(overrides?: Partial<SemanticStats>): SemanticStats {
  return {
    paragraphCount: 10,
    headingCount: 2,
    tableCount: 1,
    tableCellCount: 6,
    imageCount: 2,
    anchorImageCount: 1,
    wrappedImageCount: 1,
    listParagraphCount: 4,
    commentRefCount: 1,
    revisionInsCount: 1,
    revisionDelCount: 1,
    pageBreakCount: 1,
    pageSpacerCount: 3,
    textCharCount: 1200,
    ...overrides
  };
}

describe("calculateFidelityScore", () => {
  it("returns perfect score for identical stats", () => {
    const expected = makeStats();
    const actual = makeStats();
    const score = calculateFidelityScore(expected, actual);
    expect(score.structure).toBe(1);
    expect(score.styleProxy).toBe(1);
    expect(score.pagination).toBe(1);
    expect(score.overall).toBe(1);
  });

  it("penalizes structural mismatch", () => {
    const expected = makeStats();
    const actual = makeStats({
      paragraphCount: 6,
      tableCount: 0,
      tableCellCount: 0,
      listParagraphCount: 1
    });
    const score = calculateFidelityScore(expected, actual);
    expect(score.structure).toBeLessThan(0.8);
    expect(score.overall).toBeLessThan(0.9);
  });

  it("handles empty baselines without NaN", () => {
    const expected = makeStats({
      paragraphCount: 0,
      headingCount: 0,
      tableCount: 0,
      tableCellCount: 0,
      imageCount: 0,
      anchorImageCount: 0,
      wrappedImageCount: 0,
      listParagraphCount: 0,
      commentRefCount: 0,
      revisionInsCount: 0,
      revisionDelCount: 0,
      pageBreakCount: 0,
      pageSpacerCount: 0,
      textCharCount: 0
    });
    const actual = makeStats({
      paragraphCount: 0,
      headingCount: 0,
      tableCount: 0,
      tableCellCount: 0,
      imageCount: 0,
      anchorImageCount: 0,
      wrappedImageCount: 0,
      listParagraphCount: 0,
      commentRefCount: 0,
      revisionInsCount: 0,
      revisionDelCount: 0,
      pageBreakCount: 0,
      pageSpacerCount: 0,
      textCharCount: 0
    });
    const score = calculateFidelityScore(expected, actual);
    expect(Number.isFinite(score.overall)).toBe(true);
    expect(score.overall).toBe(1);
  });
});
