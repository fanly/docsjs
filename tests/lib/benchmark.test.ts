/**
 * Benchmark Module Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  BenchmarkRunner, 
  createBenchmarkRunner,
  createRegressionChecker,
  createStandardBenchmarkSuite
} from '../../src/lib/benchmark';

describe('BenchmarkRunner', () => {
  let runner: BenchmarkRunner;

  beforeEach(() => {
    runner = createBenchmarkRunner('2.0.0-test');
  });

  describe('Basic Operations', () => {
    it('should create a benchmark runner', () => {
      expect(runner).toBeDefined();
    });

    it('should run a simple benchmark', async () => {
      const result = await runner.run('simple-test', () => {
        // Simple synchronous operation
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
      }, { iterations: 3, warmup: 0 });

      expect(result).toBeDefined();
      expect(result.name).toBe('simple-test');
      expect(result.iterations).toBe(3);
      expect(result.avgDuration).toBeGreaterThanOrEqual(0);
      expect(result.minDuration).toBeGreaterThanOrEqual(0);
      expect(result.maxDuration).toBeGreaterThanOrEqual(0);
    });

    it('should calculate percentiles', async () => {
      const result = await runner.run('percentile-test', () => {
        // Variable duration
        const delay = Math.random() * 10;
        const start = Date.now();
        while (Date.now() - start < delay) { /* busy wait */ }
      }, { iterations: 10, warmup: 0 });

      expect(result.p50).toBeGreaterThanOrEqual(0);
      expect(result.p95).toBeGreaterThanOrEqual(result.p50);
      expect(result.p99).toBeGreaterThanOrEqual(result.p95);
    });
  });

  describe('Benchmark Suite', () => {
    it('should create a standard benchmark suite', () => {
      const suite = createStandardBenchmarkSuite();
      expect(suite).toBeDefined();
      expect(suite.name).toBe('Standard Documents');
      expect(suite.benchmarks.length).toBeGreaterThan(0);
    });
  });

  describe('Report Generation', () => {
    it('should generate a report', async () => {
      await runner.run('report-test', () => {}, { iterations: 1, warmup: 0 });
      
      const report = runner.generateReport();
      
      expect(report).toBeDefined();
      expect(report.version).toBe('2.0.0-test');
      expect(report.timestamp).toBeGreaterThan(0);
      expect(report.environment).toBeDefined();
      expect(report.results.length).toBeGreaterThan(0);
      expect(report.summary.totalTests).toBe(1);
    });

    it('should export JSON', async () => {
      await runner.run('json-test', () => {}, { iterations: 1, warmup: 0 });
      
      const json = runner.exportJSON();
      
      expect(json).toBeDefined();
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });
});

describe('RegressionChecker', () => {
  it('should create a regression checker', () => {
    const checker = createRegressionChecker();
    expect(checker).toBeDefined();
  });

  it('should detect regressions', () => {
    const checker = createRegressionChecker();
    
    const baseline = {
      timestamp: Date.now() - 86400000,
      version: '1.0.0',
      environment: { nodeVersion: '18', platform: 'darwin', arch: 'x64', cpus: 8, memory: 16000000000 },
      results: [{
        name: 'test',
        duration: 100,
        memoryUsed: 1000000,
        cpuTime: 50,
        iterations: 10,
        avgDuration: 10,
        minDuration: 8,
        maxDuration: 15,
        p50: 9,
        p95: 14,
        p99: 15
      }],
      summary: { totalTests: 1, passed: 1, failed: 0, avgDuration: 10 }
    };

    const current = {
      timestamp: Date.now(),
      version: '2.0.0',
      environment: { nodeVersion: '18', platform: 'darwin', arch: 'x64', cpus: 8, memory: 16000000000 },
      results: [{
        name: 'test',
        duration: 150,
        memoryUsed: 1200000,
        cpuTime: 60,
        iterations: 10,
        avgDuration: 15,
        minDuration: 12,
        maxDuration: 20,
        p50: 14,
        p95: 19,
        p99: 20
      }],
      summary: { totalTests: 1, passed: 1, failed: 0, avgDuration: 15 }
    };

    const result = checker.checkForRegression(baseline, current);
    
    expect(result.hasRegression).toBe(true);
    expect(result.regressions.length).toBeGreaterThan(0);
  });

  it('should not detect regression when within threshold', () => {
    const checker = createRegressionChecker();
    
    const baseline = {
      timestamp: Date.now() - 86400000,
      version: '1.0.0',
      environment: { nodeVersion: '18', platform: 'darwin', arch: 'x64', cpus: 8, memory: 16000000000 },
      results: [{
        name: 'test',
        duration: 100,
        memoryUsed: 1000000,
        cpuTime: 50,
        iterations: 10,
        avgDuration: 10,
        minDuration: 8,
        maxDuration: 15,
        p50: 9,
        p95: 14,
        p99: 15
      }],
      summary: { totalTests: 1, passed: 1, failed: 0, avgDuration: 10 }
    };

    const current = {
      timestamp: Date.now(),
      version: '2.0.0',
      environment: { nodeVersion: '18', platform: 'darwin', arch: 'x64', cpus: 8, memory: 16000000000 },
      results: [{
        name: 'test',
        duration: 105,
        memoryUsed: 1050000,
        cpuTime: 52,
        iterations: 10,
        avgDuration: 10.5,
        minDuration: 8,
        maxDuration: 15,
        p50: 9,
        p95: 14,
        p99: 15
      }],
      summary: { totalTests: 1, passed: 1, failed: 0, avgDuration: 10.5 }
    };

    const result = checker.checkForRegression(baseline, current);
    
    // Should not detect regression (only 5% change, within 10% threshold)
    expect(result.hasRegression).toBe(false);
  });
});
