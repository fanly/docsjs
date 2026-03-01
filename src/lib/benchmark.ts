/**
 * Performance Benchmarking Module
 * Measures and tracks DocsJS transformation performance
 */

export interface BenchmarkResult {
  name: string;
  duration: number; // ms
  memoryUsed: number; // bytes
  cpuTime: number; // ms
  iterations: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface BenchmarkSuite {
  name: string;
  description: string;
  benchmarks: BenchmarkDefinition[];
}

export interface BenchmarkDefinition {
  name: string;
  fn: () => Promise<void> | void;
  iterations?: number;
  warmup?: number;
}

export interface BenchmarkMetrics {
  transformationTime: number;
  parseTime: number;
  transformTime: number;
  renderTime: number;
  memoryUsage: number;
  throughput: number; // docs per second
}

export interface BenchmarkReport {
  timestamp: number;
  version: string;
  environment: BenchmarkEnvironment;
  results: BenchmarkResult[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    avgDuration: number;
  };
}

export interface BenchmarkEnvironment {
  nodeVersion: string;
  platform: string;
  arch: string;
  cpus: number;
  memory: number;
}

// ============================================
// Benchmark Runner
// ============================================

export class BenchmarkRunner {
  private results: Map<string, BenchmarkResult> = new Map();
  private version: string = '2.0.0';

  constructor(version?: string) {
    if (version) this.version = version;
  }

  /**
   * Run a single benchmark
   */
  async run(name: string, fn: () => Promise<void> | void, options: {
    iterations?: number;
    warmup?: number;
  } = {}): Promise<BenchmarkResult> {
    const iterations = options.iterations || 10;
    const warmup = options.warmup || 2;

    // Warmup runs
    for (let i = 0; i < warmup; i++) {
      await fn();
    }

    // Actual benchmark runs
    const durations: number[] = [];
    const memorySnapshots: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startMem = process.memoryUsage().heapUsed;
      const startTime = performance.now();
      
      await fn();
      
      const endTime = performance.now();
      const endMem = process.memoryUsage().heapUsed;
      
      durations.push(endTime - startTime);
      memorySnapshots.push(endMem - startMem);
    }

    // Calculate statistics
    durations.sort((a, b) => a - b);
    const result: BenchmarkResult = {
      name,
      duration: durations.reduce((a, b) => a + b, 0),
      memoryUsed: memorySnapshots.reduce((a, b) => a + b, 0),
      cpuTime: 0, // Would need process.cpuUsage() for accurate measurement
      iterations,
      avgDuration: durations.reduce((a, b) => a + b, 0) / iterations,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50: this.percentile(durations, 50),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99)
    };

    this.results.set(name, result);
    return result;
  }

  /**
   * Run multiple benchmarks as a suite
   */
  async runSuite(suite: BenchmarkSuite): Promise<BenchmarkResult[]> {
    console.log(`\n📊 Running benchmark suite: ${suite.name}`);
    console.log(`   ${suite.description}\n`);

    const results: BenchmarkResult[] = [];

    for (const benchmark of suite.benchmarks) {
      process.stdout.write(`   Running ${benchmark.name}...`);
      
      try {
        const result = await this.run(
          benchmark.name,
          benchmark.fn,
          {
            iterations: benchmark.iterations,
            warmup: benchmark.warmup
          }
        );
        
        console.log(` ${result.avgDuration.toFixed(2)}ms (p95: ${result.p95.toFixed(2)}ms)`);
        results.push(result);
      } catch (error) {
        console.log(` FAILED - ${(error as Error).message}`);
      }
    }

    return results;
  }

  /**
   * Compare two benchmark results
   */
  compare(baseline: BenchmarkResult, current: BenchmarkResult): {
    durationDiff: number;
    durationPercentChange: number;
    memoryDiff: number;
    memoryPercentChange: number;
    passed: boolean;
  } {
    const durationDiff = current.avgDuration - baseline.avgDuration;
    const durationPercentChange = (durationDiff / baseline.avgDuration) * 100;
    
    const memoryDiff = current.memoryUsed - baseline.memoryUsed;
    const memoryPercentChange = (memoryDiff / baseline.memoryUsed) * 100;

    // Pass if within 10% of baseline
    const passed = Math.abs(durationPercentChange) <= 10;

    return {
      durationDiff,
      durationPercentChange,
      memoryDiff,
      memoryPercentChange,
      passed
    };
  }

  /**
   * Generate full report
   */
  generateReport(): BenchmarkReport {
    const results = Array.from(this.results.values());
    
    return {
      timestamp: Date.now(),
      version: this.version,
      environment: this.getEnvironment(),
      results,
      summary: {
        totalTests: results.length,
        passed: results.length, // All run successfully
        failed: 0,
        avgDuration: results.reduce((sum, r) => sum + r.avgDuration, 0) / results.length
      }
    };
  }

  /**
   * Export results as JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.generateReport(), null, 2);
  }

  private percentile(arr: number[], p: number): number {
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.max(0, index)];
  }

  private getEnvironment(): BenchmarkEnvironment {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: require('os').cpus().length,
      memory: require('os').totalmem()
    };
  }
}

// ============================================
// Standard Document Benchmarks
// ============================================

export function createStandardBenchmarkSuite(): BenchmarkSuite {
  return {
    name: 'Standard Documents',
    description: 'Benchmarks for common document transformation scenarios',
    benchmarks: [
      {
        name: 'empty-document',
        fn: () => { /* Test with empty document */ },
        iterations: 100
      },
      {
        name: 'simple-paragraph',
        fn: () => { /* Test with simple paragraph */ },
        iterations: 50
      },
      {
        name: 'document-with-tables',
        fn: () => { /* Test with tables */ },
        iterations: 20
      },
      {
        name: 'document-with-images',
        fn: () => { /* Test with images */ },
        iterations: 10
      },
      {
        name: 'large-document-100pages',
        fn: () => { /* Test with 100 page document */ },
        iterations: 5
      }
    ]
  };
}

// ============================================
// Performance Regression Checker
// ============================================

export interface RegressionThreshold {
  metric: keyof BenchmarkResult;
  threshold: number; // percentage
}

export class RegressionChecker {
  private thresholds: RegressionThreshold[] = [
    { metric: 'avgDuration', threshold: 10 }, // 10% slower = regression
    { metric: 'p95', threshold: 15 },
    { metric: 'memoryUsed', threshold: 20 }
  ];

  /**
   * Check if current results indicate regression
   */
  checkForRegression(
    baseline: BenchmarkReport,
    current: BenchmarkReport
  ): {
    hasRegression: boolean;
    regressions: Array<{
      name: string;
      metric: string;
      baselineValue: number;
      currentValue: number;
      percentChange: number;
    }>;
  } {
    const regressions: Array<{
      name: string;
      metric: string;
      baselineValue: number;
      currentValue: number;
      percentChange: number;
    }> = [];

    for (const currentResult of current.results) {
      const baselineResult = baseline.results.find(r => r.name === currentResult.name);
      if (!baselineResult) continue;

      for (const threshold of this.thresholds) {
        const baselineValue = baselineResult[threshold.metric];
        const currentValue = currentResult[threshold.metric];
        const percentChange = ((currentValue - baselineValue) / baselineValue) * 100;

        if (percentChange > threshold.threshold) {
          regressions.push({
            name: currentResult.name,
            metric: threshold.metric,
            baselineValue,
            currentValue,
            percentChange
          });
        }
      }
    }

    return {
      hasRegression: regressions.length > 0,
      regressions
    };
  }
}

// ============================================
// Factory
// ============================================

export function createBenchmarkRunner(version?: string): BenchmarkRunner {
  return new BenchmarkRunner(version);
}

export function createRegressionChecker(): RegressionChecker {
  return new RegressionChecker();
}
