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
  const gtag = typeof window !== 'undefined'
    ? (window as Window & { gtag?: (...args: unknown[]) => void }).gtag
    : undefined;
  if (gtag) {
    gtag('event', metric.name, {
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

// ============================================================================
// Advanced Performance Monitoring
// ============================================================================

/**
 * Performance budget thresholds for monitoring
 * Used to detect performance regressions
 */
export const PERFORMANCE_BUDGETS = {
  API_PLAN_GENERATION: 30000, // 30 seconds max
  API_CHAT_RESPONSE: 5000, // 5 seconds max for first token
  API_ASK_RESPONSE: 2000, // 2 seconds max
  CACHE_LOOKUP: 10, // 10ms max
  VALIDATION: 5, // 5ms max
  CLASSIFICATION: 3, // 3ms max
} as const;

/**
 * Checks if a metric exceeds its performance budget
 * 
 * @param {string} metricName - Name of the metric
 * @param {number} value - Measured value in ms
 * @returns {boolean} True if budget is exceeded
 */
export function exceedsBudget(metricName: string, value: number): boolean {
  const budget = PERFORMANCE_BUDGETS[metricName as keyof typeof PERFORMANCE_BUDGETS];
  return budget ? value > budget : false;
}

/**
 * Records a metric with budget checking
 * Logs a warning if performance budget is exceeded
 * 
 * @param {PerformanceMetric} metric - Metric to record
 */
export function recordMetricWithBudget(metric: PerformanceMetric): void {
  recordMetric(metric);
  
  if (exceedsBudget(metric.name, metric.value)) {
    console.warn(
      `[Performance Warning] ${metric.name} exceeded budget: ${metric.value}${metric.unit} ` +
      `(budget: ${PERFORMANCE_BUDGETS[metric.name as keyof typeof PERFORMANCE_BUDGETS]}ms)`
    );
  }
}

/**
 * Memory usage tracker for detecting memory leaks
 */
class MemoryTracker {
  private snapshots: Array<{ timestamp: number; usage: NodeJS.MemoryUsage }> = [];
  private readonly maxSnapshots = 100;

  /**
   * Takes a memory snapshot
   */
  snapshot(): void {
    if (typeof process === 'undefined' || !process.memoryUsage) {
      return;
    }

    this.snapshots.push({
      timestamp: Date.now(),
      usage: process.memoryUsage(),
    });

    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  /**
   * Detects potential memory leaks by analyzing growth trend
   * 
   * @returns {boolean} True if memory leak suspected
   */
  detectLeak(): boolean {
    if (this.snapshots.length < 10) {
      return false; // Not enough data
    }

    // Check if heap usage is consistently increasing
    const recent = this.snapshots.slice(-10);
    let increasing = 0;

    for (let i = 1; i < recent.length; i++) {
      if (recent[i].usage.heapUsed > recent[i - 1].usage.heapUsed) {
        increasing++;
      }
    }

    // If heap increased in 8 out of 10 samples, suspect a leak
    return increasing >= 8;
  }

  /**
   * Gets current memory usage statistics
   * 
   * @returns {object} Memory statistics
   */
  getStats(): {
    current: NodeJS.MemoryUsage | null;
    trend: 'increasing' | 'stable' | 'decreasing';
    leakDetected: boolean;
  } {
    if (this.snapshots.length === 0) {
      return { current: null, trend: 'stable', leakDetected: false };
    }

    const current = this.snapshots[this.snapshots.length - 1].usage;
    const leakDetected = this.detectLeak();

    // Determine trend
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (this.snapshots.length >= 5) {
      const recent = this.snapshots.slice(-5);
      const first = recent[0].usage.heapUsed;
      const last = recent[recent.length - 1].usage.heapUsed;
      const change = ((last - first) / first) * 100;

      if (change > 10) trend = 'increasing';
      else if (change < -10) trend = 'decreasing';
    }

    return { current, trend, leakDetected };
  }
}

/**
 * Global memory tracker instance
 */
export const memoryTracker = new MemoryTracker();

/**
 * Starts periodic memory monitoring
 * Should be called once at application startup
 * 
 * @param {number} [intervalMs=60000] - Monitoring interval in milliseconds
 * @returns {() => void} Function to stop monitoring
 */
export function startMemoryMonitoring(intervalMs: number = 60000): () => void {
  const intervalId = setInterval(() => {
    memoryTracker.snapshot();
    
    const stats = memoryTracker.getStats();
    if (stats.leakDetected) {
      console.error('[Performance] Potential memory leak detected!', stats);
    }
  }, intervalMs);

  return () => clearInterval(intervalId);
}

/**
 * Operation timing with automatic metric recording
 * Decorator-style wrapper for async operations
 * 
 * @template T
 * @param {string} operationName - Name of the operation
 * @param {() => Promise<T>} operation - Async operation to time
 * @param {object} [options] - Additional options
 * @returns {Promise<T>} Operation result
 * 
 * @example
 * const plan = await timeOperation('plan-generation', async () => {
 *   return await generateEventPlan(request);
 * }, { category: 'api', captureMemory: true });
 */
export async function timeOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  options: {
    category?: string;
    captureMemory?: boolean;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<T> {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const startMemory = options.captureMemory && typeof process !== 'undefined' 
    ? process.memoryUsage() 
    : null;

  try {
    const result = await operation();
    const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;

    const metric: PerformanceMetric = {
      name: operationName,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: {
        ...options.metadata,
        category: options.category,
        success: true,
      },
    };

    if (startMemory && typeof process !== 'undefined') {
      const endMemory = process.memoryUsage();
      metric.metadata = {
        ...metric.metadata,
        memoryDelta: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external,
        },
      };
    }

    recordMetricWithBudget(metric);
    return result;
  } catch (error) {
    const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;

    recordMetric({
      name: operationName,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: {
        ...options.metadata,
        category: options.category,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}

/**
 * Gets performance summary for all recorded metrics
 * Useful for health checks and monitoring dashboards
 * 
 * @returns {object} Performance summary by metric name
 */
export function getPerformanceSummary(): Record<string, {
  count: number;
  mean: number;
  p95: number;
  successRate: number;
}> {
  const allMetrics = getMetrics();
  const summary: Record<
    string,
    { count: number; mean: number; p95: number; successRate: number }
  > = {};

  // Group by metric name
  const grouped = allMetrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = [];
    }
    acc[metric.name].push(metric);
    return acc;
  }, {} as Record<string, PerformanceMetric[]>);

  // Calculate stats for each group
  for (const [name, metrics] of Object.entries(grouped)) {
    const stats = calculateStats(metrics);
    const successCount = metrics.filter(
      m => m.metadata?.success === true
    ).length;

    summary[name] = {
      count: stats.count,
      mean: Math.round(stats.mean * 100) / 100,
      p95: Math.round(stats.p95 * 100) / 100,
      successRate: Math.round((successCount / metrics.length) * 100),
    };
  }

  return summary;
}

/**
 * Exports metrics in a format suitable for monitoring services
 * 
 * @param {string} [format='json'] - Export format
 * @returns {string} Formatted metrics data
 */
export function exportMetrics(format: 'json' | 'csv' = 'json'): string {
  const metrics = getMetrics();

  if (format === 'json') {
    return JSON.stringify(metrics, null, 2);
  }

  // CSV format
  if (metrics.length === 0) {
    return 'name,value,unit,timestamp';
  }

  const header = 'name,value,unit,timestamp,success\n';
  const rows = metrics.map(m => 
    `${m.name},${m.value},${m.unit},${m.timestamp},${m.metadata?.success || 'true'}`
  ).join('\n');

  return header + rows;
}
