/**
 * Semantic Similarity Detection
 * 
 * Detects semantic similarity between documents for deduplication, plagiarism detection, and content clustering.
 */

import type { DocumentNode } from '../ast/types';

/**
 * Similarity result
 */
export interface SimilarityResult {
  /** Document A ID */
  docAId: string;
  /** Document B ID */
  docBId: string;
  /** Similarity score (0-1) */
  score: number;
  /** Similarity type */
  type: 'exact' | 'near' | 'partial' | 'semantic';
  /** Matching sections */
  matches: SimilarityMatch[];
}

/**
 * Similarity match
 */
export interface SimilarityMatch {
  /** Section from document A */
  sectionA: string;
  /** Section from document B */
  sectionB: string;
  /** Start position in A */
  startA: number;
  /** End position in A */
  endA: number;
  /** Start position in B */
  startB: number;
  /** End position in B */
  endB: number;
  /** Match similarity */
  similarity: number;
}

/**
 * Document fingerprint for similarity
 */
export interface DocumentFingerprint {
  docId: string;
  hash: string;
  shingles: string[];
  vector: number[];
  metadata: FingerprintMetadata;
}

/**
 * Fingerprint metadata
 */
export interface FingerprintMetadata {
  wordCount: number;
  generatedAt: number;
  algorithm: string;
}

/**
 * Semantic similarity engine
 */
export class SemanticSimilarityEngine {
  private fingerprints: Map<string, DocumentFingerprint> = new Map();
  private config: SimilarityConfig;

  constructor(config: Partial<SimilarityConfig> = {}) {
    this.config = {
      minSimilarity: 0.8,
      shingleSize: 3,
      useSemantic: true,
      ...config
    };
  }

  /**
   * Generate fingerprint for a document
   */
  generateFingerprint(docId: string, content: string): DocumentFingerprint {
    const words = this.tokenize(content);
    const shingles = this.generateShingles(words, this.config.shingleSize);
    const vector = this.generateVector(words);
    
    return {
      docId,
      hash: this.generateHash(shingles),
      shingles,
      vector,
      metadata: {
        wordCount: words.length,
        generatedAt: Date.now(),
        algorithm: 'simhash'
      }
    };
  }

  /**
   * Store fingerprint
   */
  storeFingerprint(fingerprint: DocumentFingerprint): void {
    this.fingerprints.set(fingerprint.docId, fingerprint);
  }

  /**
   * Compare two documents
   */
  compare(docA: string, docB: string, contentA: string, contentB: string): SimilarityResult {
    const fpA = this.generateFingerprint(docA, contentA);
    const fpB = this.generateFingerprint(docB, contentB);

    // Exact match check
    if (fpA.hash === fpB.hash) {
      return {
        docAId: docA,
        docBId: docB,
        score: 1.0,
        type: 'exact',
        matches: [{
          sectionA: contentA,
          sectionB: contentB,
          startA: 0,
          endA: contentA.length,
          startB: 0,
          endB: contentB.length,
          similarity: 1.0
        }]
      };
    }

    // Shingle-based similarity
    const shingleSimilarity = this.calculateShingleSimilarity(fpA.shingles, fpB.shingles);

    // Semantic similarity if enabled
    let semanticScore = 0;
    if (this.config.useSemantic) {
      semanticScore = this.calculateCosineSimilarity(fpA.vector, fpB.vector);
    }

    // Combine scores
    const score = this.config.useSemantic 
      ? (shingleSimilarity * 0.6 + semanticScore * 0.4)
      : shingleSimilarity;

    const type = this.determineType(score);

    return {
      docAId: docA,
      docBId: docB,
      score,
      type,
      matches: this.findMatches(contentA, contentB, shingleSimilarity)
    };
  }

  /**
   * Find similar documents
   */
  findSimilar(docId: string, content: string, threshold?: number): SimilarityResult[] {
    const thresholdValue = threshold ?? this.config.minSimilarity;
    const fp = this.generateFingerprint(docId, content);
    const results: SimilarityResult[] = [];

    for (const [storedId, storedFp] of this.fingerprints) {
      if (storedId === docId) continue;

      const similarity = this.calculateCosineSimilarity(fp.vector, storedFp.vector);
      
      if (similarity >= thresholdValue) {
        results.push({
          docAId: docId,
          docBId: storedId,
          score: similarity,
          type: this.determineType(similarity),
          matches: []
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Cluster similar documents
   */
  cluster(documents: { id: string; content: string }[], threshold?: number): DocumentCluster[] {
    const clusters: DocumentCluster[] = [];
    const assigned = new Set<string>();
    const thresholdValue = threshold ?? this.config.minSimilarity;

    // Generate fingerprints
    const fps = documents.map(d => ({
      id: d.id,
      fingerprint: this.generateFingerprint(d.id, d.content)
    }));

    // Build similarity matrix
    const matrix = this.buildSimilarityMatrix(fps);

    // Find clusters
    for (let i = 0; i < documents.length; i++) {
      if (assigned.has(documents[i].id)) continue;

      const cluster: DocumentCluster = {
        id: `cluster_${clusters.length}`,
        documents: [documents[i].id],
        representative: documents[i].id,
        avgSimilarity: 1.0
      };

      assigned.add(documents[i].id);

      // Find all similar documents
      for (let j = i + 1; j < documents.length; j++) {
        if (assigned.has(documents[j].id)) continue;
        
        if (matrix[i][j] >= thresholdValue) {
          cluster.documents.push(documents[j].id);
          assigned.add(documents[j].id);
        }
      }

      cluster.avgSimilarity = this.calculateClusterAvgSimilarity(cluster.documents, fps, matrix);
      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Calculate plagiarism score
   */
  detectPlagiarism(sourceDoc: string, content: string, sources: string[]): PlagiarismResult {
    const results: SimilarityResult[] = [];

    for (const source of sources) {
      const comparison = this.compare(sourceDoc, source, content, '');
      if (comparison.score >= 0.5) {
        results.push(comparison);
      }
    }

    const totalMatchLength = results.reduce((sum, r) => 
      sum + r.matches.reduce((s, m) => s + (m.endA - m.startA), 0), 0
    );

    const wordCount = this.tokenize(content).length;
    const plagiarismScore = wordCount > 0 ? totalMatchLength / wordCount : 0;

    return {
      score: Math.min(1, plagiarismScore),
      matches: results,
      sources: results.map(r => r.docBId),
      isPlagiarized: plagiarismScore > 0.2
    };
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  private generateShingles(words: string[], size: number): string[] {
    const shingles: string[] = [];
    for (let i = 0; i <= words.length - size; i++) {
      shingles.push(words.slice(i, i + size).join(' '));
    }
    return shingles;
  }

  private generateHash(shingles: string[]): string {
    // Simplified hash - use proper hash in production
    return String(shingles.reduce((hash, s) => hash + s.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0), 0));
  }

  private generateVector(words: string[]): number[] {
    const unique = [...new Set(words)];
    const vector: number[] = [];
    
    for (const word of unique.slice(0, 100)) {
      vector.push(words.filter(w => w === word).length);
    }
    
    return vector;
  }

  private calculateShingleSimilarity(a: string[], b: string[]): number {
    const setA = new Set(a);
    const setB = new Set(b);
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0) return 0;
    
    const maxLen = Math.max(a.length, b.length);
    const vecA = [...a, ...new Array(maxLen - a.length).fill(0)];
    const vecB = [...b, ...new Array(maxLen - b.length).fill(0)];
    
    const dotProduct = vecA.reduce((sum, v, i) => sum + v * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, v) => sum + v * v, 0));
    const magB = Math.sqrt(vecB.reduce((sum, v) => sum + v * v, 0));
    
    return magA > 0 && magB > 0 ? dotProduct / (magA * magB) : 0;
  }

  private determineType(score: number): SimilarityResult['type'] {
    if (score >= 0.95) return 'exact';
    if (score >= 0.8) return 'near';
    if (score >= 0.5) return 'partial';
    return 'semantic';
  }

  private findMatches(contentA: string, contentB: string, similarity: number): SimilarityMatch[] {
    if (similarity < 0.3) return [];
    
    return [{
      sectionA: contentA.substring(0, Math.min(100, contentA.length)),
      sectionB: contentB.substring(0, Math.min(100, contentB.length)),
      startA: 0,
      endA: Math.min(100, contentA.length),
      startB: 0,
      endB: Math.min(100, contentB.length),
      similarity
    }];
  }

  private buildSimilarityMatrix(fps: { id: string; fingerprint: DocumentFingerprint }[]): number[][] {
    const matrix: number[][] = [];
    
    for (let i = 0; i < fps.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < fps.length; j++) {
        matrix[i][j] = i === j ? 1 : this.calculateCosineSimilarity(fps[i].fingerprint.vector, fps[j].fingerprint.vector);
      }
    }
    
    return matrix;
  }

  private calculateClusterAvgSimilarity(docIds: string[], fps: { id: string; fingerprint: DocumentFingerprint }[], matrix: number[][]): number {
    let total = 0;
    let count = 0;
    
    for (let i = 0; i < docIds.length; i++) {
      for (let j = i + 1; j < docIds.length; j++) {
        const idxI = fps.findIndex(f => f.id === docIds[i]);
        const idxJ = fps.findIndex(f => f.id === docIds[j]);
        if (idxI >= 0 && idxJ >= 0) {
          total += matrix[idxI][idxJ];
          count++;
        }
      }
    }
    
    return count > 0 ? total / count : 0;
  }
}

/**
 * Document cluster
 */
export interface DocumentCluster {
  id: string;
  documents: string[];
  representative: string;
  avgSimilarity: number;
}

/**
 * Plagiarism detection result
 */
export interface PlagiarismResult {
  score: number;
  matches: SimilarityResult[];
  sources: string[];
  isPlagiarized: boolean;
}

interface SimilarityConfig {
  minSimilarity: number;
  shingleSize: number;
  useSemantic: boolean;
}
