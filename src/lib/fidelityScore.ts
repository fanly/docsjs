import type { SemanticStats } from "./semanticStats";

export interface FidelityScore {
  structure: number;
  styleProxy: number;
  pagination: number;
  overall: number;
}

function ratioScore(actual: number, expected: number): number {
  if (expected <= 0 && actual <= 0) return 1;
  if (expected <= 0 || actual < 0) return 0;
  const delta = Math.abs(actual - expected);
  const penalty = delta / expected;
  return Math.max(0, 1 - penalty);
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

export function calculateFidelityScore(expected: SemanticStats, actual: SemanticStats): FidelityScore {
  const structure = clamp01(
    (
      ratioScore(actual.paragraphCount, expected.paragraphCount) +
      ratioScore(actual.headingCount, expected.headingCount) +
      ratioScore(actual.tableCount, expected.tableCount) +
      ratioScore(actual.tableCellCount, expected.tableCellCount) +
      ratioScore(actual.imageCount, expected.imageCount) +
      ratioScore(actual.ommlCount, expected.ommlCount) +
      ratioScore(actual.chartCount, expected.chartCount) +
      ratioScore(actual.smartArtCount, expected.smartArtCount) +
      ratioScore(actual.listParagraphCount, expected.listParagraphCount)
    ) / 9
  );

  const styleProxy = clamp01(ratioScore(actual.textCharCount, expected.textCharCount));
  const pagination = clamp01(ratioScore(actual.pageSpacerCount, expected.pageSpacerCount));
  const overall = clamp01(structure * 0.6 + styleProxy * 0.25 + pagination * 0.15);

  return { structure, styleProxy, pagination, overall };
}
