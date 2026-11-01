/**
 * @file lib/performance.ts
 * @module Performance
 * @description Performance monitoring utilities for measuring and tracking application performance.
 * Provides Web Vitals tracking, API timing, and performance metrics.
 * 
 * @see {@link https://web.dev/vitals/|Web Vitals}
 * @performance Critical for identifying bottlenecks and optimization opportunities
 */

/**
 * Performance metric entry for tracking and analysis.
 * 
 * @interface PerformanceMetric
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Performance metrics store for in-memory tracking.
 * In production, these should be sent to a monitoring service.
 * 
 * @private
 */
const metricsStore: PerformanceMetric[] = [];

/**
 * Records a performance metric.
 * 
 * @param {PerformanceMetric} metric - Metric to record
 * 
 * @example
 * recordMetric({
 *   name: 'api_plan_duration',
 *   value: 1250,
 *   unit: 'ms',
 *   timestamp: Date.now(),
 *   metadata: { eventType: 'wedding', cached: false }
 * });
 */
export function recordMetric(metric: PerformanceMetric): void {
  metricsStore.push(metric);
  
  // Keep only last 1000 metrics in memory
  if (metricsStore.length > 1000) {
    metricsStore.shift();
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${metric.name}: ${metric.value}${metric.unit}`);
  }

  // In production, send to monitoring service
  // Example: sendToMonitoringService(metric);
}

/**
 * Gets all recorded metrics or filters by name.
 * 
 * @param {string} [name] - Optional metric name filter
 * @returns {PerformanceMetric[]} Array of metrics
 */
export function getMetrics(name?: string): PerformanceMetric[] {
  if (name) {
    return metricsStore.filter(m => m.name === name);
  }
  return [...metricsStore];
}

/**
 * Clears all recorded metrics.
 */
export function clearMetrics(): void {
  metricsStore.length = 0;
}

/**
 * Calculates statistics for a set of metrics.
 * 
 * @param {PerformanceMetric[]} metrics - Metrics to analyze
 * @returns {object} Statistics including mean, median, p95, p99
 */
export function calculateStats(metrics: PerformanceMetric[]): {
  count: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
} {
  if (metrics.length === 0) {
    return { count: 0, mean: 0, median: 0, p95: 0, p99: 0, min: 0, max: 0 };
  }

  const values = metrics.map(m => m.value).sort((a, b) => a - b);
  const sum = values.reduce((acc, val) => acc + val, 0);
  
  return {
    count: values.length,
    mean: sum / values.length,
    median: values[Math.floor(values.length / 2)],
    p95: values[Math.floor(values.length * 0.95)],
    p99: values[Math.floor(values.length * 0.99)],
    min: values[0],
    max: values[values.length - 1],
  };
}

/**
 * High-resolution timer for measuring execution time.
 * Uses performance.now() when available, falls back to Date.now().
 * 
 * @example
 * const timer = startTimer();
 * await someOperation();
 * const duration = timer.end();
 * recordMetric({ name: 'operation_time', value: duration, unit: 'ms', timestamp: Date.now() });
 */
export function startTimer(): { end: () => number } {
  const start = typeof performance !== 'undefined' && performance.now
    ? performance.now()
    : Date.now();

  return {
    end: (): number => {
      const end = typeof performance !== 'undefined' && performance.now
        ? performance.now()
        : Date.now();
      return end - start;
    },
  };
}

/**
 * Measures and records the execution time of an async function.
 * 
 * @template T
 * @param {string} metricName - Name for the metric
 * @param {() => Promise<T>} fn - Async function to measure
 * @param {Record<string, unknown>} [metadata] - Optional metadata
 * @returns {Promise<T>} Result of the function
 * 
 * @example
 * const plan = await measureAsync('generate_plan', () => generateEventPlan(request));
 */
export async function measureAsync<T>(
  metricName: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const timer = startTimer();
  
  try {
    const result = await fn();
    const duration = timer.end();
    
    recordMetric({
      name: metricName,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: { ...metadata, success: true },
    });
    
    return result;
  } catch (error) {
    const duration = timer.end();
    
    recordMetric({
      name: metricName,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: { ...metadata, success: false, error: String(error) },
    });
    
    throw error;
  }
}

/**
 * Measures and records the execution time of a synchronous function.
 * 
 * @template T
 * @param {string} metricName - Name for the metric
 * @param {() => T} fn - Synchronous function to measure
 * @param {Record<string, unknown>} [metadata] - Optional metadata
 * @returns {T} Result of the function
 */
export function measureSync<T>(
  metricName: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  const timer = startTimer();
  
  try {
    const result = fn();
    const duration = timer.end();
    
    recordMetric({
      name: metricName,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: { ...metadata, success: true },
    });
    
    return result;
  } catch (error) {
    const duration = timer.end();
    
    recordMetric({
      name: metricName,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: { ...metadata, success: false, error: String(error) },
    });
    
    throw error;
  }
}

/**
 * Client-side Web Vitals reporter.
 * Call this from the root layout or _app to track Core Web Vitals.
 * 
 * @param {object} metric - Web Vitals metric
 * 
 * @example
 * // In app/layout.tsx or pages/_app.tsx
 * import { reportWebVitals } from '@/lib/performance';
 * 
 * export { reportWebVitals };
 * 
 * @see {@link https://nextjs.org/docs/advanced-features/measuring-performance|Next.js Performance}
 */
export function reportWebVitals(metric: {
  id: string;
  name: string;
  value: number;
  label: 'web-vital' | 'custom';
  startTime?: number;
}): void {
  // Record the metric
  recordMetric({
    name: `web_vital_${metric.name.toLowerCase()}`,
    value: metric.value,
    unit: 'ms',
    timestamp: Date.now(),
    metadata: {
      id: metric.id,
      label: metric.label,
      startTime: metric.startTime,
    },
  });

  // Send to analytics service
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: metric.label === 'web-vital' ? 'Web Vitals' : 'Custom',
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

/**
 * Tracks bundle size impact for code splitting analysis.
 * 
 * @param {string} chunkName - Name of the code chunk
 * @param {number} size - Size in bytes
 */
export function trackBundleSize(chunkName: string, size: number): void {
  recordMetric({
    name: 'bundle_size',
    value: size,
    unit: 'bytes',
    timestamp: Date.now(),
    metadata: { chunk: chunkName },
  });
}
