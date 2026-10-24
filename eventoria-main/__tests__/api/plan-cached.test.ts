/**
 * @file __tests__/api/plan-cached.test.ts
 * Integration tests for /api/plan caching behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { planCache } from '@/lib/cache';

describe('POST /api/plan - Caching', () => {
  beforeEach(() => {
    planCache.clear();
  });

  it('should return cache miss on first request', async () => {
    const response = await fetch('http://localhost:3000/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'wedding',
        guestCount: 250,
        budget: 2000000,
        date: '2026-12-15',
        city: 'Mumbai',
        description: 'Test wedding',
      }),
    });

    expect(response.headers.get('X-Cache-Status')).toBe('MISS');
    
    const data = await response.json();
    expect(data.cached).toBe(false);
    expect(data.plan).toBeDefined();
  });

  it('should return cache hit on duplicate request', async () => {
    const requestBody = {
      eventType: 'wedding',
      guestCount: 250,
      budget: 2000000,
      date: '2026-12-15',
      city: 'Mumbai',
      description: 'Test wedding',
    };

    // First request
    await fetch('http://localhost:3000/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    // Second request (should hit cache)
    const response2 = await fetch('http://localhost:3000/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    expect(response2.headers.get('X-Cache-Status')).toBe('HIT');
    
    const data2 = await response2.json();
    expect(data2.cached).toBe(true);
  });

  it('should cache by key parameters only', async () => {
    // Two requests with different descriptions but same key params
    const request1 = {
      eventType: 'wedding',
      guestCount: 250,
      budget: 2000000,
      date: '2026-12-15',
      city: 'Mumbai',
      description: 'Description 1',
    };

    const request2 = {
      ...request1,
      description: 'Description 2', // Different description
      date: '2026-12-20', // Different date (not in cache key)
    };

    await fetch('http://localhost:3000/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request1),
    });

    const response2 = await fetch('http://localhost:3000/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request2),
    });

    // Should hit cache since key params are the same
    expect(response2.headers.get('X-Cache-Status')).toBe('HIT');
  });
});
