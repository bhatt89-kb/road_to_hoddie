import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/plan/route";
import { resetRateLimiter } from "@/lib/rate-limiter";

describe("POST /api/plan", () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  const validPayload = {
    eventType: "wedding",
    guestCount: 150,
    budget: 1000000,
    date: "2026-11-25",
    city: "Jaipur",
    description: "Royal destination wedding celebration.",
    preferences: ["Vegetarian", "Royal decor"],
  };

  it("successfully generates an event plan with 200 OK", async () => {
    const req = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.plan).toBeDefined();
    expect(data.plan.eventType).toBe("wedding");
    expect(data.plan.budgetBreakdown.length).toBeGreaterThan(0);
    expect(data.classification).toBeDefined();
    expect(data.model).toBeDefined();
  });

  it("returns 400 Bad Request on invalid JSON", async () => {
    const req = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("INVALID_JSON");
  });

  it("returns 400 Bad Request on validation failure (missing required fields)", async () => {
    const invalidPayload = {
      eventType: "invalid-type",
      guestCount: -5,
    };

    const req = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });
});
