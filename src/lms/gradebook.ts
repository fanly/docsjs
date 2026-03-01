/**
 * Grade Book Integration
 * 
 * Integrates with learning management systems for grade synchronization and academic analytics.
 */

import type { ConvertResultData } from '../server/types';

/**
 * Grade entry
 */
export interface GradeEntry {
  id: string;
  studentId: string;
  studentName: string;
  assignmentId: string;
  assignmentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  letterGrade?: string;
  feedback?: string;
  submittedAt: number;
  gradedAt: number;
  status: GradeStatus;
}

/**
 * Grade status
 */
export type GradeStatus = 'pending' | 'submitted' | 'graded' | 'returned';

/**
 * Grade book
 */
export interface GradeBook {
  id: string;
  courseId: string;
  courseName: string;
  term: string;
  entries: GradeEntry[];
  statistics: GradeStatistics;
  metadata: {
    createdAt: number;
    updatedAt: number;
    totalStudents: number;
    totalAssignments: number;
  };
}

/**
 * Grade statistics
 */
export interface GradeStatistics {
  average: number;
  median: number;
  stdDev: number;
  minScore: number;
  maxScore: number;
  distribution: GradeDistribution;
  passRate: number;
  topPerformers: string[];
  atRiskStudents: string[];
}

/**
 * Grade distribution
 */
export interface GradeDistribution {
  a: number;  // 90-100
  b: number;  // 80-89
  c: number;  // 70-79
  d: number;  // 60-69
  f: number;  // 0-59
}

/**
 * Student performance
 */
export interface StudentPerformance {
  studentId: string;
  studentName: string;
  overallGrade: number;
  assignments: StudentAssignment[];
  trend: 'improving' | 'declining' | 'stable';
  predictedFinal: number;
  atRisk: boolean;
  recommendations: string[];
}

/**
 * Student assignment
 */
export interface StudentAssignment {
  assignmentId: string;
  name: string;
  score: number;
  maxScore: number;
  dueDate: number;
  submittedAt?: number;
  gradedAt?: number;
  feedback?: string;
}

/**
 * Academic analytics
 */
export interface AcademicAnalytics {
  courseId: string;
  overview: CourseOverview;
  studentPerformance: StudentPerformance[];
  assignmentAnalysis: AssignmentAnalysis[];
  predictions: GradePrediction[];
  insights: AcademicInsight[];
}

/**
 * Course overview
 */
export interface CourseOverview {
  totalStudents: number;
  totalAssignments: number;
  averageGrade: number;
  completionRate: number;
  engagementScore: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Assignment analysis
 */
export interface AssignmentAnalysis {
  assignmentId: string;
  name: string;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  stdDev: number;
  completionRate: number;
  timeSpent: number;
  difficulty: 'easy' | 'medium' | 'hard';
  discriminationIndex: number;
}

/**
 * Grade prediction
 */
export interface GradePrediction {
  studentId: string;
  predictedGrade: number;
  confidence: number;
  factors: string[];
}

/**
 * Academic insight
 */
export interface AcademicInsight {
  type: 'positive' | 'warning' | 'suggestion';
  title: string;
  description: string;
  affectedStudents?: string[];
  action?: string;
}

/**
 * Grade book manager
 */
export class GradeBookManager {
  private gradeBooks: Map<string, GradeBook> = new Map();
  private config: GradeBookConfig;

  constructor(config: Partial<GradeBookConfig> = {}) {
    this.config = {
      passThreshold: 60,
      gradeScale: 'standard',
      ...config
    };
  }

  /**
   * Create grade book
   */
  createGradeBook(courseId: string, courseName: string, term: string): GradeBook {
    const gradeBook: GradeBook = {
      id: `gb_${Date.now()}`,
      courseId,
      courseName,
      term,
      entries: [],
      statistics: this.calculateStatistics([]),
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        totalStudents: 0,
        totalAssignments: 0
      }
    };

    this.gradeBooks.set(gradeBook.id, gradeBook);
    return gradeBook;
  }

  /**
   * Add grade entry
   */
  addGrade(gradeBookId: string, entry: Omit<GradeEntry, 'id'>): GradeEntry {
    const gradeBook = this.gradeBooks.get(gradeBookId);
    if (!gradeBook) {
      throw new Error(`Grade book not found: ${gradeBookId}`);
    }

    const fullEntry: GradeEntry = {
      ...entry,
      id: `grade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    gradeBook.entries.push(fullEntry);
    gradeBook.statistics = this.calculateStatistics(gradeBook.entries);
    gradeBook.metadata.updatedAt = Date.now();
    gradeBook.metadata.totalStudents = new Set(gradeBook.entries.map(e => e.studentId)).size;

    return fullEntry;
  }

  /**
   * Import grades from document
   */
  async importFromDocument(document: ConvertResultData): Promise<GradeEntry[]> {
    const entries: GradeEntry[] = [];
    const content = document.output || '';
    
    // Parse grade information from document
    const studentPattern = /([A-Z][a-z]+ [A-Z][a-z]+)\s+(\d+(?:\.\d+)?)\s*\/\s*(\d+)/g;
    let match;
    
    while ((match = studentPattern.exec(content)) !== null) {
      const score = parseFloat(match[2]);
      const maxScore = parseFloat(match[3]);
      
      entries.push({
        id: `grade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        studentId: '',
        studentName: match[1],
        assignmentId: 'imported',
        assignmentName: 'Imported Grade',
        score,
        maxScore,
        percentage: (score / maxScore) * 100,
        letterGrade: this.scoreToLetter((score / maxScore) * 100),
        submittedAt: Date.now(),
        gradedAt: Date.now(),
        status: 'graded'
      });
    }

    return entries;
  }

  /**
   * Sync with LMS
   */
  async syncWithLMS(gradeBookId: string, lmsConfig: LMSSyncConfig): Promise<SyncReport> {
    const gradeBook = this.gradeBooks.get(gradeBookId);
    if (!gradeBook) {
      throw new Error(`Grade book not found: ${gradeBookId}`);
    }

    const synced: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];

    for (const entry of gradeBook.entries) {
      try {
        await this.pushToLMS(lmsConfig, entry);
        synced.push(entry.id);
      } catch (error) {
        failed.push(entry.id);
        errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return {
      success: failed.length === 0,
      synced: synced.length,
      failed: failed.length,
      errors
    };
  }

  /**
   * Get student performance
   */
  getStudentPerformance(gradeBookId: string): StudentPerformance[] {
    const gradeBook = this.gradeBooks.get(gradeBookId);
    if (!gradeBook) return [];

    const studentMap = new Map<string, StudentAssignment[]>();
    const studentNames = new Map<string, string>();

    for (const entry of gradeBook.entries) {
      if (!studentMap.has(entry.studentId)) {
        studentMap.set(entry.studentId, []);
        studentNames.set(entry.studentId, entry.studentName);
      }
      studentMap.get(entry.studentId)!.push({
        assignmentId: entry.assignmentId,
        name: entry.assignmentName,
        score: entry.score,
        maxScore: entry.maxScore,
        dueDate: entry.submittedAt,
        submittedAt: entry.submittedAt || undefined,
        gradedAt: entry.gradedAt || undefined,
        feedback: entry.feedback
      });
    }

    const performances: StudentPerformance[] = [];
    
    for (const [studentId, assignments] of studentMap) {
      const scores = assignments.map(a => (a.score / a.maxScore) * 100);
      const overall = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      
      performances.push({
        studentId,
        studentName: studentNames.get(studentId) || '',
        overallGrade: overall,
        assignments,
        trend: this.calculateTrend(scores),
        predictedFinal: this.predictFinalGrade(overall, assignments.length, gradeBook.metadata.totalAssignments),
        atRisk: overall < this.config.passThreshold,
        recommendations: this.generateRecommendations(overall, assignments)
      });
    }

    return performances;
  }

  /**
   * Get academic analytics
   */
  getAcademicAnalytics(gradeBookId: string): AcademicAnalytics {
    const gradeBook = this.gradeBooks.get(gradeBookId);
    if (!gradeBook) {
      throw new Error(`Grade book not found: ${gradeBookId}`);
    }

    const studentPerformance = this.getStudentPerformance(gradeBookId);
    const assignmentAnalysis = this.analyzeAssignments(gradeBook);
    const predictions = this.predictGrades(studentPerformance);
    const insights = this.generateInsights(gradeBook, studentPerformance);

    return {
      courseId: gradeBook.courseId,
      overview: {
        totalStudents: gradeBook.metadata.totalStudents,
        totalAssignments: gradeBook.metadata.totalAssignments,
        averageGrade: gradeBook.statistics.average,
        completionRate: this.calculateCompletionRate(gradeBook.entries),
        engagementScore: this.calculateEngagementScore(gradeBook.entries),
        difficulty: this.estimateDifficulty(gradeBook.statistics)
      },
      studentPerformance,
      assignmentAnalysis,
      predictions,
      insights
    };
  }

  /**
   * Export grade report
   */
  exportReport(gradeBookId: string, format: 'pdf' | 'csv' | 'json'): string {
    const gradeBook = this.gradeBooks.get(gradeBookId);
    if (!gradeBook) {
      throw new Error(`Grade book not found: ${gradeBookId}`);
    }

    switch (format) {
      case 'json':
        return JSON.stringify(gradeBook, null, 2);
      case 'csv':
        return this.toCSV(gradeBook);
      default:
        return JSON.stringify(gradeBook);
    }
  }

  private calculateStatistics(entries: GradeEntry[]): GradeStatistics {
    if (entries.length === 0) {
      return {
        average: 0,
        median: 0,
        stdDev: 0,
        minScore: 0,
        maxScore: 0,
        distribution: { a: 0, b: 0, c: 0, d: 0, f: 0 },
        passRate: 0,
        topPerformers: [],
        atRiskStudents: []
      };
    }

    const scores = entries.map(e => e.percentage).sort((a, b) => a - b);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = sum / scores.length;
    
    const median = scores.length % 2 === 0
      ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
      : scores[Math.floor(scores.length / 2)];

    const variance = scores.reduce((acc, s) => acc + Math.pow(s - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    const distribution: GradeDistribution = { a: 0, b: 0, c: 0, d: 0, f: 0 };
    for (const s of scores) {
      if (s >= 90) distribution.a++;
      else if (s >= 80) distribution.b++;
      else if (s >= 70) distribution.c++;
      else if (s >= 60) distribution.d++;
      else distribution.f++;
    }

    const passRate = (scores.filter(s => s >= 60).length / scores.length) * 100;

    const studentAvg = new Map<string, number>();
    for (const e of entries) {
      const current = studentAvg.get(e.studentId) || 0;
      studentAvg.set(e.studentId, current + e.percentage);
    }

    const studentAverages = Array.from(studentAvg.entries())
      .map(([id, sum]) => ({ id, avg: sum / (entries.filter(e => e.studentId === id).length) }))
      .sort((a, b) => b.avg - a.avg);

    return {
      average: avg,
      median,
      stdDev,
      minScore: scores[0],
      maxScore: scores[scores.length - 1],
      distribution,
      passRate,
      topPerformers: studentAverages.slice(0, 5).map(s => s.id),
      atRiskStudents: studentAverages.filter(s => s.avg < 60).map(s => s.id)
    };
  }

  private scoreToLetter(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private calculateTrend(scores: number[]): 'improving' | 'declining' | 'stable' {
    if (scores.length < 3) return 'stable';
    
    const recent = scores.slice(-3);
    const earlier = scores.slice(0, -3);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.length > 0 
      ? earlier.reduce((a, b) => a + b, 0) / earlier.length 
      : recentAvg;
    
    const diff = recentAvg - earlierAvg;
    
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  private predictFinalGrade(currentAvg: number, completed: number, total: number): number {
    if (completed === 0) return currentAvg;
    const remaining = total - completed;
    if (remaining === 0) return currentAvg;
    
    // Weighted prediction - current grades weighted more
    return (currentAvg * completed + 70 * remaining) / total;
  }

  private generateRecommendations(overall: number, assignments: StudentAssignment[]): string[] {
    const recs: string[] = [];
    
    if (overall < 60) {
      recs.push('Schedule meeting with instructor');
      recs.push('Review fundamental concepts');
    }
    
    const recentScores = assignments.slice(-3).map(a => (a.score / a.maxScore) * 100);
    if (recentScores.length > 0 && recentScores.every(s => s < 70)) {
      recs.push('Seek tutoring support');
    }
    
    if (assignments.some(a => !a.submittedAt)) {
      recs.push('Complete pending assignments');
    }
    
    return recs;
  }

  private analyzeAssignments(gradeBook: GradeBook): AssignmentAnalysis[] {
    const assignmentMap = new Map<string, GradeEntry[]>();
    
    for (const entry of gradeBook.entries) {
      if (!assignmentMap.has(entry.assignmentId)) {
        assignmentMap.set(entry.assignmentId, []);
      }
      assignmentMap.get(entry.assignmentId)!.push(entry);
    }

    const analyses: AssignmentAnalysis[] = [];
    
    for (const [id, entries] of assignmentMap) {
      const scores = entries.map(e => e.percentage);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      analyses.push({
        assignmentId: id,
        name: entries[0].assignmentName,
        averageScore: avg,
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        stdDev: this.calculateStdDev(scores, avg),
        completionRate: (entries.filter(e => e.status === 'graded').length / entries.length) * 100,
        timeSpent: 0,
        difficulty: avg > 80 ? 'easy' : avg > 60 ? 'medium' : 'hard',
        discriminationIndex: 0
      });
    }

    return analyses;
  }

  private predictGrades(performances: StudentPerformance[]): GradePrediction[] {
    return performances.map(p => ({
      studentId: p.studentId,
      predictedGrade: p.predictedFinal,
      confidence: Math.min(0.9, 0.5 + (performances.length / 100) * 0.4),
      factors: ['Previous performance', 'Assignment completion', 'Trend analysis']
    }));
  }

  private generateInsights(gradeBook: GradeBook, performances: StudentPerformance[]): AcademicInsight[] {
    const insights: AcademicInsight[] = [];

    // Overall pass rate
    if (gradeBook.statistics.passRate < 70) {
      insights.push({
        type: 'warning',
        title: 'Low Pass Rate',
        description: `Only ${gradeBook.statistics.passRate.toFixed(1)}% of students are passing.`,
        action: 'Consider reviewing course material difficulty'
      });
    }

    // Top performers
    if (gradeBook.statistics.topPerformers.length > 0) {
      insights.push({
        type: 'positive',
        title: 'High Performers',
        description: `${gradeBook.statistics.topPerformers.length} students are excelling.`,
        affectedStudents: gradeBook.statistics.topPerformers
      });
    }

    // At-risk students
    if (gradeBook.statistics.atRiskStudents.length > 0) {
      insights.push({
        type: 'warning',
        title: 'At-Risk Students',
        description: `${gradeBook.statistics.atRiskStudents.length} students are at risk of failing.`,
        affectedStudents: gradeBook.statistics.atRiskStudents,
        action: 'Schedule intervention meetings'
      });
    }

    return insights;
  }

  private calculateCompletionRate(entries: GradeEntry[]): number {
    const graded = entries.filter(e => e.status === 'graded').length;
    return entries.length > 0 ? (graded / entries.length) * 100 : 0;
  }

  private calculateEngagementScore(entries: GradeEntry[]): number {
    // Simplified engagement metric
    return 75;
  }

  private estimateDifficulty(stats: GradeStatistics): 'easy' | 'medium' | 'hard' {
    if (stats.average > 80) return 'easy';
    if (stats.average > 60) return 'medium';
    return 'hard';
  }

  private calculateStdDev(scores: number[], mean: number): number {
    const variance = scores.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / scores.length;
    return Math.sqrt(variance);
  }

  private toCSV(gradeBook: GradeBook): string {
    const headers = ['Student', 'Assignment', 'Score', 'Max', 'Percentage', 'Grade', 'Status'];
    const rows = gradeBook.entries.map(e => [
      e.studentName,
      e.assignmentName,
      e.score,
      e.maxScore,
      e.percentage.toFixed(2),
      e.letterGrade || '',
      e.status
    ]);
    
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  private async pushToLMS(config: LMSSyncConfig, entry: GradeEntry): Promise<void> {
    // Simulated LMS push
    console.log(`Syncing grade to ${config.lmsType}:`, entry.studentName, entry.score);
  }
}

/**
 * Grade book config
 */
export interface GradeBookConfig {
  passThreshold: number;
  gradeScale: string;
}

/**
 * LMS sync config
 */
export interface LMSSyncConfig {
  lmsType: 'moodle' | 'blackboard' | 'canvas';
  baseUrl: string;
  apiKey: string;
  courseId: string;
}

/**
 * Sync report
 */
export interface SyncReport {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}
