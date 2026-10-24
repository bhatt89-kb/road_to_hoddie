import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/usage/route";
import { resetRateLimiter } from "@/lib/rate-limiter";

describe("GET /api/usage", () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it("returns 200 OK with remaining quota and reset timestamp", async () => {
    const req = new Request("http://localhost:3000/api/usage", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.remaining).toBeDefined();
    expect(data.limit).toBeDefined();
    expect(data.resetAt).toBeDefined();
  });
});
