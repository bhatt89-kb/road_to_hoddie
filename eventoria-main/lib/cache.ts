/**
 * @file lib/cache.ts
 * @module Cache
 * @description In-memory LRU (Least Recently Used) cache implementation for AI responses
 * and computed values. Improves efficiency by avoiding redundant API calls and calculations.
 * 
 * @performance Reduces API costs and improves response times for repeated queries
 * @see {@link https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU)|LRU Cache}
 */

/**
 * Cache entry with value and timestamp for TTL (Time To Live) management.
 * 
 * @template T
 * @interface CacheEntry
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  size: number;
}

/**
 * Configuration options for the LRU cache.
 * 
 * @interface CacheOptions
 */
interface CacheOptions {
  /** Maximum number of entries to store */
  maxSize: number;
  /** Time to live in milliseconds (default: 15 minutes) */
  ttl: number;
  /** Maximum memory size in bytes (optional) */
  maxMemorySize?: number;
}

/**
 * Simple hash function for cache keys.
 * Uses DJB2 algorithm for fast, deterministic hashing.
 * 
 * @param {string} str - String to hash
 * @returns {string} Hash as hex string
 * @private
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
  }
  // Convert to unsigned 32-bit and return as hex
  return (hash >>> 0).toString(36);
}

/**
 * Generic LRU Cache implementation with TTL support.
 * Thread-safe for server-side usage in API routes.
 * 
 * @template K Key type
 * @template V Value type
 * 
 * @example
 * const cache = new LRUCache<string, EventPlan>({ maxSize: 100, ttl: 900000 });
 * cache.set('wedding-250-20L', planData);
 * const cached = cache.get('wedding-250-20L');
 * 
 * @performance O(1) get and set operations
 */
export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private readonly maxSize: number;
  private readonly ttl: number;
  private readonly maxMemorySize?: number;
  private currentMemorySize: number = 0;

  /**
   * Creates a new LRU cache instance.
   * 
   * @param {CacheOptions} options - Cache configuration
   */
  constructor(options: CacheOptions) {
    this.cache = new Map();
    this.maxSize = options.maxSize;
    this.ttl = options.ttl;
    this.maxMemorySize = options.maxMemorySize;
  }

  /**
   * Generates a cache key from event planning parameters.
   * 
   * **IMPORTANT:** The cache key MUST include ALL fields that materially affect
   * the generated plan. Otherwise, different users will receive inappropriate
   * cached results.
   * 
   * Included fields:
   * - eventType: Different types have different categories (wedding vs birthday)
   * - guestCount: Affects capacity planning and vendor requirements
   * - budget: Determines cost allocations across categories
   * - city: Influences vendor availability and cultural context
   * - date: Affects booking timeline and seasonal considerations
   * - description: Core requirements that shape the plan (e.g., "vegan catering")
   * - preferences: Specific user requirements (e.g., dietary restrictions)
   * 
   * @param {object} params - Event parameters
   * @returns {string} Deterministic cache key
   * 
   * @example
   * generateKey({ 
   *   eventType: 'wedding', 
   *   guestCount: 250, 
   *   budget: 2000000,
   *   city: 'Mumbai',
   *   date: '2026-12-15',
   *   description: 'Traditional ceremony',
   *   preferences: ['Vegetarian']
   * })
   * // Returns "wedding:250:2000000:mumbai:2026-12-15:hash_of_desc_and_prefs"
   * 
   * @security Prevents cache pollution where different users get wrong plans
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
    // Normalize inputs for consistent cache keys
    const eventType = (params.eventType || 'unknown').toLowerCase();
    const guestCount = params.guestCount || 0;
    const budget = params.budget || 0;
    const city = (params.city || 'unknown').toLowerCase().trim();
    const date = params.date || 'unknown';
    
    // Create a stable hash for description and preferences
    // These can be long, so we hash them to keep cache keys reasonable
    const description = (params.description || '').toLowerCase().trim();
    const preferences = (params.preferences || [])
      .map(p => p.toLowerCase().trim())
      .sort() // Sort for determinism
      .join('|');
    
    // Combine description and preferences for hashing
    const textContent = `${description}::${preferences}`;
    const contentHash = simpleHash(textContent);
    
    // Build cache key with all relevant fields
    return `${eventType}:${guestCount}:${budget}:${city}:${date}:${contentHash}`;
  }

  /**
   * Retrieves a value from the cache if it exists and hasn't expired.
   * Updates the entry's position (LRU behavior).
   * 
   * @param {K} key - Cache key
   * @returns {V | undefined} Cached value or undefined if not found/expired
   * 
   * @performance O(1) average case
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.currentMemorySize -= entry.size;
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Stores a value in the cache with TTL.
   * Evicts least recently used entries if cache is full.
   * 
   * @param {K} key - Cache key
   * @param {V} value - Value to cache
   * 
   * @performance O(1) average case
   */
  set(key: K, value: V): void {
    const now = Date.now();
    
    // Estimate size (rough approximation)
    const size = this.estimateSize(value);

    // Remove existing entry if present
    const existing = this.cache.get(key);
    if (existing) {
      this.currentMemorySize -= existing.size;
      this.cache.delete(key);
    }

    // Evict entries if we're at capacity
    while (this.cache.size >= this.maxSize || 
           (this.maxMemorySize && this.currentMemorySize + size > this.maxMemorySize)) {
      const firstKey = this.cache.keys().next().value;
      const firstEntry = this.cache.get(firstKey);
      if (firstEntry) {
        this.currentMemorySize -= firstEntry.size;
      }
      this.cache.delete(firstKey);
    }

    // Add new entry
    this.cache.set(key, { value, timestamp: now, size });
    this.currentMemorySize += size;
  }

  /**
   * Checks if a key exists and hasn't expired.
   * 
   * @param {K} key - Cache key
   * @returns {boolean} True if key exists and is valid
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Removes a specific entry from the cache.
   * 
   * @param {K} key - Cache key to remove
   * @returns {boolean} True if entry was removed
   */
  delete(key: K): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentMemorySize -= entry.size;
    }
    return this.cache.delete(key);
  }

  /**
   * Clears all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
    this.currentMemorySize = 0;
  }

  /**
   * Removes all expired entries from the cache.
   * Should be called periodically to free memory.
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
   * Gets cache statistics for monitoring.
   * 
   * @returns {object} Cache statistics
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
   * Rough approximation for JavaScript objects.
   * 
   * @private
   * @param {V} value - Value to estimate
   * @returns {number} Estimated size in bytes
   */
  private estimateSize(value: V): number {
    try {
      return JSON.stringify(value).length * 2; // UTF-16 characters
    } catch {
      return 1024; // Default 1KB for non-serializable objects
    }
  }
}

/**
 * Singleton cache instance for event plans.
 * Caches full event plan responses to avoid redundant AI calls.
 * 
 * @constant
 * @type {LRUCache<string, any>}
 */
export const planCache = new LRUCache<string, any>({
  maxSize: 50, // Store up to 50 plans
  ttl: 15 * 60 * 1000, // 15 minutes
  maxMemorySize: 10 * 1024 * 1024, // 10MB
});

/**
 * Cache instance for quick ask responses.
 * Higher capacity due to smaller response sizes.
 * 
 * @constant
 * @type {LRUCache<string, string>}
 */
export const askCache = new LRUCache<string, string>({
  maxSize: 200, // Store up to 200 Q&A pairs
  ttl: 30 * 60 * 1000, // 30 minutes (longer TTL for static answers)
  maxMemorySize: 5 * 1024 * 1024, // 5MB
});

/**
 * Periodic cache pruning to remove expired entries.
 * Runs every 5 minutes to keep memory usage optimal.
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const planRemoved = planCache.prune();
    const askRemoved = askCache.prune();
    
    if (process.env.NODE_ENV === 'development' && (planRemoved > 0 || askRemoved > 0)) {
      console.log(`[Cache] Pruned ${planRemoved} plan entries and ${askRemoved} ask entries`);
    }
  }, 5 * 60 * 1000);
}
