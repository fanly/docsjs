/**
 * Document Diff and Comparison
 * 
 * Provides diffing capabilities between document versions,
 * change tracking visualization, and document comparison reports.
 */

import type { DocumentNode, BlockNode, ParagraphNode, HeadingNode, TextNode } from '../ast/types';

export interface DiffResult {
  /** Whether documents are equal */
  equal: boolean;
  /** Number of additions */
  additions: number;
  /** Number of deletions */
  deletions: number;
  /** Number of modifications */
  modifications: number;
  /** Detailed changes */
  changes: DiffChange[];
  /** Similarity score (0-1) */
  similarity: number;
}

export interface DiffChange {
  /** Change type */
  type: 'add' | 'delete' | 'modify' | 'move';
  /** Path to changed element */
  path: string[];
  /** Old value (for delete/modify) */
  oldValue?: string;
  /** New value (for add/modify) */
  newValue?: string;
  /** Position in document */
  position?: { line: number; column: number };
}

export interface ChangeHighlight {
  /** Type of change */
  type: 'added' | 'removed' | 'modified';
  /** The content */
  content: string;
  /** Start position */
  start: number;
  /** End position */
  end: number;
}

export interface ComparisonReport {
  /** Summary statistics */
  summary: {
    totalChanges: number;
    additions: number;
    deletions: number;
    modifications: number;
    movedBlocks: number;
  };
  /** Detailed changes by category */
  changesByCategory: {
    headings: DiffChange[];
    paragraphs: DiffChange[];
    formatting: DiffChange[];
    content: DiffChange[];
  };
  /** Block-level diff */
  blocks: BlockDiff[];
}

export interface BlockDiff {
  blockId: string;
  blockType: string;
  status: 'unchanged' | 'added' | 'removed' | 'modified';
  oldContent?: string;
  newContent?: string;
  changes: DiffChange[];
}

/**
 * Document differ
 */
export class DocumentDiffer {
  /**
   * Compare two documents
   */
  compare(doc1: DocumentNode, doc2: DocumentNode): DiffResult {
    const changes: DiffChange[] = [];
    let additions = 0;
    let deletions = 0;
    let modifications = 0;
    
    // Compare sections
    const sections1 = doc1.children;
    const sections2 = doc2.children;
    
    const maxSections = Math.max(sections1.length, sections2.length);
    
    for (let i = 0; i < maxSections; i++) {
      const section1 = sections1[i];
      const section2 = sections2[i];
      
      if (!section1 && section2) {
        // Section added
        additions += section2.children.length;
        changes.push({
          type: 'add',
          path: ['section', String(i)],
          newValue: `Section ${i + 1}`,
        });
      } else if (section1 && !section2) {
        // Section deleted
        deletions += section1.children.length;
        changes.push({
          type: 'delete',
          path: ['section', String(i)],
          oldValue: `Section ${i + 1}`,
        });
      } else if (section1 && section2) {
        // Compare blocks within section
        const blockChanges = this.compareBlocks(
          section1.children,
          section2.children,
          ['section', String(i)]
        );
        changes.push(...blockChanges.changes);
        additions += blockChanges.additions;
        deletions += blockChanges.deletions;
        modifications += blockChanges.modifications;
      }
    }
    
    const totalChanges = additions + deletions + modifications;
    const similarity = this.calculateSimilarity(doc1, doc2);
    
    return {
      equal: totalChanges === 0,
      additions,
      deletions,
      modifications,
      changes,
      similarity,
    };
  }
  
  /**
   * Generate comparison report
   */
  generateReport(doc1: DocumentNode, doc2: DocumentNode): ComparisonReport {
    const diff = this.compare(doc1, doc2);
    
    const changesByCategory = {
      headings: diff.changes.filter(c => c.path.includes('heading')),
      paragraphs: diff.changes.filter(c => c.path.includes('paragraph')),
      formatting: diff.changes.filter(c => c.path.includes('formatting')),
      content: diff.changes.filter(c => c.path.includes('content')),
    };
    
    // Generate block-level diff
    const blocks: BlockDiff[] = [];
    
    for (let i = 0; i < doc1.children.length; i++) {
      const section1 = doc1.children[i];
      const section2 = doc2.children[i];
      
      if (!section1 || !section2) continue;
      
      for (let j = 0; j < Math.max(section1.children.length, section2.children.length); j++) {
        const block1 = section1.children[j];
        const block2 = section2.children[j];
        
        if (!block1 && block2) {
          blocks.push({
            blockId: block2.id,
            blockType: block2.type,
            status: 'added',
            newContent: this.extractBlockText(block2),
            changes: [],
          });
        } else if (block1 && !block2) {
          blocks.push({
            blockId: block1.id,
            blockType: block1.type,
            status: 'removed',
            oldContent: this.extractBlockText(block1),
            changes: [],
          });
        } else if (block1 && block2) {
          const blockText1 = this.extractBlockText(block1);
          const blockText2 = this.extractBlockText(block2);
          
          if (blockText1 === blockText2) {
            blocks.push({
              blockId: block1.id,
              blockType: block1.type,
              status: 'unchanged',
              oldContent: blockText1,
              newContent: blockText2,
              changes: [],
            });
          } else {
            blocks.push({
              blockId: block1.id,
              blockType: block1.type,
              status: 'modified',
              oldContent: blockText1,
              newContent: blockText2,
              changes: [],
            });
          }
        }
      }
    }
    
    return {
      summary: {
        totalChanges: diff.additions + diff.deletions + diff.modifications,
        additions: diff.additions,
        deletions: diff.deletions,
        modifications: diff.modifications,
        movedBlocks: diff.changes.filter(c => c.type === 'move').length,
      },
      changesByCategory,
      blocks,
    };
  }
  
  /**
   * Highlight changes in text
   */
  highlightChanges(oldText: string, newText: string): ChangeHighlight[] {
    const highlights: ChangeHighlight[] = [];
    
    // Simple word-level diff
    const words1 = oldText.split(/\s+/);
    const words2 = newText.split(/\s+/);
    
    // Find longest common subsequence
    const lcs = this.longestCommonSubsequence(words1, words2);
    
    let oldIndex = 0;
    let newIndex = 0;
    let position = 0;
    
    for (const word of lcs) {
      // Add removed words
      while (oldIndex < words1.length && words1[oldIndex] !== word) {
        highlights.push({
          type: 'removed',
          content: words1[oldIndex],
          start: position,
          end: position + words1[oldIndex].length,
        });
        position += words1[oldIndex].length + 1;
        oldIndex++;
      }
      
      // Add unchanged word
      if (oldIndex < words1.length && newIndex < words2.length) {
        position += word.length + 1;
        oldIndex++;
        newIndex++;
      }
      
      // Add added words
      while (newIndex < words2.length && words2[newIndex] !== word) {
        highlights.push({
          type: 'added',
          content: words2[newIndex],
          start: position,
          end: position + words2[newIndex].length,
        });
        position += words2[newIndex].length + 1;
        newIndex++;
      }
    }
    
    return highlights;
  }
  
  /**
   * Calculate text similarity (0-1)
   */
  private calculateSimilarity(doc1: DocumentNode, doc2: DocumentNode): number {
    const text1 = this.extractDocumentText(doc1);
    const text2 = this.extractDocumentText(doc2);
    
    if (text1 === text2) return 1;
    if (!text1 || !text2) return 0;
    
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    const lcsLength = this.longestCommonSubsequence(words1, words2).length;
    const maxLength = Math.max(words1.length, words2.length);
    
    return maxLength > 0 ? lcsLength / maxLength : 0;
  }
  
  private compareBlocks(
    blocks1: BlockNode[],
    blocks2: BlockNode[],
    path: string[]
  ): { changes: DiffChange[]; additions: number; deletions: number; modifications: number } {
    const changes: DiffChange[] = [];
    let additions = 0;
    let deletions = 0;
    let modifications = 0;
    
    const maxBlocks = Math.max(blocks1.length, blocks2.length);
    
    for (let i = 0; i < maxBlocks; i++) {
      const block1 = blocks1[i];
      const block2 = blocks2[i];
      
      if (!block1 && block2) {
        additions++;
        changes.push({
          type: 'add',
          path: [...path, 'block', String(i)],
          newValue: block2.type,
        });
      } else if (block1 && !block2) {
        deletions++;
        changes.push({
          type: 'delete',
          path: [...path, 'block', String(i)],
          oldValue: block1.type,
        });
      } else if (block1 && block2 && block1.type !== block2.type) {
        modifications++;
        changes.push({
          type: 'modify',
          path: [...path, 'block', String(i)],
          oldValue: block1.type,
          newValue: block2.type,
        });
      } else if (block1 && block2) {
        const text1 = this.extractBlockText(block1);
        const text2 = this.extractBlockText(block2);
        
        if (text1 !== text2) {
          modifications++;
          changes.push({
            type: 'modify',
            path: [...path, 'block', String(i)],
            oldValue: text1.substring(0, 50),
            newValue: text2.substring(0, 50),
          });
        }
      }
    }
    
    return { changes, additions, deletions, modifications };
  }
  
  private extractDocumentText(doc: DocumentNode): string {
    return doc.children
      .map(section => section.children.map(block => this.extractBlockText(block)).join(' '))
      .join(' ');
  }
  
  private extractBlockText(block: BlockNode): string {
    if ('children' in block && block.children) {
      return block.children
        .filter(c => c.type === 'text')
        .map(c => (c as TextNode).text)
        .join(' ');
    }
    return '';
  }
  
  private longestCommonSubsequence(arr1: string[], arr2: string[]): string[] {
    const m = arr1.length;
    const n = arr2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    const result: string[] = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (arr1[i - 1] === arr2[j - 1]) {
        result.unshift(arr1[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
    
    return result;
  }
}

/**
 * Quick diff function
 */
export function diffDocuments(doc1: DocumentNode, doc2: DocumentNode): DiffResult {
  const differ = new DocumentDiffer();
  return differ.compare(doc1, doc2);
}

/**
 * Generate comparison report
 */
export function compareDocuments(doc1: DocumentNode, doc2: DocumentNode): ComparisonReport {
  const differ = new DocumentDiffer();
  return differ.generateReport(doc1, doc2);
}
