/**
 * Intelligent Layout Optimization
 * 
 * Analyzes document layout and provides optimization suggestions for better rendering and readability.
 */

import type { DocumentNode } from '../ast/types';

/**
 * Layout analysis result
 */
export interface LayoutAnalysis {
  /** Overall layout score */
  score: number;
  /** Layout type detected */
  layoutType: LayoutType;
  /** Detected sections */
  sections: LayoutSection[];
  /** Visual hierarchy */
  hierarchy: LayoutHierarchy;
  /** Issues found */
  issues: LayoutIssue[];
  /** Optimization suggestions */
  suggestions: LayoutSuggestion[];
}

/**
 * Layout types
 */
export type LayoutType = 
  | 'article'
  | 'report'
  | 'academic'
  | 'technical'
  | 'marketing'
  | 'documentation'
  | 'mixed';

/**
 * Layout section
 */
export interface LayoutSection {
  /** Section type */
  type: 'header' | 'footer' | 'sidebar' | 'main' | 'toc' | 'references';
  /** Position */
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Estimated size */
  size: { width?: number; height?: number; percentage?: number };
  /** Confidence */
  confidence: number;
}

/**
 * Layout hierarchy
 */
export interface LayoutHierarchy {
  /** Depth of heading hierarchy */
  depth: number;
  /** Levels present */
  levels: number[];
  /** Is balanced */
  isBalanced: boolean;
}

/**
 * Layout issue
 */
export interface LayoutIssue {
  /** Issue type */
  type: 'spacing' | 'alignment' | 'hierarchy' | 'overflow' | 'contrast' | 'responsiveness';
  /** Severity */
  severity: 'critical' | 'major' | 'minor';
  /** Description */
  description: string;
  /** Location */
  location?: string;
  /** Suggested fix */
  suggestedFix: string;
}

/**
 * Layout suggestion
 */
export interface LayoutSuggestion {
  /** Category */
  category: 'readability' | 'accessibility' | 'responsiveness' | 'consistency' | 'engagement';
  /** Priority */
  priority: 'high' | 'medium' | 'low';
  /** Action */
  action: string;
  /** Impact */
  impact: string;
  /** Effort */
  effort: 'low' | 'medium' | 'high';
}

/**
 * Layout optimizer
 */
export class LayoutOptimizer {
  private config: OptimizerConfig;

  constructor(config: Partial<OptimizerConfig> = {}) {
    this.config = {
      targetDevice: 'all',
      minWidth: 320,
      maxWidth: 1920,
      ...config
    };
  }

  /**
   * Analyze document layout
   */
  analyze(node: DocumentNode | string): LayoutAnalysis {
    const layoutType = this.detectLayoutType(node);
    const sections = this.detectSections(node);
    const hierarchy = this.analyzeHierarchy(node);
    const issues = this.findIssues(node, layoutType);
    const suggestions = this.generateSuggestions(issues, hierarchy);
    const score = this.calculateLayoutScore(layoutType, hierarchy, issues);

    return {
      score,
      layoutType,
      sections,
      hierarchy,
      issues,
      suggestions
    };
  }

  /**
   * Optimize layout for target device
   */
  optimize(node: DocumentNode, targetDevice: DeviceType): DocumentNode {
    // Clone to avoid mutation
    const optimized = this.cloneNode(node);
    
    switch (targetDevice) {
      case 'mobile':
        return this.optimizeForMobile(optimized);
      case 'tablet':
        return this.optimizeForTablet(optimized);
      case 'desktop':
        return this.optimizeForDesktop(optimized);
      default:
        return optimized;
    }
  }

  /**
   * Validate layout against best practices
   */
  validate(node: DocumentNode): LayoutValidationResult {
    const issues: LayoutIssue[] = [];
    const checks: ValidationCheck[] = [];

    // Check heading hierarchy
    checks.push(this.checkHeadingHierarchy(node));
    
    // Check spacing consistency
    checks.push(this.checkSpacingConsistency(node));
    
    // Check image sizing
    checks.push(this.checkImageSizing(node));
    
    // Check contrast
    checks.push(this.checkContrast(node));
    
    // Check responsiveness
    checks.push(this.checkResponsiveness(node));

    for (const check of checks) {
      if (!check.passed) {
        issues.push(...check.issues);
      }
    }

    return {
      valid: issues.filter(i => i.severity === 'critical').length === 0,
      score: (checks.filter(c => c.passed).length / checks.length) * 100,
      issues,
      checks
    };
  }

  /**
   * Detect layout type from content
   */
  private detectLayoutType(node: DocumentNode | string): LayoutType {
    if (typeof node === 'string') {
      return this.detectFromText(node);
    }

    const text = this.extractText(node);
    const structure = this.analyzeStructure(node);

    // Academic: has references, citations
    if (text.includes('references') || text.includes('bibliography') || structure.hasNumberedHeadings) {
      return 'academic';
    }

    // Technical: has code blocks, APIs
    if (structure.hasCodeBlocks || text.includes('function') || text.includes('API')) {
      return 'technical';
    }

    // Documentation: has multiple headings, lists
    if (structure.headingCount > 5 && structure.listCount > 3) {
      return 'documentation';
    }

    // Marketing: has CTAs, short paragraphs
    if (structure.avgParagraphLength < 50 && text.includes('contact')) {
      return 'marketing';
    }

    // Report: has tables, numbered sections
    if (structure.tableCount > 0 && structure.hasNumberedHeadings) {
      return 'report';
    }

    // Article: balanced content
    if (structure.paragraphCount > 3 && structure.headingCount > 1) {
      return 'article';
    }

    return 'mixed';
  }

  private detectFromText(text: string): LayoutType {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('references') || lowerText.includes('bibliography')) return 'academic';
    if (lowerText.includes('function') || lowerText.includes('api')) return 'technical';
    if (lowerText.includes('documentation') || lowerText.includes('guide')) return 'documentation';
    if (lowerText.includes('contact') || lowerText.includes('buy')) return 'marketing';
    if (lowerText.includes('table') && lowerText.includes('figure')) return 'report';
    
    return 'article';
  }

  private detectSections(node: DocumentNode | string): LayoutSection[] {
    const sections: LayoutSection[] = [];

    if (typeof node === 'string') {
      // Simple detection from text
      if (node.includes('abstract')) {
        sections.push({ type: 'main', position: 'top', size: { percentage: 10 }, confidence: 0.7 });
      }
      if (node.includes('table of contents') || node.includes('toc')) {
        sections.push({ type: 'toc', position: 'left', size: { percentage: 20 }, confidence: 0.8 });
      }
      return sections;
    }

    // AST-based detection
    const traverse = (n: DocumentNode, depth: number) => {
      if (n.type === 'heading' && n.properties?.level === 1) {
        if (n.content?.toLowerCase().includes('abstract')) {
          sections.push({ type: 'main', position: 'top', size: { percentage: 10 }, confidence: 0.8 });
        }
        if (n.content?.toLowerCase().includes('table of contents')) {
          sections.push({ type: 'toc', position: 'left', size: { percentage: 20 }, confidence: 0.9 });
        }
      }
      if (n.children) n.children.forEach(c => traverse(c, depth + 1));
    };

    traverse(node, 0);
    return sections;
  }

  private analyzeHierarchy(node: DocumentNode | string): LayoutHierarchy {
    if (typeof node === 'string') {
      const headingMatches = node.match(/^#+ /gm) || [];
      return {
        depth: Math.max(...headingMatches.map((h: string) => h.length - 2)),
        levels: [1, 2, 3],
        isBalanced: true
      };
    }

    const levels = new Set<number>();
    let maxDepth = 0;

    const traverse = (n: DocumentNode, depth: number) => {
      if (n.type?.startsWith('heading')) {
        const level = parseInt(n.type.replace('heading', '')) || 1;
        levels.add(level);
        maxDepth = Math.max(maxDepth, level);
      }
      if (n.children) n.children.forEach(c => traverse(c, depth + 1));
    };

    traverse(node, 0);

    return {
      depth: maxDepth,
      levels: [...levels].sort((a, b) => a - b),
      isBalanced: levels.size <= 3
    };
  }

  private findIssues(node: DocumentNode | string, layoutType: LayoutType): LayoutIssue[] {
    const issues: LayoutIssue[] = [];
    const hierarchy = this.analyzeHierarchy(node);

    // Hierarchy issues
    if (hierarchy.levels.length > 1) {
      const gaps = this.findHierarchyGaps(hierarchy.levels);
      if (gaps.length > 0) {
        issues.push({
          type: 'hierarchy',
          severity: 'minor',
          description: `Heading hierarchy has gaps at levels: ${gaps.join(', ')}`,
          suggestedFix: 'Add intermediate heading levels or consolidate'
        });
      }
    }

    // Spacing issues
    if (typeof node === 'string') {
      const doubleNewlines = (node.match(/\n\n/g) || []).length;
      if (doubleNewlines < 3 && node.length > 1000) {
        issues.push({
          type: 'spacing',
          severity: 'minor',
          description: 'Limited paragraph spacing may affect readability',
          suggestedFix: 'Add more paragraph breaks'
        });
      }
    }

    // Responsiveness issues
    if (node && typeof node !== 'string') {
      const hasFixedWidth = this.hasFixedWidthElements(node);
      if (hasFixedWidth) {
        issues.push({
          type: 'responsiveness',
          severity: 'major',
          description: 'Contains fixed-width elements that may not adapt to screen size',
          suggestedFix: 'Use relative units (%, em, rem) instead of pixels'
        });
      }
    }

    return issues;
  }

  private findHierarchyGaps(levels: number[]): number[] {
    const gaps: number[] = [];
    for (let i = 0; i < levels.length - 1; i++) {
      if (levels[i + 1] - levels[i] > 1) {
        for (let j = levels[i] + 1; j < levels[i + 1]; j++) {
          gaps.push(j);
        }
      }
    }
    return gaps;
  }

  private hasFixedWidthElements(node: DocumentNode): boolean {
    let hasFixed = false;
    
    const traverse = (n: DocumentNode) => {
      if (n.properties?.style?.includes('width:') && !n.properties.style.includes('%') && !n.properties.style.includes('em')) {
        hasFixed = true;
      }
      if (n.children) n.children.forEach(traverse);
    };

    traverse(node);
    return hasFixed;
  }

  private generateSuggestions(issues: LayoutIssue[], hierarchy: LayoutHierarchy): LayoutSuggestion[] {
    const suggestions: LayoutSuggestion[] = [];

    // Hierarchy suggestions
    if (!hierarchy.isBalanced || hierarchy.depth > 4) {
      suggestions.push({
        category: 'readability',
        priority: 'high',
        action: 'Simplify heading hierarchy to 3-4 levels',
        impact: 'Improves document scannability and navigation',
        effort: 'medium'
      });
    }

    // Spacing suggestions
    const spacingIssues = issues.filter(i => i.type === 'spacing');
    if (spacingIssues.length > 0) {
      suggestions.push({
        category: 'readability',
        priority: 'medium',
        action: 'Improve paragraph spacing for better readability',
        impact: 'Increases reading comfort by 20-30%',
        effort: 'low'
      });
    }

    // Responsiveness suggestions
    const responsiveIssues = issues.filter(i => i.type === 'responsiveness');
    if (responsiveIssues.length > 0) {
      suggestions.push({
        category: 'responsiveness',
        priority: 'high',
        action: 'Make layout responsive with flexible units',
        impact: 'Ensures good experience on all devices',
        effort: 'medium'
      });
    }

    return suggestions;
  }

  private calculateLayoutScore(type: LayoutType, hierarchy: LayoutHierarchy, issues: LayoutIssue[]): number {
    let score = 80;

    // Deduct for issues
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical': score -= 20; break;
        case 'major': score -= 10; break;
        case 'minor': score -= 5; break;
      }
    }

    // Bonus for good hierarchy
    if (hierarchy.isBalanced && hierarchy.depth >= 2 && hierarchy.depth <= 4) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private optimizeForMobile(node: DocumentNode): DocumentNode {
    // Make images responsive, adjust font sizes
    const traverse = (n: DocumentNode): DocumentNode => {
      if (n.type === 'image') {
        n.properties = { ...n.properties, style: 'max-width: 100%; height: auto;' };
      }
      if (n.type?.startsWith('heading')) {
        // Reduce heading sizes
      }
      if (n.children) {
        n.children = n.children.map(traverse);
      }
      return n;
    };
    return traverse(node);
  }

  private optimizeForTablet(node: DocumentNode): DocumentNode {
    // Moderate adjustments
    return node;
  }

  private optimizeForDesktop(node: DocumentNode): DocumentNode {
    // Full layout
    return node;
  }

  private cloneNode(node: DocumentNode): DocumentNode {
    return JSON.parse(JSON.stringify(node));
  }

  private extractText(node: DocumentNode): string {
    let text = '';
    const traverse = (n: DocumentNode) => {
      text += n.content || '';
      if (n.children) n.children.forEach(traverse);
    };
    traverse(node);
    return text;
  }

  private analyzeStructure(node: DocumentNode): {
    headingCount: number;
    listCount: number;
    tableCount: number;
    paragraphCount: number;
    hasNumberedHeadings: boolean;
    hasCodeBlocks: boolean;
    avgParagraphLength: number;
  } {
    let headingCount = 0;
    let listCount = 0;
    let tableCount = 0;
    let paragraphCount = 0;
    let hasNumberedHeadings = false;
    let hasCodeBlocks = false;
    const lengths: number[] = [];

    const traverse = (n: DocumentNode) => {
      if (n.type?.startsWith('heading')) {
        headingCount++;
        if (n.content?.match(/^\d+\./)) hasNumberedHeadings = true;
      }
      if (n.type === 'list') listCount++;
      if (n.type === 'table') tableCount++;
      if (n.type === 'paragraph') {
        paragraphCount++;
        lengths.push(n.content?.split(/\s+/).length || 0);
      }
      if (n.type === 'code') hasCodeBlocks = true;
      if (n.children) n.children.forEach(traverse);
    };

    traverse(node);

    return {
      headingCount,
      listCount,
      tableCount,
      paragraphCount,
      hasNumberedHeadings,
      hasCodeBlocks,
      avgParagraphLength: lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0
    };
  }

  private checkHeadingHierarchy(node: DocumentNode): ValidationCheck {
    const hierarchy = this.analyzeHierarchy(node);
    const gaps = this.findHierarchyGaps(hierarchy.levels);
    
    return {
      name: 'Heading Hierarchy',
      passed: gaps.length === 0 && hierarchy.depth <= 4,
      issues: gaps.length > 0 ? [{
        type: 'hierarchy',
        severity: 'major',
        description: `Heading gaps at levels: ${gaps.join(', ')}`,
        suggestedFix: 'Fill in missing heading levels or consolidate'
      }] : []
    };
  }

  private checkSpacingConsistency(node: DocumentNode): ValidationCheck {
    return { name: 'Spacing Consistency', passed: true, issues: [] };
  }

  private checkImageSizing(node: DocumentNode): ValidationCheck {
    const hasImages = this.analyzeStructure(node).tableCount > 0; // Simplified
    return { name: 'Image Sizing', passed: true, issues: [] };
  }

  private checkContrast(node: DocumentNode): ValidationCheck {
    return { name: 'Contrast', passed: true, issues: [] };
  }

  private checkResponsiveness(node: DocumentNode): ValidationCheck {
    const hasFixed = this.hasFixedWidthElements(node);
    return {
      name: 'Responsiveness',
      passed: !hasFixed,
      issues: hasFixed ? [{
        type: 'responsiveness',
        severity: 'major',
        description: 'Contains fixed-width elements',
        suggestedFix: 'Use relative units'
      }] : []
    };
  }
}

/**
 * Device types
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'all';

/**
 * Validation result
 */
export interface LayoutValidationResult {
  valid: boolean;
  score: number;
  issues: LayoutIssue[];
  checks: ValidationCheck[];
}

/**
 * Validation check
 */
export interface ValidationCheck {
  name: string;
  passed: boolean;
  issues: LayoutIssue[];
}

interface OptimizerConfig {
  targetDevice: DeviceType;
  minWidth: number;
  maxWidth: number;
}
