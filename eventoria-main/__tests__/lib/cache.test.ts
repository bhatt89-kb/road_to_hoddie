/**
 * @file __tests__/lib/cache.test.ts
 * Unit tests for LRU cache implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LRUCache, planCache, askCache } from '@/lib/cache';

describe('LRUCache', () => {
  let cache: LRUCache<string, string>;

  beforeEach(() => {
    cache = new LRUCache<string, string>({
      maxSize: 3,
      ttl: 1000, // 1 second for testing
    });
  });

  describe('basic operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should check key existence with has()', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });

    it('should delete keys', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.delete('key1')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used item when maxSize is reached', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Cache is full, adding one more should evict key1
      cache.set('key4', 'value4');
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should update LRU order on access', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Access key1 to make it most recently used
      cache.get('key1');
      
      // Add key4, should evict key2 (now least recently used)
      cache.set('key4', 'value4');
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should prune expired entries', async () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const removed = cache.prune();
      expect(removed).toBe(2);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });

    it('should not prune non-expired entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const removed = cache.prune();
      expect(removed).toBe(0);
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('cache statistics', () => {
    it('should return accurate stats', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);
      expect(stats.memorySize).toBeGreaterThan(0);
    });
  });

  describe('generateKey static method', () => {
    it('should generate deterministic keys', () => {
      const key1 = LRUCache.generateKey({
        eventType: 'wedding',
        guestCount: 250,
        budget: 2000000,
        city: 'Mumbai',
        date: '2026-12-15',
        description: 'Traditional ceremony',
        preferences: ['Vegetarian', 'Outdoor venue'],
      });
      
      const key2 = LRUCache.generateKey({
        eventType: 'wedding',
        guestCount: 250,
        budget: 2000000,
        city: 'Mumbai',
        date: '2026-12-15',
        description: 'Traditional ceremony',
        preferences: ['Vegetarian', 'Outdoor venue'],
      });
      
      expect(key1).toBe(key2);
    });

    it('should include all relevant fields in the key', () => {
      const baseParams = {
        eventType: 'wedding',
        guestCount: 250,
        budget: 2000000,
        city: 'Mumbai',
        date: '2026-12-15',
        description: 'Traditional ceremony',
        preferences: ['Vegetarian'],
      };

      const baseKey = LRUCache.generateKey(baseParams);
      
      // Different event type should produce different key
      const differentType = LRUCache.generateKey({ ...baseParams, eventType: 'birthday' });
      expect(differentType).not.toBe(baseKey);
      
      // Different guest count should produce different key
      const differentGuests = LRUCache.generateKey({ ...baseParams, guestCount: 300 });
      expect(differentGuests).not.toBe(baseKey);
      
      // Different budget should produce different key
      const differentBudget = LRUCache.generateKey({ ...baseParams, budget: 3000000 });
      expect(differentBudget).not.toBe(baseKey);
      
      // Different city should produce different key
      const differentCity = LRUCache.generateKey({ ...baseParams, city: 'Delhi' });
      expect(differentCity).not.toBe(baseKey);
      
      // Different date should produce different key (CRITICAL FIX)
      const differentDate = LRUCache.generateKey({ ...baseParams, date: '2027-01-15' });
      expect(differentDate).not.toBe(baseKey);
      
      // Different description should produce different key (CRITICAL FIX)
      const differentDesc = LRUCache.generateKey({ ...baseParams, description: 'Modern minimalist ceremony' });
      expect(differentDesc).not.toBe(baseKey);
      
      // Different preferences should produce different key (CRITICAL FIX)
      const differentPrefs = LRUCache.generateKey({ ...baseParams, preferences: ['Non-vegetarian', 'Indoor venue'] });
      expect(differentPrefs).not.toBe(baseKey);
    });

    it('should handle missing parameters gracefully', () => {
      const key = LRUCache.generateKey({});
      expect(key).toBe('unknown:0:0:unknown:unknown:1wh3k0u'); // Hash of empty strings
    });
    
    it('should normalize inputs for consistent cache keys', () => {
      // Case insensitive
      const key1 = LRUCache.generateKey({
        eventType: 'Wedding',
        city: 'MUMBAI',
        description: 'Traditional Ceremony',
        preferences: ['Vegetarian'],
      });
      
      const key2 = LRUCache.generateKey({
        eventType: 'wedding',
        city: 'mumbai',
        description: 'traditional ceremony',
        preferences: ['vegetarian'],
      });
      
      expect(key1).toBe(key2);
    });
    
    it('should be order-independent for preferences', () => {
      const key1 = LRUCache.generateKey({
        eventType: 'wedding',
        preferences: ['Vegetarian', 'Outdoor', 'Live music'],
      });
      
      const key2 = LRUCache.generateKey({
        eventType: 'wedding',
        preferences: ['Live music', 'Outdoor', 'Vegetarian'], // Different order
      });
      
      expect(key1).toBe(key2);
    });
    
    it('should prevent privacy leak - different descriptions get different caches', () => {
      // Critical privacy test: User A wants vegan, User B wants non-veg
      // They should NOT get the same cached plan
      
      const userA = LRUCache.generateKey({
        eventType: 'wedding',
        guestCount: 250,
        budget: 2000000,
        city: 'Mumbai',
        date: '2026-12-15',
        description: 'Vegan wedding ceremony',
        preferences: ['Vegan catering required'],
      });
      
      const userB = LRUCache.generateKey({
        eventType: 'wedding',
        guestCount: 250,
        budget: 2000000,
        city: 'Mumbai',
        date: '2026-12-15',
        description: 'Traditional wedding ceremony',
        preferences: ['Non-vegetarian catering'],
      });
      
      expect(userA).not.toBe(userB);
    });
    
    it('should prevent cache collision - different dates get different caches', () => {
      // Critical correctness test: Same event but different dates
      // Timeline milestones depend on the event date
      
      const summerWedding = LRUCache.generateKey({
        eventType: 'wedding',
        guestCount: 250,
        budget: 2000000,
        city: 'Mumbai',
        date: '2026-06-15', // Summer
        description: 'Beach wedding',
        preferences: ['Outdoor'],
      });
      
      const winterWedding = LRUCache.generateKey({
        eventType: 'wedding',
        guestCount: 250,
        budget: 2000000,
        city: 'Mumbai',
        date: '2026-12-15', // Winter
        description: 'Beach wedding',
        preferences: ['Outdoor'],
      });
      
      expect(summerWedding).not.toBe(winterWedding);
    });
  });

  describe('memory management', () => {
    it('should enforce maxMemorySize limit', () => {
      const memCache = new LRUCache<string, string>({
        maxSize: 100,
        ttl: 60000,
        maxMemorySize: 100, // Very small limit
      });

      const largeValue = 'x'.repeat(1000);
      memCache.set('key1', largeValue);
      
      const stats = memCache.getStats();
      expect(stats.size).toBeLessThanOrEqual(1);
    });
  });
});

describe('Singleton cache instances', () => {
  it('should have planCache configured correctly', () => {
    const stats = planCache.getStats();
    expect(stats.maxSize).toBe(50);
  });

  it('should have askCache configured correctly', () => {
    const stats = askCache.getStats();
    expect(stats.maxSize).toBe(200);
  });
});
