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

describe("applyWordRenderModel - list markers", () => {
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

  it("formats decimal markers correctly", () => {
    document.body.innerHTML = `<p id="p1">Item 1</p><p id="p2">Item 2</p>`;
    const profile = makeProfile([
      makeParagraphProfile(0, "Item 1", { listNumId: 1, listLevel: 0, listFormat: "decimal", listTextPattern: "%1." }),
      makeParagraphProfile(1, "Item 2", { listNumId: 1, listLevel: 0, listFormat: "decimal", listTextPattern: "%1." })
    ]);
    applyWordRenderModel({ doc: document, styleProfile: profile, showFormattingMarks: false });
    expect(document.querySelector("#p1 > span.__word-list-marker")?.textContent?.trim()).toBe("1.");
    expect(document.querySelector("#p2 > span.__word-list-marker")?.textContent?.trim()).toBe("2.");
  });

  it("formats upperRoman markers correctly", () => {
    document.body.innerHTML = `<p id="p1">Item I</p><p id="p2">Item II</p>`;
    const profile = makeProfile([
      makeParagraphProfile(0, "Item I", { listNumId: 1, listLevel: 0, listFormat: "upperRoman", listTextPattern: "%1." }),
      makeParagraphProfile(1, "Item II", { listNumId: 1, listLevel: 0, listFormat: "upperRoman", listTextPattern: "%1." })
    ]);
    applyWordRenderModel({ doc: document, styleProfile: profile, showFormattingMarks: false });
    expect(document.querySelector("#p1 > span.__word-list-marker")?.textContent?.trim()).toBe("I.");
    expect(document.querySelector("#p2 > span.__word-list-marker")?.textContent?.trim()).toBe("II.");
  });

  it("formats lowerLetter markers correctly", () => {
    document.body.innerHTML = `<p id="p1">Item a</p><p id="p2">Item b</p>`;
    const profile = makeProfile([
      makeParagraphProfile(0, "Item a", { listNumId: 1, listLevel: 0, listFormat: "lowerLetter", listTextPattern: "%1." }),
      makeParagraphProfile(1, "Item b", { listNumId: 1, listLevel: 0, listFormat: "lowerLetter", listTextPattern: "%1." })
    ]);
    applyWordRenderModel({ doc: document, styleProfile: profile, showFormattingMarks: false });
    expect(document.querySelector("#p1 > span.__word-list-marker")?.textContent?.trim()).toBe("a.");
    expect(document.querySelector("#p2 > span.__word-list-marker")?.textContent?.trim()).toBe("b.");
  });

  it("formats multi-level pattern (%1.%2) correctly", () => {
    document.body.innerHTML = `<p id="p1">L1</p><p id="p2">L2</p><p id="p3">L1 again</p>`;
    const profile = makeProfile([
      makeParagraphProfile(0, "L1", { listNumId: 1, listLevel: 0, listFormat: "decimal", listTextPattern: "%1." }),
      makeParagraphProfile(1, "L2", { listNumId: 1, listLevel: 1, listFormat: "decimal", listTextPattern: "%1.%2." }),
      makeParagraphProfile(2, "L1 again", { listNumId: 1, listLevel: 0, listFormat: "decimal", listTextPattern: "%1." })
    ]);
    applyWordRenderModel({ doc: document, styleProfile: profile, showFormattingMarks: false });
    expect(document.querySelector("#p1 > span.__word-list-marker")?.textContent?.trim()).toBe("1.");
    expect(document.querySelector("#p2 > span.__word-list-marker")?.textContent?.trim()).toBe("1.1.");
    expect(document.querySelector("#p3 > span.__word-list-marker")?.textContent?.trim()).toBe("2.");
  });

  it("respects listStartAt for custom starting number", () => {
    document.body.innerHTML = `<p id="p1">Item 5</p><p id="p2">Item 6</p>`;
    const profile = makeProfile([
      makeParagraphProfile(0, "Item 5", { listNumId: 1, listLevel: 0, listFormat: "decimal", listTextPattern: "%1.", listStartAt: 5 }),
      makeParagraphProfile(1, "Item 6", { listNumId: 1, listLevel: 0, listFormat: "decimal", listTextPattern: "%1.", listStartAt: 5 })
    ]);
    applyWordRenderModel({ doc: document, styleProfile: profile, showFormattingMarks: false });
    expect(document.querySelector("#p1 > span.__word-list-marker")?.textContent?.trim()).toBe("5.");
    expect(document.querySelector("#p2 > span.__word-list-marker")?.textContent?.trim()).toBe("6.");
  });

  it("resets counters when sectionBreakBefore is true", () => {
    document.body.innerHTML = `<p id="p1">S1-1</p><p id="p2">S1-2</p><p id="p3">S2-1</p>`;
    const profile = makeProfile([
      makeParagraphProfile(0, "S1-1", { listNumId: 1, listLevel: 0, listFormat: "decimal", listTextPattern: "%1." }),
      makeParagraphProfile(1, "S1-2", { listNumId: 1, listLevel: 0, listFormat: "decimal", listTextPattern: "%1." }),
      makeParagraphProfile(2, "S2-1", { listNumId: 1, listLevel: 0, listFormat: "decimal", listTextPattern: "%1.", sectionBreakBefore: true })
    ]);
    applyWordRenderModel({ doc: document, styleProfile: profile, showFormattingMarks: false });
    expect(document.querySelector("#p1 > span.__word-list-marker")?.textContent?.trim()).toBe("1.");
    expect(document.querySelector("#p2 > span.__word-list-marker")?.textContent?.trim()).toBe("2.");
    expect(document.querySelector("#p3 > span.__word-list-marker")?.textContent?.trim()).toBe("1.");
  });

  it("indents nested levels appropriately", () => {
    document.body.innerHTML = `<p id="p1">L0</p><p id="p2">L1</p>`;
    const profile = makeProfile([
      makeParagraphProfile(0, "L0", { listNumId: 1, listLevel: 0, listFormat: "decimal", listTextPattern: "%1." }),
      makeParagraphProfile(1, "L1", { listNumId: 1, listLevel: 1, listFormat: "decimal", listTextPattern: "%1.%2." })
    ]);
    applyWordRenderModel({ doc: document, styleProfile: profile, showFormattingMarks: false });
    const marker0 = document.querySelector("#p1 > span.__word-list-marker") as HTMLElement;
    const marker1 = document.querySelector("#p2 > span.__word-list-marker") as HTMLElement;
    expect(marker0?.style.marginLeft).toBe("0px");
    expect(marker1?.style.marginLeft).toBe("1.2em");
  });
});

describe("applyWordRenderModel - pagination", () => {
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
