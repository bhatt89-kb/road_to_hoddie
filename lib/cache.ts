
/**
 * @file lib/cache.ts
 * @module Cache
 * @description Advanced in-memory cache implementation with multiple eviction strategies
 * (LRU, LFU) and comprehensive cache management for AI responses and computed values.
 *
 * @performance Reduces API costs and improves response times for repeated queries
 * @see {@link https://en.wikipedia.org/wiki/Cache_replacement_policies|Cache Replacement Policies}
 */

import { config } from './config';
import { CACHE_TTL_MS, CACHE_MAX_SIZE } from './constants';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Cache entry with metadata
 * 
 * @template T - Type of cached value
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
  priority: number;
}

/**
 * Cache configuration options
 * 
 * @interface CacheOptions
 */
interface CacheOptions {
  /** Maximum number of entries to store */
  maxSize: number;
  /** Time to live in milliseconds */
  ttl: number;
  /** Maximum memory size in bytes (optional) */
  maxMemorySize?: number;
  /** Eviction strategy: 'lru' (Least Recently Used) or 'lfu' (Least Frequently Used) */
  evictionStrategy?: 'lru' | 'lfu' | 'adaptive';
}

/**
 * Cache statistics
 * 
 * @interface CacheStats
 */
export interface CacheStats {
  size: number;
  maxSize: number;
  memorySize: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  averageAccessCount: number;
}

// ============================================================================
// Hash Function
// ============================================================================

/**
 * DJB2 hash function for generating cache keys
 * Fast and provides good distribution for string keys
 * 
 * @param {string} str - String to hash
 * @returns {string} Hash in base-36 format
 */
function simpleHash(str: string): string {
  let hash = 5381;

  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }

  return (hash >>> 0).toString(36);
}

// ============================================================================
// Advanced LRU/LFU Cache Implementation
// ============================================================================

/**
 * Generic cache with configurable eviction strategies
 * Supports LRU (Least Recently Used), LFU (Least Frequently Used), and Adaptive modes
 * 
 * @template K - Key type
 * @template V - Value type
 * 
 * @example
 * const cache = new LRUCache<string, object>({
 *   maxSize: 100,
 *   ttl: 3600000, // 1 hour
 *   evictionStrategy: 'lru'
 * });
 */
export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private readonly maxSize: number;
  private readonly ttl: number;
  private readonly maxMemorySize?: number;
  private readonly evictionStrategy: 'lru' | 'lfu' | 'adaptive';
  private currentMemorySize = 0;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(options: CacheOptions) {
    this.cache = new Map();
    this.maxSize = Math.max(1, options.maxSize);
    this.ttl = options.ttl;
    this.maxMemorySize = options.maxMemorySize;
    this.evictionStrategy = options.evictionStrategy || 'lru';
  }

  /**
   * Generates a deterministic cache key from event planning parameters
   * Keys are case-insensitive and order-independent for preferences
   * 
   * @param {object} params - Event planning parameters
   * @returns {string} Deterministic cache key
   * 
   * @example
   * const key = LRUCache.generateKey({
   *   eventType: 'wedding',
   *   guestCount: 250,
   *   budget: 2000000,
   *   city: 'Mumbai',
   *   preferences: ['Vegetarian', 'Outdoor']
   * });
   */
  static generateKey(params: {
    eventType?: string;
    guestCount?: number;
    budget?: number;
    city?: string;
    date?: string;
    description?: string;
    preferences?: string[];
  }): string {
    const eventType = (params.eventType || 'unknown').toLowerCase();
    const guestCount = params.guestCount || 0;
    const budget = params.budget || 0;
    const city = (params.city || 'unknown').toLowerCase().trim();
    const date = params.date || 'unknown';

    const description = (params.description || '').toLowerCase().trim();

    // Sort preferences for order-independent keys
    const preferences = (params.preferences || [])
      .map((p) => p.toLowerCase().trim())
      .sort()
      .join('|');

    const textContent = `${description}::${preferences}`;
    const contentHash = simpleHash(textContent);

    return `${eventType}:${guestCount}:${budget}:${city}:${date}:${contentHash}`;
  }

  /**
   * Retrieves a cached value if it exists and has not expired
   * Updates access metadata for LRU/LFU tracking
   * 
   * @param {K} key - Cache key
   * @returns {V | undefined} Cached value or undefined
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check TTL expiration
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.currentMemorySize -= entry.size;
      this.misses++;
      return undefined;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.hits++;

    // For LRU: move entry to end (most recently used)
    if (this.evictionStrategy === 'lru') {
      this.cache.delete(key);
      this.cache.set(key, entry);
    }

    return entry.value;
  }

  /**
   * Stores a value with intelligent eviction
   * 
   * @param {K} key - Cache key
   * @param {V} value - Value to cache
   * @param {number} [priority=0] - Priority hint (higher = more important)
   */
  set(key: K, value: V, priority: number = 0): void {
    const now = Date.now();
    const size = this.estimateSize(value);

    // Remove existing entry if present
    const existing = this.cache.get(key);
    if (existing) {
      this.currentMemorySize -= existing.size;
      this.cache.delete(key);
    }

    // Evict entries if necessary
    this.evictIfNeeded(size);

    // Create new entry
    const entry: CacheEntry<V> = {
      value,
      timestamp: now,
      size,
      accessCount: 0,
      lastAccessed: now,
      priority,
    };

    this.cache.set(key, entry);
    this.currentMemorySize += size;
  }

  /**
   * Evicts entries based on configured strategy
   * 
   * @private
   * @param {number} requiredSize - Size needed for new entry
   */
  private evictIfNeeded(requiredSize: number): void {
    while (
      this.cache.size >= this.maxSize ||
      (this.maxMemorySize !== undefined &&
        this.currentMemorySize + requiredSize > this.maxMemorySize)
    ) {
      const keyToEvict = this.selectEvictionCandidate();
      if (!keyToEvict) break;

      const entry = this.cache.get(keyToEvict);
      if (entry) {
        this.currentMemorySize -= entry.size;
        this.evictions++;
      }
      this.cache.delete(keyToEvict);
    }
  }

  /**
   * Selects the best candidate for eviction based on strategy
   * 
   * @private
   * @returns {K | undefined} Key to evict
   */
  private selectEvictionCandidate(): K | undefined {
    if (this.cache.size === 0) return undefined;

    switch (this.evictionStrategy) {
      case 'lru':
        // First entry is least recently used
        return this.cache.keys().next().value;

      case 'lfu':
        // Find entry with lowest access count
        return this.findLeastFrequentlyUsed();

      case 'adaptive':
        // Use adaptive strategy based on hit rate
        return this.getHitRate() > 0.8
          ? this.findLeastFrequentlyUsed()
          : this.cache.keys().next().value;

      default:
        return this.cache.keys().next().value;
    }
  }

  /**
   * Finds the least frequently used entry
   * 
   * @private
   * @returns {K | undefined} Key of LFU entry
   */
  private findLeastFrequentlyUsed(): K | undefined {
    let minAccessCount = Infinity;
    let lfuKey: K | undefined;

    for (const [key, entry] of this.cache.entries()) {
      // Prioritize entries with lower access count and older last access time
      const score = entry.accessCount + (entry.priority * 10);
      if (score < minAccessCount) {
        minAccessCount = score;
        lfuKey = key;
      }
    }

    return lfuKey;
  }

  /**
   * Checks whether a key exists and has not expired
   * 
   * @param {K} key - Cache key
   * @returns {boolean} True if key exists and is valid
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Removes a specific entry from the cache
   * 
   * @param {K} key - Cache key
   * @returns {boolean} True if entry was deleted
   */
  delete(key: K): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentMemorySize -= entry.size;
    }
    return this.cache.delete(key);
  }

  /**
   * Clears all cache entries and resets statistics
   */
  clear(): void {
    this.cache.clear();
    this.currentMemorySize = 0;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Removes expired entries and returns the number removed
   * 
   * @returns {number} Number of entries removed
   */
  prune(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        this.currentMemorySize -= entry.size;
        removed++;
      }
    }

    return removed;
  }

  /**
   * Returns comprehensive cache statistics
   * 
   * @returns {CacheStats} Cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    let totalAccessCount = 0;
    for (const entry of this.cache.values()) {
      totalAccessCount += entry.accessCount;
    }
    const averageAccessCount = this.cache.size > 0
      ? totalAccessCount / this.cache.size
      : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      memorySize: this.currentMemorySize,
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      evictions: this.evictions,
      averageAccessCount: Math.round(averageAccessCount * 100) / 100,
    };
  }

  /**
   * Gets current hit rate
   * 
   * @returns {number} Hit rate between 0 and 1
   */
  private getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }

  /**
   * Estimates the memory size of a value in bytes
   * 
   * @private
   * @param {V} value - Value to estimate
   * @returns {number} Estimated size in bytes
   */
  private estimateSize(value: V): number {
    try {
      const serialized = JSON.stringify(value);
      if (serialized === undefined) {
        return 1024; // Default size
      }
      // Each character is 2 bytes in UTF-16
      return serialized.length * 2;
    } catch {
      return 1024; // Fallback size
    }
  }

  /**
   * Warms the cache with predefined entries
   * Useful for preloading common queries
   * 
   * @param {Map<K, V>} entries - Entries to warm cache with
   */
  warmCache(entries: Map<K, V>): void {
    for (const [key, value] of entries.entries()) {
      this.set(key, value);
    }
  }

  /**
   * Exports cache contents for persistence
   * 
   * @returns {Array} Serializable cache contents
   */
  export(): Array<{ key: K; value: V; timestamp: number }> {
    const entries: Array<{ key: K; value: V; timestamp: number }> = [];
    
    for (const [key, entry] of this.cache.entries()) {
      entries.push({
        key,
        value: entry.value,
        timestamp: entry.timestamp,
      });
    }

    return entries;
  }

  /**
   * Imports cache contents from persistence
   * 
   * @param {Array} entries - Entries to import
   */
  import(entries: Array<{ key: K; value: V; timestamp: number }>): void {
    const now = Date.now();
    
    for (const { key, value, timestamp } of entries) {
      // Only import non-expired entries
      if (now - timestamp < this.ttl) {
        this.set(key, value);
      }
    }
  }
}

// ============================================================================
// Cache Instances
// ============================================================================

/**
 * Singleton cache for event plans
 * Uses adaptive eviction strategy for optimal performance
 */
export const planCache = new LRUCache<string, any>({
  maxSize: CACHE_MAX_SIZE.PLAN,
  ttl: CACHE_TTL_MS.PLAN,
  maxMemorySize: 10 * 1024 * 1024, // 10 MB
  evictionStrategy: 'adaptive',
});

/**
 * Cache for quick ask responses
 * Uses LFU eviction since frequently asked questions are more valuable
 */
export const askCache = new LRUCache<string, string>({
  maxSize: CACHE_MAX_SIZE.ASK,
  ttl: CACHE_TTL_MS.ASK,
  maxMemorySize: 5 * 1024 * 1024, // 5 MB
  evictionStrategy: 'lfu',
});

// ============================================================================
// Cache Utilities
// ============================================================================

/**
 * Logs cache statistics for monitoring
 * 
 * @param {string} [cacheName] - Optional cache name filter
 */
export function logCacheStats(cacheName?: string): void {
  if (!config.isDevelopment) return;

  if (!cacheName || cacheName === 'plan') {
    const stats = planCache.getStats();
    console.log('[Cache] Plan cache stats:', stats);
  }

  if (!cacheName || cacheName === 'ask') {
    const stats = askCache.getStats();
    console.log('[Cache] Ask cache stats:', stats);
  }
}

/**
 * Clears all caches
 * Useful for testing and manual cache invalidation
 */
export function clearAllCaches(): void {
  planCache.clear();
  askCache.clear();
  console.log('[Cache] All caches cleared');
}

/**
 * Gets combined cache statistics
 * 
 * @returns {object} Combined stats from all caches
 */
export function getAllCacheStats(): {
  plan: CacheStats;
  ask: CacheStats;
  total: {
    size: number;
    memorySize: number;
    hitRate: number;
  };
} {
  const planStats = planCache.getStats();
  const askStats = askCache.getStats();

  return {
    plan: planStats,
    ask: askStats,
    total: {
      size: planStats.size + askStats.size,
      memorySize: planStats.memorySize + askStats.memorySize,
      hitRate: (
        (planStats.hits + askStats.hits) /
        (planStats.hits + planStats.misses + askStats.hits + askStats.misses)
      ) || 0,
    },
  };
}

// ============================================================================
// Automatic Cache Maintenance
// ============================================================================

/**
 * Periodically prune expired entries from all caches
 * Runs every 5 minutes if caching is enabled
 */
if (typeof setInterval !== 'undefined' && config.isCachingEnabled) {
  const pruneInterval = setInterval(() => {
    const planRemoved = planCache.prune();
    const askRemoved = askCache.prune();

    if (config.isDevelopment && (planRemoved > 0 || askRemoved > 0)) {
      console.log(
        `[Cache] Pruned ${planRemoved} plan entries and ${askRemoved} ask entries`
      );
      logCacheStats();
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  // Log initial cache setup
  if (config.isDevelopment) {
    console.log('[Cache] Initialized with automatic pruning every 5 minutes');
  }

  // Clean up on process exit (Node.js only)
  if (typeof process !== 'undefined' && process.on) {
    process.on('exit', () => {
      clearInterval(pruneInterval);
    });
  }
}
