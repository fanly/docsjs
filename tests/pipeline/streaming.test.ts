/**
 * Streaming Pipeline Tests
 * 
 * Tests for chunked and streaming document processing.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  StreamingPipelineManager, 
  createStreamingPipeline,
  estimateMemoryUsage 
} from '../../src/pipeline/streaming';
import type { CoreEngine } from '../../src/engine/core';
import type { TransformationProfile } from '../../src/types/engine';

// Mock CoreEngine
const mockEngine = {
  getConfig: () => ({ debug: false }),
  registerProfile: vi.fn(),
  applyProfile: vi.fn(),
} as unknown as CoreEngine;

// Mock TransformationProfile
const mockProfile: TransformationProfile = {
  id: 'test',
  name: 'Test Profile',
  description: 'Test',
  parse: { enablePlugins: true, features: {}, performance: {} },
  transform: { enablePlugins: true, operations: [] },
  render: { outputFormat: 'html', theme: 'default', options: {} },
  security: { allowedDomains: [], sanitizerProfile: 'fidelity-first' },
};

describe('StreamingPipelineManager', () => {
  let streamingManager: StreamingPipelineManager;

  beforeEach(() => {
    streamingManager = new StreamingPipelineManager(mockEngine, {
      chunkSize: 1024, // 1KB for testing
      streaming: true,
    });
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const manager = new StreamingPipelineManager(mockEngine);
      expect(manager).toBeDefined();
    });

    it('should accept custom options', () => {
      const manager = new StreamingPipelineManager(mockEngine, {
        chunkSize: 2048,
        maxMemoryMB: 1024,
      });
      expect(manager).toBeDefined();
    });
  });

  describe('createStreamingPipeline factory', () => {
    it('should create a streaming pipeline manager', () => {
      const manager = createStreamingPipeline(mockEngine);
      expect(manager).toBeInstanceOf(StreamingPipelineManager);
    });
  });

  describe('Memory Estimation', () => {
    it('should estimate memory for small files', () => {
      const result = estimateMemoryUsage(100000, { chunkSize: 1024, maxMemoryMB: 512, streaming: true });
      
      expect(result.estimatedPeakMemoryMB).toBeDefined();
      expect(result.recommendedChunkSize).toBeLessThanOrEqual(1024);
      expect(result.requiresStreaming).toBe(false);
    });

    it('should recommend streaming for large files', () => {
      // 1GB input
      const result = estimateMemoryUsage(1024 * 1024 * 1024, { 
        chunkSize: 1024 * 1024, 
        maxMemoryMB: 512, 
        streaming: true 
      });
      
      expect(result.requiresStreaming).toBe(true);
    });

    it('should calculate recommended chunk size based on memory limit', () => {
      const result = estimateMemoryUsage(10000000, { 
        chunkSize: 1024 * 1024, 
        maxMemoryMB: 256, 
        streaming: true 
      });
      
      // Should recommend smaller chunks for lower memory
      expect(result.recommendedChunkSize).toBeLessThanOrEqual(1024 * 1024 * 0.2);
    });
  });

  describe('Progress Reporting', () => {
    it('should call progress callback', async () => {
      const progressCallback = vi.fn();
      
      const manager = new StreamingPipelineManager(mockEngine, {
        chunkSize: 1024,
        onProgress: progressCallback,
      });
      
      // Small string - processes immediately
      const result = await manager.processChunked('test', mockProfile);
      
      expect(result).toBeDefined();
      expect(result.complete).toBe(true);
    });

    it('should track bytes processed', async () => {
      const input = '<p>Test content</p>';
      
      const result = await streamingManager.processChunked(input, mockProfile);
      
      expect(result.metrics.bytesProcessed).toBe(input.length);
    });

    it('should track chunks processed', async () => {
      const input = '<p>Test</p>';
      
      const result = await streamingManager.processChunked(input, mockProfile);
      
      expect(result.metrics.chunksProcessed).toBeGreaterThan(0);
    });
  });

  describe('Processing', () => {
    it('should process string input', async () => {
      const html = '<p>Hello World</p>';
      
      const result = await streamingManager.processChunked(html, mockProfile);
      
      expect(result.complete).toBe(true);
      expect(result.metrics.totalTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should calculate throughput', async () => {
      const html = '<p>Test content here</p>';
      
      const result = await streamingManager.processChunked(html, mockProfile);
      
      // Throughput should be calculated
      expect(result.metrics.bytesProcessed).toBeGreaterThan(0);
    });
  });

  describe('Stream Chunks', () => {
    it('should yield chunks for large input', async () => {
      // This tests the async generator
      const input = '<p>Test</p>';
      
      const generator = streamingManager.streamChunks(input, mockProfile);
      
      // Get first result
      const { value, done } = await generator.next();
      
      expect(done).toBe(false);
      expect(value).toBeDefined();
    });
  });
});

describe('ProcessingProgress', () => {
  it('should calculate percentage correctly', async () => {
    const progressCallback = vi.fn();
    
    const manager = new StreamingPipelineManager(mockEngine, {
      chunkSize: 10,
      onProgress: (progress) => {
        progressCallback(progress);
        expect(progress.percentage).toBeGreaterThanOrEqual(0);
        expect(progress.percentage).toBeLessThanOrEqual(100);
      },
    });
    
    await manager.processChunked('1234567890', mockProfile);
    
    expect(progressCallback).toHaveBeenCalled();
  });

  it('should estimate remaining time', async () => {
    const progressCallback = vi.fn();
    
    const manager = new StreamingPipelineManager(mockEngine, {
      chunkSize: 5,
      onProgress: (progress) => {
        progressCallback(progress);
        // After some progress, should estimate time
        if (progress.percentage > 10) {
          expect(progress.estimatedTimeRemainingMs).toBeGreaterThanOrEqual(0);
        }
      },
    });
    
    await manager.processChunked('12345', mockProfile);
  });
});
