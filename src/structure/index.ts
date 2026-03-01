/**
 * Auto-structure Detection
 * 
 * Analyzes document content to automatically detect structure and recommend
 * appropriate processing profiles.
 */

import type { DocumentNode, BlockNode, ParagraphNode, HeadingNode, TextNode } from "../ast/types";

/**
 * Detected document structure type
 */
export type DocumentStructureType = 
  | "knowledge-base"      // Technical documentation, API docs
  | "exam-paper"         // Academic exams, quizzes
  | "business-report"    // Corporate reports, memos
  | "scientific-paper"   // Academic papers, research
  | "legal-document"    // Contracts, legal docs
  | "web-content"        // Blog posts, articles
  | "general";           // Generic document

/**
 * Detected structure element
 */
export interface StructureElement {
  /** Element type */
  type: "heading" | "list" | "table" | "code" | "image" | "math" | "link" | "blockquote";
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Example location (node ID) */
  exampleId?: string;
  
  /** Count of this element type */
  count: number;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Document structure analysis result
 */
export interface StructureAnalysis {
  /** Detected structure type */
  structureType: DocumentStructureType;
  
  /** Confidence in detection (0-1) */
  confidence: number;
  
  /** Detected elements */
  elements: StructureElement[];
  
  /** Recommended profile */
  recommendedProfile: string;
  
  /** Reasoning for detection */
  reasoning: string[];
  
  /** Additional metadata */
  metadata: {
    /** Total paragraphs */
    paragraphCount: number;
    
    /** Total headings */
    headingCount: number;
    
    /** Heading depth distribution */
    headingDepth: number[];
    
    /** Has code blocks */
    hasCodeBlocks: boolean;
    
    /** Has tables */
    hasTables: boolean;
    
    /** Has images */
    hasImages: boolean;
    
    /** Has math formulas */
    hasMathFormulas: boolean;
    
    /** Has hyperlinks */
    hasHyperlinks: boolean;
    
    /** Average paragraph length */
    avgParagraphLength: number;
    
    /** Language hints */
    languageHints: string[];
  };
}

/**
 * Document structure detector
 */
export class StructureDetector {
  /**
   * Analyze document structure
   */
  analyze(doc: DocumentNode): StructureAnalysis {
    const elements = this.detectElements(doc);
    const stats = this.calculateStats(doc);
    const type = this.detectType(elements, stats);
    const reasoning = this.generateReasoning(type, elements, stats);
    const profile = this.recommendProfile(type);
    
    return {
      structureType: type.type,
      confidence: type.confidence,
      elements,
      recommendedProfile: profile,
      reasoning,
      metadata: stats,
    };
  }
  
  /**
   * Detect structural elements
   */
  private detectElements(doc: DocumentNode): StructureElement[] {
    const elements: StructureElement[] = [];
    
    let headingCount = 0;
    let listCount = 0;
    let tableCount = 0;
    let codeCount = 0;
    let imageCount = 0;
    let mathCount = 0;
    let linkCount = 0;
    let blockquoteCount = 0;
    
    const headingIds: string[] = [];
    
    this.walkAST(doc, (node) => {
      switch (node.type) {
        case "heading":
          headingCount++;
          if (node.id) headingIds.push(node.id);
          break;
        case "list":
          listCount++;
          break;
        case "table":
          tableCount++;
          break;
        case "codeBlock":
          codeCount++;
          break;
        case "image":
          imageCount++;
          break;
        case "math":
          mathCount++;
          break;
        case "hyperlink":
          linkCount++;
          break;
        case "blockquote":
          blockquoteCount++;
          break;
      }
    });
    
    if (headingCount > 0) {
      elements.push({
        type: "heading",
        confidence: Math.min(1, headingCount / 3),
        count: headingCount,
        exampleId: headingIds[0],
      });
    }
    
    if (listCount > 0) {
      elements.push({
        type: "list",
        confidence: Math.min(1, listCount / 2),
        count: listCount,
      });
    }
    
    if (tableCount > 0) {
      elements.push({
        type: "table",
        confidence: Math.min(1, tableCount / 2),
        count: tableCount,
      });
    }
    
    if (codeCount > 0) {
      elements.push({
        type: "code",
        confidence: 0.9,
        count: codeCount,
        metadata: { languages: this.detectCodeLanguages(doc) },
      });
    }
    
    if (imageCount > 0) {
      elements.push({
        type: "image",
        confidence: 0.9,
        count: imageCount,
      });
    }
    
    if (mathCount > 0) {
      elements.push({
        type: "math",
        confidence: 0.9,
        count: mathCount,
      });
    }
    
    if (linkCount > 0) {
      elements.push({
        type: "link",
        confidence: Math.min(1, linkCount / 5),
        count: linkCount,
        metadata: { externalLinks: this.countExternalLinks(doc) },
      });
    }
    
    if (blockquoteCount > 0) {
      elements.push({
        type: "blockquote",
        confidence: 0.8,
        count: blockquoteCount,
      });
    }
    
    return elements;
  }
  
  /**
   * Calculate document statistics
   */
  private calculateStats(doc: DocumentNode): StructureAnalysis["metadata"] {
    let paragraphCount = 0;
    let headingCount = 0;
    const headingDepth: number[] = [0, 0, 0, 0, 0, 0];
    let hasCodeBlocks = false;
    let hasTables = false;
    let hasImages = false;
    let hasMathFormulas = false;
    let hasHyperlinks = false;
    let totalTextLength = 0;
    let textNodeCount = 0;
    const languageHints: string[] = [];
    
    this.walkAST(doc, (node) => {
      if (node.type === "paragraph") {
        paragraphCount++;
        const text = this.extractText(node);
        totalTextLength += text.length;
        textNodeCount++;
        
        // Detect language hints
        if (this.looksLikeCode(text)) {
          languageHints.push("code");
          hasCodeBlocks = true;
        }
        if (this.looksLikeMath(text)) {
          languageHints.push("math");
          hasMathFormulas = true;
        }
      }
      
      if (node.type === "heading") {
        headingCount++;
        const h = node as HeadingNode;
        if (h.level >= 1 && h.level <= 6) {
          headingDepth[h.level - 1]++;
        }
      }
      
      if (node.type === "table") hasTables = true;
      if (node.type === "image") hasImages = true;
      if (node.type === "hyperlink") hasHyperlinks = true;
    });
    
    return {
      paragraphCount,
      headingCount,
      headingDepth,
      hasCodeBlocks,
      hasTables,
      hasImages,
      hasMathFormulas,
      hasHyperlinks,
      avgParagraphLength: textNodeCount > 0 ? totalTextLength / textNodeCount : 0,
      languageHints: [...new Set(languageHints)],
    };
  }
  
  /**
   * Detect document type based on elements and stats
   */
  private detectType(
    elements: StructureElement[], 
    stats: StructureAnalysis["metadata"]
  ): { type: DocumentStructureType; confidence: number } {
    const scores: Record<DocumentStructureType, number> = {
      "knowledge-base": 0,
      "exam-paper": 0,
      "business-report": 0,
      "scientific-paper": 0,
      "legal-document": 0,
      "web-content": 0,
      "general": 0.1,
    };
    
    // Knowledge base detection
    if (stats.hasCodeBlocks) scores["knowledge-base"] += 0.4;
    if (stats.hasTables) scores["knowledge-base"] += 0.2;
    if (this.hasMultipleHeadingLevels(stats.headingDepth)) scores["knowledge-base"] += 0.2;
    if (elements.find(e => e.type === "heading" && e.count > 5)) scores["knowledge-base"] += 0.2;
    
    // Exam paper detection
    if (elements.find(e => e.type === "list" && e.count > 3)) scores["exam-paper"] += 0.3;
    if (stats.hasTables && !stats.hasImages) scores["exam-paper"] += 0.2;
    if (this.hasShortParagraphs(stats.avgParagraphLength)) scores["exam-paper"] += 0.3;
    if (this.containsNumberedQuestions(stats)) scores["exam-paper"] += 0.3;
    
    // Business report detection
    if (stats.hasTables) scores["business-report"] += 0.3;
    if (stats.hasImages) scores["business-report"] += 0.2;
    if (elements.find(e => e.type === "heading")?.count && 
        elements.find(e => e.type === "heading")!.count < 10) scores["business-report"] += 0.2;
    if (elements.find(e => e.type === "blockquote")) scores["business-report"] += 0.1;
    
    // Scientific paper detection
    if (stats.hasMathFormulas) scores["scientific-paper"] += 0.5;
    if (stats.hasTables && stats.hasImages) scores["scientific-paper"] += 0.3;
    if (this.hasAcademicHeadings(stats.headingDepth)) scores["scientific-paper"] += 0.2;
    
    // Legal document detection
    if (this.containsLegalPhrases(stats)) scores["legal-document"] += 0.5;
    if (!stats.hasCodeBlocks && !stats.hasMathFormulas && 
        stats.paragraphCount > 20) scores["legal-document"] += 0.2;
    
    // Web content detection
    if (stats.hasHyperlinks && !stats.hasTables) scores["web-content"] += 0.3;
    if (!stats.hasCodeBlocks && !stats.hasTables && 
        stats.avgParagraphLength < 200) scores["web-content"] += 0.3;
    if (!stats.hasMathFormulas) scores["web-content"] += 0.1;
    
    // Find highest score
    let maxType: DocumentStructureType = "general";
    let maxScore = 0;
    
    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxType = type as DocumentStructureType;
      }
    }
    
    const confidence = Math.min(0.95, maxScore);
    
    return { type: maxType, confidence };
  }
  
  /**
   * Generate reasoning for detection
   */
  private generateReasoning(
    type: { type: DocumentStructureType; confidence: number },
    elements: StructureElement[],
    stats: StructureAnalysis["metadata"]
  ): string[] {
    const reasoning: string[] = [];
    
    switch (type.type) {
      case "knowledge-base":
        if (stats.hasCodeBlocks) reasoning.push("Contains code blocks indicating technical documentation");
        if (elements.find(e => e.type === "heading" && e.count > 5)) reasoning.push("Multiple headings suggest structured documentation");
        break;
      case "exam-paper":
        if (elements.find(e => e.type === "list" && e.count > 3)) reasoning.push("Multiple lists suggest questions or exercises");
        if (this.hasShortParagraphs(stats.avgParagraphLength)) reasoning.push("Short paragraphs suggest questions or answers");
        break;
      case "business-report":
        if (stats.hasTables) reasoning.push("Contains tables typical of business reports");
        if (stats.hasImages) reasoning.push("Contains images typical of business documents");
        break;
      case "scientific-paper":
        if (stats.hasMathFormulas) reasoning.push("Contains mathematical formulas");
        if (stats.hasTables && stats.hasImages) reasoning.push("Contains tables and figures typical of academic papers");
        break;
      case "legal-document":
        reasoning.push("Document structure consistent with legal contracts");
        break;
      case "web-content":
        if (stats.hasHyperlinks) reasoning.push("Contains hyperlinks suggesting web content");
        if (stats.avgParagraphLength < 200) reasoning.push("Short paragraphs typical of blog posts");
        break;
      default:
        reasoning.push("No specific structure detected, using general profile");
    }
    
    if (type.confidence < 0.5) {
      reasoning.push("Low confidence - consider manually selecting a profile");
    }
    
    return reasoning;
  }
  
  /**
   * Recommend profile based on detected type
   */
  private recommendProfile(type: DocumentStructureType): string {
    const profileMap: Record<DocumentStructureType, string> = {
      "knowledge-base": "knowledge-base",
      "exam-paper": "exam-paper",
      "business-report": "enterprise",
      "scientific-paper": "scientific-paper",
      "legal-document": "enterprise",
      "web-content": "default",
      "general": "default",
    };
    
    return profileMap[type];
  }
  
  /**
   * Walk AST and apply function to each node
   */
  private walkAST(doc: DocumentNode, fn: (node: BlockNode | ParagraphNode | HeadingNode | any) => void): void {
    for (const section of doc.children) {
      for (const block of section.children) {
        fn(block);
        
        // Walk children
        if (block.children) {
          for (const child of block.children) {
            fn(child);
          }
        }
        
        // Walk table cells
        if (block.type === "table" && (block as any).rows) {
          for (const row of (block as any).rows) {
            for (const cell of row.cells) {
              for (const cellBlock of cell.children) {
                fn(cellBlock);
              }
            }
          }
        }
        
        // Walk list items
        if (block.type === "list" && (block as any).items) {
          for (const item of (block as any).items) {
            for (const itemBlock of item.children) {
              fn(itemBlock);
            }
          }
        }
      }
    }
  }
  
  /**
   * Extract text from paragraph
   */
  private extractText(node: BlockNode): string {
    if ("children" in node && node.children) {
      return node.children
        .filter(c => c.type === "text")
        .map(c => (c as TextNode).text)
        .join("");
    }
    return "";
  }
  
  /**
   * Detect code languages
   */
  private detectCodeLanguages(doc: DocumentNode): string[] {
    const languages: string[] = [];
    this.walkAST(doc, (node) => {
      if (node.type === "codeBlock" && (node as any).language) {
        languages.push((node as any).language);
      }
    });
    return [...new Set(languages)];
  }
  
  /**
   * Count external links
   */
  private countExternalLinks(doc: DocumentNode): number {
    let count = 0;
    this.walkAST(doc, (node) => {
      if (node.type === "hyperlink" && (node as any).href) {
        const href = (node as any).href;
        if (href.startsWith("http://") || href.startsWith("https://")) {
          count++;
        }
      }
    });
    return count;
  }
  
  /**
   * Check if document has multiple heading levels
   */
  private hasMultipleHeadingLevels(depths: number[]): boolean {
    let levelsWithHeadings = 0;
    for (const d of depths) {
      if (d > 0) levelsWithHeadings++;
    }
    return levelsWithHeadings >= 3;
  }
  
  /**
   * Check if paragraphs are short (typical of exams)
   */
  private hasShortParagraphs(avgLength: number): boolean {
    return avgLength > 0 && avgLength < 100;
  }
  
  /**
   * Check for numbered questions (exam detection)
   */
  private containsNumberedQuestions(stats: StructureAnalysis["metadata"]): boolean {
    // This would need raw text access - simplified for now
    return false;
  }
  
  /**
   * Check for academic heading patterns
   */
  private hasAcademicHeadings(depths: number[]): boolean {
    // Academic papers typically have multiple levels used
    const usedLevels = depths.filter(d => d > 0).length;
    return usedLevels >= 2;
  }
  
  /**
   * Check for legal document phrases
   */
  private containsLegalPhrases(stats: StructureAnalysis["metadata"]): boolean {
    // Would need actual text content - placeholder
    return false;
  }
  
  /**
   * Check if text looks like code
   */
  private looksLikeCode(text: string): boolean {
    const codePatterns = [
      /^(function|const|let|var|class|import|export|return|if|for|while)\s/m,
      /[{}\[\]();]/,
      /^\s*(def|class|import|from|if|for|while|return)\s/m,
      /<\/?[a-z]+[^>]*>/i,
    ];
    
    return codePatterns.some(p => p.test(text));
  }
  
  /**
   * Check if text looks like math
   */
  private looksLikeMath(text: string): boolean {
    const mathPatterns = [
      /[∑∏∫∂√∞≈≠≤≥±×÷]/,
      /\^[a-zA-Z0-9]/,
      /_[a-zA-Z0-9]/,
      /\\(frac|sqrt|sum|prod|int|lim)/,
    ];
    
    return mathPatterns.some(p => p.test(text));
  }
}

/**
 * Auto-detect and apply profile
 */
export async function autoDetectAndApply(
  doc: DocumentNode,
  engine: { applyProfile: (profile: string) => Promise<void> }
): Promise<StructureAnalysis> {
  const detector = new StructureDetector();
  const analysis = detector.analyze(doc);
  
  await engine.applyProfile(analysis.recommendedProfile);
  
  return analysis;
}
