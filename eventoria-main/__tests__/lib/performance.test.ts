/**
 * @file __tests__/lib/performance.test.ts
 * Unit tests for performance monitoring utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recordMetric,
  getMetrics,
  clearMetrics,
  calculateStats,
  startTimer,
  measureAsync,
  measureSync,
  reportWebVitals,
} from '@/lib/performance';
import type { PerformanceMetric } from '@/lib/performance';

describe('Performance Monitoring', () => {
  beforeEach(() => {
    clearMetrics();
  });

  describe('recordMetric', () => {
    it('should record a metric', () => {
      const metric: PerformanceMetric = {
        name: 'test_metric',
        value: 100,
        unit: 'ms',
        timestamp: Date.now(),
      };

      recordMetric(metric);
      const metrics = getMetrics('test_metric');
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test_metric');
      expect(metrics[0].value).toBe(100);
    });

    it('should record metrics with metadata', () => {
      const metric: PerformanceMetric = {
        name: 'api_call',
        value: 250,
        unit: 'ms',
        timestamp: Date.now(),
        metadata: { endpoint: '/api/plan', cached: false },
      };

      recordMetric(metric);
      const metrics = getMetrics('api_call');
      
      expect(metrics[0].metadata).toEqual({ endpoint: '/api/plan', cached: false });
    });

    it('should enforce maximum storage limit', () => {
      // Record 1100 metrics
      for (let i = 0; i < 1100; i++) {
        recordMetric({
          name: 'test',
          value: i,
          unit: 'ms',
          timestamp: Date.now(),
        });
      }

      const allMetrics = getMetrics();
      expect(allMetrics.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('getMetrics', () => {
    it('should return all metrics when no filter provided', () => {
      recordMetric({ name: 'metric1', value: 10, unit: 'ms', timestamp: Date.now() });
      recordMetric({ name: 'metric2', value: 20, unit: 'ms', timestamp: Date.now() });
      
      const metrics = getMetrics();
      expect(metrics).toHaveLength(2);
    });

    it('should filter metrics by name', () => {
      recordMetric({ name: 'metric1', value: 10, unit: 'ms', timestamp: Date.now() });
      recordMetric({ name: 'metric2', value: 20, unit: 'ms', timestamp: Date.now() });
      recordMetric({ name: 'metric1', value: 15, unit: 'ms', timestamp: Date.now() });
      
      const filtered = getMetrics('metric1');
      expect(filtered).toHaveLength(2);
      expect(filtered.every(m => m.name === 'metric1')).toBe(true);
    });
  });

  describe('calculateStats', () => {
    it('should calculate correct statistics', () => {
      const metrics: PerformanceMetric[] = [
        { name: 'test', value: 100, unit: 'ms', timestamp: Date.now() },
        { name: 'test', value: 200, unit: 'ms', timestamp: Date.now() },
        { name: 'test', value: 300, unit: 'ms', timestamp: Date.now() },
        { name: 'test', value: 400, unit: 'ms', timestamp: Date.now() },
        { name: 'test', value: 500, unit: 'ms', timestamp: Date.now() },
      ];

      const stats = calculateStats(metrics);
      
      expect(stats.count).toBe(5);
      expect(stats.mean).toBe(300);
      expect(stats.median).toBe(300);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(500);
    });

    it('should handle empty metrics array', () => {
      const stats = calculateStats([]);
      
      expect(stats.count).toBe(0);
      expect(stats.mean).toBe(0);
      expect(stats.median).toBe(0);
    });

    it('should calculate percentiles correctly', () => {
      const metrics: PerformanceMetric[] = Array.from({ length: 100 }, (_, i) => ({
        name: 'test',
        value: i + 1,
        unit: 'ms',
        timestamp: Date.now(),
      }));

      const stats = calculateStats(metrics);
      
      expect(stats.p95).toBeGreaterThan(90);
      expect(stats.p99).toBeGreaterThan(95);
    });
  });

  describe('startTimer', () => {
    it('should measure elapsed time', async () => {
      const timer = startTimer();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const duration = timer.end();
      expect(duration).toBeGreaterThanOrEqual(95); // Allow 5ms margin
      expect(duration).toBeLessThan(150);
    });

    it('should use performance.now() when available', () => {
      const timer = startTimer();
      const duration = timer.end();
      
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('measureAsync', () => {
    it('should measure async function execution time', async () => {
      const mockFn = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'result';
      });

      const result = await measureAsync('test_async', mockFn);
      
      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      const metrics = getMetrics('test_async');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBeGreaterThanOrEqual(45);
    });

    it('should record metrics with metadata', async () => {
      const mockFn = vi.fn(async () => 'result');

      await measureAsync('test_async', mockFn, { userId: '123' });
      
      const metrics = getMetrics('test_async');
      expect(metrics[0].metadata).toMatchObject({ userId: '123', success: true });
    });

    it('should record error metrics on failure', async () => {
      const mockFn = vi.fn(async () => {
        throw new Error('Test error');
      });

      await expect(measureAsync('test_async', mockFn)).rejects.toThrow('Test error');
      
      const metrics = getMetrics('test_async');
      expect(metrics[0].metadata?.success).toBe(false);
      expect(metrics[0].metadata?.error).toContain('Test error');
    });
  });

  describe('measureSync', () => {
    it('should measure sync function execution time', () => {
      const mockFn = vi.fn(() => {
        let sum = 0;
        for (let i = 0; i < 10000; i++) {
          sum += i;
        }
        return sum;
      });

      const result = measureSync('test_sync', mockFn);
      
      expect(result).toBeGreaterThan(0);
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      const metrics = getMetrics('test_sync');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBeGreaterThan(0);
    });

    it('should handle errors in sync functions', () => {
      const mockFn = vi.fn(() => {
        throw new Error('Sync error');
      });

      expect(() => measureSync('test_sync', mockFn)).toThrow('Sync error');
      
      const metrics = getMetrics('test_sync');
      expect(metrics[0].metadata?.success).toBe(false);
    });
  });

  describe('reportWebVitals', () => {
    it('should record web vital metrics', () => {
      const metric = {
        id: 'v1-123',
        name: 'LCP',
        value: 2400,
        label: 'web-vital' as const,
        startTime: 100,
      };

      reportWebVitals(metric);
      
      const metrics = getMetrics('web_vital_lcp');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(2400);
      expect(metrics[0].metadata).toMatchObject({
        id: 'v1-123',
        label: 'web-vital',
        startTime: 100,
      });
    });

    it('should handle different web vitals', () => {
      const vitals = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'];
      
      vitals.forEach((name, index) => {
        reportWebVitals({
          id: `v1-${index}`,
          name,
          value: 100 * index,
          label: 'web-vital',
        });
      });

      vitals.forEach(name => {
        const metrics = getMetrics(`web_vital_${name.toLowerCase()}`);
        expect(metrics).toHaveLength(1);
      });
    });

    it('should call gtag if available', () => {
      const mockGtag = vi.fn();
      (global as any).window = { gtag: mockGtag };

      reportWebVitals({
        id: 'v1-test',
        name: 'LCP',
        value: 2400,
        label: 'web-vital',
      });

      expect(mockGtag).toHaveBeenCalledWith('event', 'LCP', expect.objectContaining({
        value: 2400,
        event_category: 'Web Vitals',
      }));

      delete (global as any).window;
    });
  });

  describe('clearMetrics', () => {
    it('should clear all recorded metrics', () => {
      recordMetric({ name: 'test1', value: 10, unit: 'ms', timestamp: Date.now() });
      recordMetric({ name: 'test2', value: 20, unit: 'ms', timestamp: Date.now() });
      
      clearMetrics();
      
      expect(getMetrics()).toHaveLength(0);
    });
  });
});
