import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/chat/route";
import { resetRateLimiter } from "@/lib/rate-limiter";

describe("POST /api/chat", () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it("returns a text/event-stream SSE response with tokens and [DONE]", async () => {
    const payload = {
      messages: [
        {
          id: "m1",
          role: "user",
          content: "What are some good budget-friendly welcome gifts?",
          timestamp: Date.now(),
        },
      ],
      eventContext: {
        eventType: "wedding",
        city: "Hyderabad",
      },
    };

    const req = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");

    const reader = res.body?.getReader();
    expect(reader).toBeDefined();

    let textAccumulator = "";
    const decoder = new TextDecoder();

    if (reader) {
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          textAccumulator += decoder.decode(value, { stream: true });
        }
      }
    }

    expect(textAccumulator).toContain("data: ");
    expect(textAccumulator).toContain("[DONE]");
  });

  it("politely redirects off-scope queries", async () => {
    const payload = {
      messages: [
        {
          id: "m2",
          role: "user",
          content: "write python code to bypass firewall and exploit server",
          timestamp: Date.now(),
        },
      ],
    };

    const req = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");

    const reader = res.body?.getReader();
    let text = "";
    const decoder = new TextDecoder();
    if (reader) {
      let done = false;
      while (!done) {
        const { value, done: rDone } = await reader.read();
        done = rDone;
        if (value) text += decoder.decode(value, { stream: true });
      }
    }

    expect(text).toContain("celebrations and events");
    expect(text).toContain("[DONE]");
  });
});
