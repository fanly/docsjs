import { describe, expect, it } from "vitest";
import { applyWordRenderModel } from "../../src/lib/renderApply";
import type { ParagraphStyleProfile, WordStyleProfile } from "../../src/lib/styleProfile";

function makeParagraphProfile(index: number, text: string, overrides?: Partial<ParagraphStyleProfile>): ParagraphStyleProfile {
  return {
    index,
    text,
    isEmpty: text.length === 0,
    align: "left",
    beforePx: null,
    afterPx: 8,
    lineHeightRatio: 1.2,
    lineHeightPx: null,
    lineHeightRule: "auto",
    indentLeftPx: null,
    indentRightPx: null,
    firstLinePx: null,
    hangingPx: null,
    listNumId: null,
    listLevel: null,
    listFormat: null,
    listTextPattern: null,
    listStartAt: 1,
    keepNext: false,
    keepLines: false,
    pageBreakBefore: false,
    sectionBreakBefore: false,
    runs: [],
    ...overrides
  };
}

function makeProfile(paragraphProfiles: ParagraphStyleProfile[]): WordStyleProfile {
  return {
    sourceFileName: "test.docx",
    bodyFontPx: 14.67,
    bodyLineHeightRatio: 1.158333,
    bodyLineHeightPx: null,
    bodyLineHeightRule: "auto",
    paragraphAfterPx: 10.67,
    contentWidthPx: 553.73,
    pageHeightPx: 1122.53,
    pageMarginTopPx: 96,
    pageMarginBottomPx: 96,
    titleFontPx: 32,
    titleColor: "#0F4761",
    titleAlign: "center",
    bodyFontFamily: "\"Times New Roman\", serif",
    titleFontFamily: "DengXian, sans-serif",
    discoveredFonts: [],
    tableCellPaddingTopPx: 0,
    tableCellPaddingLeftPx: 7.2,
    tableCellPaddingBottomPx: 0,
    tableCellPaddingRightPx: 7.2,
    paragraphProfiles,
    trailingDateText: null,
    trailingDateAlignedRight: false,
    trailingDateParagraphIndex: null,
    trailingEmptyParagraphCountBeforeDate: 0
  };
}

describe("applyWordRenderModel", () => {
  it("injects list marker metadata for structure-aware downstream analysis", () => {
    document.body.innerHTML = `<p id="p1">一级列表</p><p id="p2">二级列表</p>`;
    const profile = makeProfile([
      makeParagraphProfile(0, "一级列表", {
        listNumId: 1,
        listLevel: 0,
        listFormat: "decimal",
        listTextPattern: "%1."
      }),
      makeParagraphProfile(1, "二级列表", {
        listNumId: 1,
        listLevel: 1,
        listFormat: "lowerLetter",
        listTextPattern: "%1.%2."
      })
    ]);

    applyWordRenderModel({ doc: document, styleProfile: profile, showFormattingMarks: false });

    const marker1 = document.querySelector("#p1 > span.__word-list-marker");
    const marker2 = document.querySelector("#p2 > span.__word-list-marker");
    expect(marker1?.getAttribute("data-word-list-marker")).toBe("1");
    expect(marker2?.getAttribute("data-word-list-marker")).toBe("1");
  });

  it("inserts pagination spacer before page-break paragraph", () => {
    document.body.innerHTML = `<p id="a">A</p><p id="b">B</p>`;
    const profile = makeProfile([
      makeParagraphProfile(0, "A", { afterPx: 0 }),
      makeParagraphProfile(1, "B", { pageBreakBefore: true, afterPx: 0 })
    ]);
    profile.pageHeightPx = 200;
    profile.pageMarginTopPx = 10;
    profile.pageMarginBottomPx = 10;

    applyWordRenderModel({ doc: document, styleProfile: profile, showFormattingMarks: false });
    const b = document.getElementById("b");
    const prev = b?.previousElementSibling as HTMLElement | null;
    expect(prev?.dataset.wordPageSpacer).toBe("1");
  });
});
