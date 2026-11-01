/**
 * @file __tests__/performance/benchmarks.test.ts
 * Performance benchmark tests for critical paths
 */

import { describe, it, expect } from 'vitest';
import { startTimer, measureAsync } from '@/lib/performance';
import { sanitizeInput, checkPlanningScope } from '@/lib/guardrails';
import { eventPlanRequestSchema } from '@/lib/validators';
import { classifyQuery } from '@/lib/classifier';
import { LRUCache } from '@/lib/cache';

describe('Performance Benchmarks', () => {
  describe('Input Validation Performance', () => {
    it('should validate event plan request in < 5ms', () => {
      const timer = startTimer();
      
      const validRequest = {
        eventType: 'wedding',
        guestCount: 250,
        budget: 2000000,
        date: '2026-12-15',
        city: 'Mumbai',
        description: 'Traditional wedding ceremony',
        preferences: ['Vegetarian menu', 'Outdoor venue'],
      };

      eventPlanRequestSchema.parse(validRequest);
      
      const duration = timer.end();
      expect(duration).toBeLessThan(5);
    });

    it('should sanitize input in < 1ms for typical inputs', () => {
      const input = 'Plan my wedding with 250 guests in Mumbai with a budget of 20 lakhs';
      const timer = startTimer();
      
      sanitizeInput(input);
      
      const duration = timer.end();
      expect(duration).toBeLessThan(1);
    });

    it('should check planning scope in < 2ms', () => {
      const timer = startTimer();
      
      checkPlanningScope('How do I plan my wedding budget?');
      
      const duration = timer.end();
      expect(duration).toBeLessThan(2);
    });
  });

  describe('Classification Performance', () => {
    it('should classify query in < 3ms', () => {
      const timer = startTimer();
      
      classifyQuery('Plan detailed wedding with 500 guests', true);
      
      const duration = timer.end();
      expect(duration).toBeLessThan(3);
    });

    it('should handle 100 classifications in < 200ms', () => {
      const queries = Array.from({ length: 100 }, (_, i) => 
        `Wedding planning query number ${i}`
      );

      const timer = startTimer();
      
      queries.forEach(query => classifyQuery(query, true));
      
      const duration = timer.end();
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Cache Performance', () => {
    it('should perform cache get in < 1ms', () => {
      const cache = new LRUCache<string, string>({ maxSize: 100, ttl: 60000 });
      cache.set('test', 'value');

      const timer = startTimer();
      cache.get('test');
      const duration = timer.end();

      expect(duration).toBeLessThan(1);
    });

    it('should perform cache set in < 1ms', () => {
      const cache = new LRUCache<string, string>({ maxSize: 100, ttl: 60000 });

      const timer = startTimer();
      cache.set('test', 'value');
      const duration = timer.end();

      expect(duration).toBeLessThan(1);
    });

    it('should handle 1000 cache operations in < 50ms', () => {
      const cache = new LRUCache<string, number>({ maxSize: 100, ttl: 60000 });

      const timer = startTimer();
      
      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i}`, i);
        cache.get(`key${i}`);
      }
      
      const duration = timer.end();
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with repeated cache operations', () => {
      const cache = new LRUCache<string, string>({ maxSize: 50, ttl: 60000 });
      
      const initialStats = cache.getStats();
      
      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      const finalStats = cache.getStats();
      
      // Cache should not exceed maxSize
      expect(finalStats.size).toBeLessThanOrEqual(50);
    });
  });

  describe('Async Performance Measurement', () => {
    it('should measure async operations accurately', async () => {
      const mockAsync = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'result';
      };

      const result = await measureAsync('test', mockAsync);
      
      expect(result).toBe('result');
    });

    it('should have minimal overhead (< 1ms)', async () => {
      const instantFn = async () => 'instant';
      
      const timer = startTimer();
      await measureAsync('test', instantFn);
      const duration = timer.end();

      // measureAsync overhead should be < 1ms
      expect(duration).toBeLessThan(1);
    });
  });

  describe('Large Payload Handling', () => {
    it('should handle large descriptions efficiently', () => {
      const largeDescription = 'A'.repeat(2000); // Max allowed length
      
      const timer = startTimer();
      
      const validation = eventPlanRequestSchema.safeParse({
        eventType: 'wedding',
        guestCount: 250,
        budget: 2000000,
        date: '2026-12-15',
        city: 'Mumbai',
        description: largeDescription,
      });
      
      const duration = timer.end();
      
      expect(validation.success).toBe(true);
      expect(duration).toBeLessThan(10);
    });

    it('should sanitize large inputs efficiently', () => {
      const largeInput = 'Test content. '.repeat(200); // ~2600 characters
      
      const timer = startTimer();
      sanitizeInput(largeInput);
      const duration = timer.end();

      expect(duration).toBeLessThan(5);
    });
  });
});

describe('Load Testing Scenarios', () => {
  it('should handle rapid sequential validations', () => {
    const requests = Array.from({ length: 100 }, (_, i) => ({
      eventType: 'wedding' as const,
      guestCount: 100 + i,
      budget: 1000000 + i * 10000,
      date: '2026-12-15',
      city: 'Mumbai',
      description: `Wedding ${i}`,
    }));

    const timer = startTimer();
    
    requests.forEach(req => {
      eventPlanRequestSchema.parse(req);
    });
    
    const duration = timer.end();
    
    // 100 validations should complete in < 100ms (1ms per validation)
    expect(duration).toBeLessThan(100);
  });

  it('should maintain performance under cache pressure', () => {
    const cache = new LRUCache<string, any>({ maxSize: 50, ttl: 60000 });
    
    const timer = startTimer();
    
    // Simulate cache thrashing
    for (let i = 0; i < 500; i++) {
      cache.set(`key${i}`, { data: `value${i}` });
      if (i % 5 === 0) {
        cache.get(`key${i - 5}`);
      }
    }
    
    const duration = timer.end();
    
    // Should complete in < 100ms despite evictions
    expect(duration).toBeLessThan(100);
  });
});
