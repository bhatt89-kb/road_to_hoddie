
/**
 * @file lib/cache.ts
 * @module Cache
 * @description In-memory LRU (Least Recently Used) cache implementation for AI responses
 * and computed values. Improves efficiency by avoiding redundant API calls and calculations.
 *
 * @performance Reduces API costs and improves response times for repeated queries
 * @see {@link https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU)|LRU Cache}
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  size: number;
}

interface CacheOptions {
  /** Maximum number of entries to store */
  maxSize: number;
  /** Time to live in milliseconds */
  ttl: number;
  /** Maximum memory size in bytes (optional) */
  maxMemorySize?: number;
}

/**
 * Simple DJB2 hash function for cache keys.
 */
function simpleHash(str: string): string {
  let hash = 5381;

  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }

  return (hash >>> 0).toString(36);
}

/**
 * Generic LRU Cache implementation with TTL support.
 */
export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private readonly maxSize: number;
  private readonly ttl: number;
  private readonly maxMemorySize?: number;
  private currentMemorySize = 0;

  constructor(options: CacheOptions) {
    this.cache = new Map();
    this.maxSize = Math.max(1, options.maxSize);
    this.ttl = options.ttl;
    this.maxMemorySize = options.maxMemorySize;
  }

  /**
   * Generates a deterministic cache key from event planning parameters.
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

    const preferences = (params.preferences || [])
      .map((p) => p.toLowerCase().trim())
      .sort()
      .join('|');

    const textContent = `${description}::${preferences}`;
    const contentHash = simpleHash(textContent);

    return `${eventType}:${guestCount}:${budget}:${city}:${date}:${contentHash}`;
  }

  /**
   * Retrieves a cached value if it exists and has not expired.
   * Refreshes the entry's position to implement LRU behavior.
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.currentMemorySize -= entry.size;
      return undefined;
    }

    // Move the accessed entry to the end of the Map.
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Stores a value and evicts least recently used entries when necessary.
   */
  set(key: K, value: V): void {
    const now = Date.now();
    const size = this.estimateSize(value);

    // Remove the existing entry before replacing it.
    const existing = this.cache.get(key);

    if (existing) {
      this.currentMemorySize -= existing.size;
      this.cache.delete(key);
    }

    // Evict entries until there is room for the new value.
    while (
      this.cache.size >= this.maxSize ||
      (
        this.maxMemorySize !== undefined &&
        this.currentMemorySize + size > this.maxMemorySize
      )
    ) {
      const firstKey = this.cache.keys().next();

      // Prevent accessing or deleting an undefined key.
      if (firstKey.done) {
        break;
      }

      const oldestKey = firstKey.value;
      const firstEntry = this.cache.get(oldestKey);

      if (firstEntry) {
        this.currentMemorySize -= firstEntry.size;
      }

      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      timestamp: now,
      size,
    });

    this.currentMemorySize += size;
  }

  /**
   * Checks whether a key exists and has not expired.
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Removes a specific entry from the cache.
   */
  delete(key: K): boolean {
    const entry = this.cache.get(key);

    if (entry) {
      this.currentMemorySize -= entry.size;
    }

    return this.cache.delete(key);
  }

  /**
   * Clears all cache entries.
   */
  clear(): void {
    this.cache.clear();
    this.currentMemorySize = 0;
  }

  /**
   * Removes expired entries and returns the number removed.
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
   * Returns cache statistics.
   */
  getStats(): {
    size: number;
    maxSize: number;
    memorySize: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      memorySize: this.currentMemorySize,
    };
  }

  /**
   * Estimates the memory size of a value in bytes.
   */
  private estimateSize(value: V): number {
    try {
      const serialized = JSON.stringify(value);

      // JSON.stringify can return undefined for some values.
      if (serialized === undefined) {
        return 1024;
      }

      return serialized.length * 2;
    } catch {
      return 1024;
    }
  }
}

/**
 * Singleton cache for event plans.
 */
export const planCache = new LRUCache<string, any>({
  maxSize: 50,
  ttl: 15 * 60 * 1000,
  maxMemorySize: 10 * 1024 * 1024,
});

/**
 * Cache for quick ask responses.
 */
export const askCache = new LRUCache<string, string>({
  maxSize: 200,
  ttl: 30 * 60 * 1000,
  maxMemorySize: 5 * 1024 * 1024,
});

/**
 * Periodically prune expired entries.
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const planRemoved = planCache.prune();
    const askRemoved = askCache.prune();

    if (
      process.env.NODE_ENV === 'development' &&
      (planRemoved > 0 || askRemoved > 0)
    ) {
      console.log(
        `[Cache] Pruned ${planRemoved} plan entries and ${askRemoved} ask entries`
      );
    }
  }, 5 * 60 * 1000);
}
