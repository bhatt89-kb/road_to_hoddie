/**
 * @file lib/rate-limiter.ts
 * @module RateLimiter
 * @description Sliding-window in-memory rate limiter per IP address.
 * Sets standard X-RateLimit-* headers and enforces quotas to protect AI endpoints from abuse.
 * 
 * **PRODUCTION CONSIDERATIONS:**
 * This implementation uses in-memory storage, which is suitable for:
 * - Single-instance deployments
 * - Development and testing
 * - Small-scale applications
 * 
 * For production multi-instance deployments, consider:
 * - Redis-based rate limiting (ioredis + rate-limit-redis)
 * - Upstash Rate Limit (@upstash/ratelimit)
 * - Database-backed rate limiting (PostgreSQL, MongoDB)
 * - Edge-native rate limiting (Cloudflare Workers KV, Vercel Edge Config)
 * 
 * @see {@link https://github.com/upstash/ratelimit|Upstash Rate Limit}
 * @see {@link https://redis.io/commands/incr/|Redis INCR for rate limiting}
 * @security Critical for preventing API quota exhaustion and abuse
 */

import type { RateLimitResult } from "@/types/event";
import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from "./constants";

export type RateLimitAction = keyof typeof RATE_LIMIT_MAX_REQUESTS;

interface ClientRecord {
  timestamps: number[];
}

/** In-memory storage for sliding window requests per IP:Action */
const memoryStore = new Map<string, ClientRecord>();

/** Periodic cleanup interval (runs every 5 minutes to prevent memory buildup) */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeExpiredRecords(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of memoryStore.entries()) {
    const fresh = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
    if (fresh.length === 0) {
      memoryStore.delete(key);
    } else {
      record.timestamps = fresh;
    }
  }
}

/**
 * Resets the internal rate limit store (useful for test determinism).
 */
export function resetRateLimiter(): void {
  memoryStore.clear();
  lastCleanup = Date.now();
}

/**
 * Checks and increments the rate limit for a client IP and action.
 *
 * @param ip - Client IP identifier (or 'localhost' fallback)
 * @param action - The action type ('plan', 'chat', 'ask', 'usage')
 * @param now - Optional timestamp for deterministic testing
 * @returns RateLimitResult with allowed status, remaining quota, reset timestamp, and headers
 */
export function checkRateLimit(
  ip: string,
  action: RateLimitAction,
  now: number = Date.now()
): RateLimitResult {
  purgeExpiredRecords(now);

  const cleanIp = ip ? ip.trim() : "anonymous";
  const storeKey = `${cleanIp}:${action}`;
  const limit = RATE_LIMIT_MAX_REQUESTS[action] ?? 30;
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const record = memoryStore.get(storeKey) ?? { timestamps: [] };
  // Filter timestamps within current window
  const activeTimestamps = record.timestamps.filter((ts) => ts > windowStart);

  const oldestTimestamp = activeTimestamps[0] ?? now;
  const resetAt = oldestTimestamp + RATE_LIMIT_WINDOW_MS;
  const resetSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));

  if (activeTimestamps.length >= limit) {
    const headers: Record<string, string> = {
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      "Retry-After": String(resetSeconds),
    };

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      limit,
      headers,
    };
  }

  // Record this request
  activeTimestamps.push(now);
  record.timestamps = activeTimestamps;
  memoryStore.set(storeKey, record);

  const remaining = Math.max(0, limit - activeTimestamps.length);
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
  };

  return {
    allowed: true,
    remaining,
    resetAt,
    limit,
    headers,
  };
}

/**
 * Helper to extract IP from standard Next.js / Vercel request headers.
 * Trusts only headers set by known reverse proxies — x-forwarded-for is intentionally
 * excluded because it can be freely spoofed by the client, which would allow a malicious
 * actor to bypass rate limiting by cycling arbitrary IP strings.
 *
 * @param headers - Request headers object
 * @returns Client IP string
 *
 * @security x-forwarded-for is NOT used — it is client-spoofable on Vercel.
 *   Use x-real-ip (single trusted IP from Vercel edge) or x-vercel-forwarded-for instead.
 *
 * @see {@link https://vercel.com/docs/concepts/edge-network/headers#x-real-ip|Vercel x-real-ip}
 */
export function getClientIp(headers: Headers): string {
  // Vercel: x-real-ip is a single, trusted IP set by Vercel's edge network
  const realIp = headers.get("x-real-ip");
  if (realIp && isValidIpFormat(realIp.trim())) {
    return realIp.trim();
  }

  // Vercel alternative header
  const vercelForwarded = headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) {
    const ip = vercelForwarded.split(",")[0].trim();
    if (isValidIpFormat(ip)) return ip;
  }

  // Cloudflare
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp && isValidIpFormat(cfIp.trim())) {
    return cfIp.trim();
  }

  // x-forwarded-for is intentionally NOT used — it can be spoofed by clients
  // and could allow rate-limit bypass. On Vercel use x-real-ip or x-vercel-forwarded-for.

  return "127.0.0.1";
}

/**
 * Validates IP address format (basic check for IPv4 and IPv6).
 * Prevents header injection attacks.
 * 
 * @param ip - IP address string to validate
 * @returns True if format looks valid
 * @private
 */
function isValidIpFormat(ip: string): boolean {
  if (!ip || ip.length > 45) return false; // Max IPv6 length
  
  // IPv4: xxx.xxx.xxx.xxx
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(ip)) {
    // Validate each octet is 0-255
    const octets = ip.split('.').map(Number);
    return octets.every(octet => octet >= 0 && octet <= 255);
  }
  
  // IPv6: simplified check (full validation is complex)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Pattern.test(ip);
}
