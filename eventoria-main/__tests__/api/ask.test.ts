import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/ask/route";
import { resetRateLimiter } from "@/lib/rate-limiter";

describe("POST /api/ask", () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it("returns concise answer and simple model tier", async () => {
    const payload = {
      question: "What is the typical advance deposit required by wedding venues?",
      eventContext: {
        eventType: "wedding",
        city: "Chennai",
      },
    };

    const req = new Request("http://localhost:3000/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.answer).toBeDefined();
    expect(data.answer.length).toBeGreaterThan(10);
    expect(data.model).toBe("gemini-2.5-flash-lite");
  });

  it("politely redirects off-topic questions", async () => {
    const payload = {
      question: "write python code for trading bot",
    };

    const req = new Request("http://localhost:3000/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.answer).toContain("celebrations and events");
  });
});
