/**
 * Quality Score Prediction
 * 
 * Predicts document quality scores based on characteristics for intelligent processing.
 */

import type { DocumentNode } from '../ast/types';

/**
 * Quality score result
 */
export interface QualityScore {
  /** Overall score (0-100) */
  overall: number;
  /** Component scores */
  components: QualityComponents;
  /** Predicted issues */
  predictedIssues: PredictedIssue[];
  /** Recommendations */
  recommendations: QualityRecommendation[];
  /** Confidence */
  confidence: number;
  /** Model version */
  modelVersion: string;
}

/**
 * Quality component scores
 */
export interface QualityComponents {
  /** Structural quality */
  structure: number;
  /** Formatting quality */
  formatting: number;
  /** Content quality */
  content: number;
  /** Accessibility quality */
  accessibility: number;
  /** Consistency quality */
  consistency: number;
}

/**
 * Predicted issue
 */
export interface PredictedIssue {
  /** Issue type */
  type: 'fidelity' | 'accessibility' | 'compatibility' | 'performance' | 'usability';
  /** Severity */
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
  /** Description */
  description: string;
  /** Location */
  location?: string;
  /** Likelihood */
  likelihood: number;
}

/**
 * Quality recommendation
 */
export interface QualityRecommendation {
  /** Action to take */
  action: string;
  /** Priority */
  priority: 'high' | 'medium' | 'low';
  /** Expected improvement */
  expectedImprovement: number;
  /** Effort */
  effort: 'low' | 'medium' | 'high';
}

/**
 * Document characteristics
 */
export interface DocumentCharacteristics {
  wordCount: number;
  paragraphCount: number;
  imageCount: number;
  tableCount: number;
  headingCount: number;
  listCount: number;
  linkCount: number;
  avgParagraphLength: number;
  hasMetadata: boolean;
  hasTOC: boolean;
  language: string;
  encoding: string;
  pageCount?: number;
}

/**
 * Quality prediction model
 */
export class QualityPredictionModel {
  private modelWeights: ModelWeights;
  private trained: boolean = false;

  constructor() {
    this.modelWeights = this.getDefaultWeights();
  }

  /**
   * Analyze document and predict quality
   */
  predict(node: DocumentNode | string): QualityScore {
    const characteristics = this.extractCharacteristics(node);
    const components = this.calculateComponents(characteristics);
    const issues = this.predictIssues(characteristics, components);
    const recommendations = this.generateRecommendations(issues, components);
    const overall = this.calculateOverallScore(components);

    return {
      overall,
      components,
      predictedIssues: issues,
      recommendations,
      confidence: this.calculateConfidence(characteristics),
      modelVersion: '1.0.0'
    };
  }

  /**
   * Batch predict quality for multiple documents
   */
  batchPredict(documents: (DocumentNode | string)[]): QualityScore[] {
    return documents.map(doc => this.predict(doc));
  }

  /**
   * Get quality trend over time
   */
  getQualityTrend(scores: QualityScore[]): QualityTrend {
    if (scores.length < 2) {
      return { direction: 'stable', change: 0, trend: [] };
    }

    const changes: number[] = [];
    for (let i = 1; i < scores.length; i++) {
      changes.push(scores[i].overall - scores[i - 1].overall);
    }

    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    
    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    if (avgChange > 2) direction = 'improving';
    else if (avgChange < -2) direction = 'declining';

    return {
      direction,
      change: avgChange,
      trend: scores.map(s => s.overall)
    };
  }

  /**
   * Train model with labeled data
   */
  train(trainingData: TrainingData[]): void {
    // Simplified training - adjust weights based on data
    for (const data of trainingData) {
      const predicted = this.predict(data.document);
      const error = data.quality - predicted.overall;
      
      // Adjust weights (simplified gradient descent)
      this.modelWeights.structure += error * 0.01;
      this.modelWeights.formatting += error * 0.01;
      this.modelWeights.content += error * 0.01;
      this.modelWeights.accessibility += error * 0.01;
      this.modelWeights.consistency += error * 0.01;
    }

    this.trained = true;
  }

  private extractCharacteristics(node: DocumentNode | string): DocumentCharacteristics {
    if (typeof node === 'string') {
      return this.analyzeText(node);
    }

    return this.analyzeAST(node);
  }

  private analyzeText(text: string): DocumentCharacteristics {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    return {
      wordCount: words.length,
      paragraphCount: paragraphs.length,
      imageCount: (text.match(/<img/gi) || []).length,
      tableCount: (text.match(/<table/gi) || []).length,
      headingCount: (text.match(/<h[1-6]/gi) || []).length,
      listCount: (text.match(/<(ul|ol)/gi) || []).length,
      linkCount: (text.match(/<a\s/gi) || []).length,
      avgParagraphLength: paragraphs.length > 0 
        ? words.length / paragraphs.length 
        : 0,
      hasMetadata: text.includes('meta') || text.includes('title'),
      hasTOC: text.includes('toc') || text.includes('table of contents'),
      language: 'en',
      encoding: 'utf-8'
    };
  }

  private analyzeAST(node: DocumentNode): DocumentCharacteristics {
    let wordCount = 0;
    let paragraphCount = 0;
    let imageCount = 0;
    let tableCount = 0;
    let headingCount = 0;
    let listCount = 0;
    let linkCount = 0;

    const traverse = (n: DocumentNode) => {
      if (n.type === 'text') {
        wordCount += n.content?.split(/\s+/).filter(w => w.length > 0).length || 0;
      }
      if (n.type === 'paragraph') paragraphCount++;
      if (n.type === 'image') imageCount++;
      if (n.type === 'table') tableCount++;
      if (n.type?.startsWith('heading')) headingCount++;
      if (n.type === 'list') listCount++;
      if (n.type === 'link') linkCount++;
      
      if (n.children) {
        n.children.forEach(traverse);
      }
    };

    traverse(node);

    return {
      wordCount,
      paragraphCount,
      imageCount,
      tableCount,
      headingCount,
      listCount,
      linkCount,
      avgParagraphLength: paragraphCount > 0 ? wordCount / paragraphCount : 0,
      hasMetadata: !!node.properties?.title || !!node.properties?.author,
      hasTOC: false, // Would need to detect ToC
      language: 'en',
      encoding: 'utf-8'
    };
  }

  private calculateComponents(chars: DocumentCharacteristics): QualityComponents {
    const structure = this.calculateStructureScore(chars);
    const formatting = this.calculateFormattingScore(chars);
    const content = this.calculateContentScore(chars);
    const accessibility = this.calculateAccessibilityScore(chars);
    const consistency = this.calculateConsistencyScore(chars);

    return { structure, formatting, content, accessibility, consistency };
  }

  private calculateStructureScore(chars: DocumentCharacteristics): number {
    let score = 50;

    // Headings
    if (chars.headingCount > 0) score += 15;
    if (chars.headingCount > 3) score += 10;

    // Paragraphs
    if (chars.paragraphCount > 5) score += 10;
    if (chars.avgParagraphLength > 30 && chars.avgParagraphLength < 150) score += 10;

    // TOC
    if (chars.hasTOC) score += 5;

    return Math.min(100, score);
  }

  private calculateFormattingScore(chars: DocumentCharacteristics): number {
    let score = 60;

    // Images
    if (chars.imageCount > 0) score += 10;
    if (chars.imageCount > 3) score += 10;

    // Tables
    if (chars.tableCount > 0) score += 10;

    // Lists
    if (chars.listCount > 0) score += 10;

    return Math.min(100, score);
  }

  private calculateContentScore(chars: DocumentCharacteristics): number {
    let score = 50;

    // Word count
    if (chars.wordCount > 100) score += 10;
    if (chars.wordCount > 500) score += 10;
    if (chars.wordCount > 1000) score += 10;

    // Links
    if (chars.linkCount > 0) score += 10;

    // Metadata
    if (chars.hasMetadata) score += 10;

    return Math.min(100, score);
  }

  private calculateAccessibilityScore(chars: DocumentCharacteristics): number {
    let score = 50;

    // Alt text would be checked in AST
    // Language declaration
    if (chars.language) score += 20;

    // Structure helps accessibility
    if (chars.headingCount > 0) score += 15;
    if (chars.listCount > 0) score += 15;

    return Math.min(100, score);
  }

  private calculateConsistencyScore(chars: DocumentCharacteristics): number {
    // Simplified - would analyze actual formatting consistency
    let score = 70;

    if (chars.paragraphCount > 10) score += 10;
    if (chars.avgParagraphLength > 20 && chars.avgParagraphLength < 200) score += 10;

    return Math.min(100, score);
  }

  private predictIssues(chars: DocumentCharacteristics, components: QualityComponents): PredictedIssue[] {
    const issues: PredictedIssue[] = [];

    // Structure issues
    if (components.structure < 50 && chars.headingCount === 0) {
      issues.push({
        type: 'fidelity',
        severity: 'major',
        description: 'Document lacks headings - may affect navigation and SEO',
        likelihood: 0.8
      });
    }

    // Formatting issues
    if (chars.imageCount > 0 && chars.imageCount < 3) {
      issues.push({
        type: 'compatibility',
        severity: 'minor',
        description: 'Limited images may affect visual engagement',
        likelihood: 0.5
      });
    }

    // Accessibility issues
    if (!chars.hasMetadata || !chars.language) {
      issues.push({
        type: 'accessibility',
        severity: 'major',
        description: 'Missing language declaration affects accessibility',
        likelihood: 0.7
      });
    }

    // Content issues
    if (chars.wordCount < 100) {
      issues.push({
        type: 'usability',
        severity: 'minor',
        description: 'Very short document may lack sufficient content',
        likelihood: 0.6
      });
    }

    // Performance issues
    if (chars.imageCount > 20) {
      issues.push({
        type: 'performance',
        severity: 'major',
        description: 'Many images may slow down rendering',
        likelihood: 0.8
      });
    }

    return issues;
  }

  private generateRecommendations(issues: PredictedIssue[], components: QualityComponents): QualityRecommendation[] {
    const recs: QualityRecommendation[] = [];

    if (components.structure < 60) {
      recs.push({
        action: 'Add headings to improve document structure',
        priority: 'high',
        expectedImprovement: 20,
        effort: 'low'
      });
    }

    if (components.accessibility < 60) {
      recs.push({
        action: 'Add language attribute and alt text for accessibility',
        priority: 'high',
        expectedImprovement: 15,
        effort: 'low'
      });
    }

    if (components.content < 60) {
      recs.push({
        action: 'Enhance content with links and metadata',
        priority: 'medium',
        expectedImprovement: 15,
        effort: 'medium'
      });
    }

    const majorIssues = issues.filter(i => i.severity === 'major');
    if (majorIssues.length > 0) {
      recs.push({
        action: 'Address major quality issues',
        priority: 'high',
        expectedImprovement: 25,
        effort: 'medium'
      });
    }

    return recs;
  }

  private calculateOverallScore(components: QualityComponents): number {
    return Math.round(
      components.structure * this.modelWeights.structure +
      components.formatting * this.modelWeights.formatting +
      components.content * this.modelWeights.content +
      components.accessibility * this.modelWeights.accessibility +
      components.consistency * this.modelWeights.consistency
    );
  }

  private calculateConfidence(chars: DocumentCharacteristics): number {
    let confidence = 0.5;

    if (chars.wordCount > 500) confidence += 0.2;
    if (chars.paragraphCount > 10) confidence += 0.15;
    if (chars.headingCount > 0) confidence += 0.15;

    return Math.min(0.95, confidence);
  }

  private getDefaultWeights(): ModelWeights {
    return {
      structure: 0.25,
      formatting: 0.15,
      content: 0.25,
      accessibility: 0.2,
      consistency: 0.15
    };
  }
}

/**
 * Quality trend
 */
export interface QualityTrend {
  direction: 'improving' | 'declining' | 'stable';
  change: number;
  trend: number[];
}

/**
 * Training data
 */
export interface TrainingData {
  document: DocumentNode | string;
  quality: number;
}

interface ModelWeights {
  structure: number;
  formatting: number;
  content: number;
  accessibility: number;
  consistency: number;
}
