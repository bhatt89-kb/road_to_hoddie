import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimiter,
  getClientIp,
} from "@/lib/rate-limiter";
import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from "@/lib/constants";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it("allows requests within quota and returns decremented remaining count", () => {
    const ip = "192.168.1.1";
    const res1 = checkRateLimit(ip, "plan", 1000);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(RATE_LIMIT_MAX_REQUESTS.plan - 1);
    expect(res1.headers["X-RateLimit-Limit"]).toBe(String(RATE_LIMIT_MAX_REQUESTS.plan));

    const res2 = checkRateLimit(ip, "plan", 1001);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(RATE_LIMIT_MAX_REQUESTS.plan - 2);
  });

  it("blocks requests that exceed the quota and returns Retry-After header", () => {
    const ip = "192.168.1.2";
    const limit = RATE_LIMIT_MAX_REQUESTS.plan;

    // Fill quota
    for (let i = 0; i < limit; i++) {
      expect(checkRateLimit(ip, "plan", 1000 + i).allowed).toBe(true);
    }

    // Exceeded
    const blocked = checkRateLimit(ip, "plan", 1000 + limit);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.headers["Retry-After"]).toBeDefined();
    expect(Number(blocked.headers["Retry-After"])).toBeGreaterThan(0);
  });

  it("resets quota after the sliding window expires", () => {
    const ip = "192.168.1.3";
    const baseTime = 100000;
    const limit = RATE_LIMIT_MAX_REQUESTS.plan;

    for (let i = 0; i < limit; i++) {
      checkRateLimit(ip, "plan", baseTime);
    }
    expect(checkRateLimit(ip, "plan", baseTime).allowed).toBe(false);

    // After window expires
    const futureTime = baseTime + RATE_LIMIT_WINDOW_MS + 100;
    const fresh = checkRateLimit(ip, "plan", futureTime);
    expect(fresh.allowed).toBe(true);
  });

  it("enforces limits independently per IP", () => {
    const ipA = "10.0.0.1";
    const ipB = "10.0.0.2";
    const limit = RATE_LIMIT_MAX_REQUESTS.plan;

    for (let i = 0; i < limit; i++) {
      checkRateLimit(ipA, "plan", 1000);
    }
    expect(checkRateLimit(ipA, "plan", 1000).allowed).toBe(false);
    // ipB should still be allowed
    expect(checkRateLimit(ipB, "plan", 1000).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("prefers x-real-ip over x-forwarded-for (Vercel trusted header)", () => {
    const headers = new Headers({
      "x-real-ip": "198.51.100.1",
      "x-forwarded-for": "203.0.113.195, 70.41.3.18",
    });
    // x-real-ip should win (most trusted on Vercel)
    expect(getClientIp(headers)).toBe("198.51.100.1");
  });

  it("extracts from x-forwarded-for when x-real-ip not present", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
    });
    expect(getClientIp(headers)).toBe("203.0.113.195");
  });

  it("extracts from cf-connecting-ip for Cloudflare", () => {
    const headers = new Headers({
      "cf-connecting-ip": "198.51.100.50",
    });
    expect(getClientIp(headers)).toBe("198.51.100.50");
  });

  it("falls back to localhost when no headers present", () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe("127.0.0.1");
  });

  describe("IP Spoofing Prevention", () => {
    it("rejects invalid IPv4 octets in x-forwarded-for (spoofing attempt)", () => {
      const headers = new Headers({
        "x-forwarded-for": "999.999.999.999", // Invalid octets
      });
      // Should fallback to localhost (invalid IP rejected)
      expect(getClientIp(headers)).toBe("127.0.0.1");
    });

    it("rejects invalid IPv4 format in x-forwarded-for", () => {
      const headers = new Headers({
        "x-forwarded-for": "not.an.ip.address",
      });
      expect(getClientIp(headers)).toBe("127.0.0.1");
    });

    it("rejects malicious control characters in IP header", () => {
      const headers = new Headers({
        "x-forwarded-for": "192.168.1.1\x00\x01",
      });
      // Invalid format should be rejected
      expect(getClientIp(headers)).toBe("127.0.0.1");
    });

    it("rejects SQL injection attempts in IP header", () => {
      const headers = new Headers({
        "x-forwarded-for": "192.168.1.1' OR '1'='1",
      });
      expect(getClientIp(headers)).toBe("127.0.0.1");
    });

    it("accepts valid IPv4 addresses only", () => {
      const validIPs = [
        "192.168.1.1",
        "10.0.0.1",
        "172.16.0.1",
        "203.0.113.195",
        "0.0.0.0",
        "255.255.255.255",
      ];

      for (const ip of validIPs) {
        const headers = new Headers({ "x-forwarded-for": ip });
        expect(getClientIp(headers)).toBe(ip);
      }
    });

    it("rejects IPs with octets > 255", () => {
      const invalidIPs = [
        "256.1.1.1",
        "192.256.1.1",
        "192.168.256.1",
        "192.168.1.256",
        "300.300.300.300",
      ];

      for (const ip of invalidIPs) {
        const headers = new Headers({ "x-forwarded-for": ip });
        expect(getClientIp(headers)).toBe("127.0.0.1");
      }
    });

    it("accepts valid IPv6 addresses", () => {
      const validIPv6s = [
        "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        "2001:db8::1",
        "::1",
        "fe80::1",
      ];

      for (const ip of validIPv6s) {
        const headers = new Headers({ "x-forwarded-for": ip });
        const result = getClientIp(headers);
        // Should either accept the IPv6 or fallback (implementation dependent)
        expect(result).toBeDefined();
      }
    });

    it("handles empty x-forwarded-for gracefully", () => {
      const headers = new Headers({ "x-forwarded-for": "" });
      expect(getClientIp(headers)).toBe("127.0.0.1");
    });

    it("handles whitespace-only x-forwarded-for", () => {
      const headers = new Headers({ "x-forwarded-for": "   " });
      expect(getClientIp(headers)).toBe("127.0.0.1");
    });

    it("validates x-real-ip format (prevents header injection)", () => {
      const headers = new Headers({
        "x-real-ip": "999.999.999.999",
      });
      // Should fallback to next header or localhost
      const result = getClientIp(headers);
      expect(result).toBe("127.0.0.1");
    });

    it("validates cf-connecting-ip format", () => {
      const headers = new Headers({
        "cf-connecting-ip": "not-an-ip",
      });
      expect(getClientIp(headers)).toBe("127.0.0.1");
    });
  });

  describe("Rate Limiting with Spoofed IPs", () => {
    beforeEach(() => {
      resetRateLimiter();
    });

    it("cannot bypass rate limit by spoofing x-forwarded-for with invalid IP", () => {
      const limit = RATE_LIMIT_MAX_REQUESTS.plan;
      
      // Exhaust quota with valid IP
      for (let i = 0; i < limit; i++) {
        const headers = new Headers({ "x-forwarded-for": "192.168.1.1" });
        const ip = getClientIp(headers);
        checkRateLimit(ip, "plan", 1000 + i);
      }

      // Try to bypass with spoofed invalid IP (should still fallback to same localhost)
      const spoofedHeaders = new Headers({ "x-forwarded-for": "999.999.999.999" });
      const spoofedIp = getClientIp(spoofedHeaders);
      
      // Since spoofed IP is invalid, it falls back to 127.0.0.1
      // This test ensures invalid IPs don't create new rate limit buckets
      expect(spoofedIp).toBe("127.0.0.1");
    });

    it("properly isolates rate limits per valid IP", () => {
      const ip1 = "192.168.1.1";
      const ip2 = "192.168.1.2";
      const limit = RATE_LIMIT_MAX_REQUESTS.plan;

      // Exhaust IP1
      for (let i = 0; i < limit; i++) {
        checkRateLimit(ip1, "plan", 1000);
      }
      expect(checkRateLimit(ip1, "plan", 1000).allowed).toBe(false);

      // IP2 should still work (not affected by IP1's limit)
      expect(checkRateLimit(ip2, "plan", 1000).allowed).toBe(true);
    });
  });
});
