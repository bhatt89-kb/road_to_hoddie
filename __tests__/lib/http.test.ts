import { describe, it, expect } from "vitest";
import { readJsonBody, formatIssues } from "@/lib/http";

function jsonRequest(body: BodyInit | null, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost:3000/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });
}

describe("readJsonBody", () => {
  it("parses a valid JSON body", async () => {
    const result = await readJsonBody(jsonRequest(JSON.stringify({ hello: "world" })));
    expect(result).toEqual({ ok: true, body: { hello: "world" } });
  });

  it("parses multi-byte UTF-8 content correctly", async () => {
    const result = await readJsonBody(jsonRequest(JSON.stringify({ city: "मुंबई ₹ 🎉" })));
    expect(result).toEqual({ ok: true, body: { city: "मुंबई ₹ 🎉" } });
  });

  it("rejects malformed JSON with INVALID_JSON", async () => {
    const result = await readJsonBody(jsonRequest("{not json"));
    expect(result).toMatchObject({ ok: false, status: 400, code: "INVALID_JSON" });
  });

  it("rejects an empty body with INVALID_JSON", async () => {
    const result = await readJsonBody(jsonRequest(""));
    expect(result).toMatchObject({ ok: false, status: 400, code: "INVALID_JSON" });
  });

  it("rejects bodies larger than the limit with PAYLOAD_TOO_LARGE", async () => {
    const big = JSON.stringify({ data: "x".repeat(2048) });
    const result = await readJsonBody(jsonRequest(big), 1024);
    expect(result).toMatchObject({ ok: false, status: 413, code: "PAYLOAD_TOO_LARGE" });
  });

  it("rejects early when Content-Length declares an oversized body", async () => {
    const result = await readJsonBody(jsonRequest("{}", { "Content-Length": "999999" }), 1024);
    expect(result).toMatchObject({ ok: false, status: 413, code: "PAYLOAD_TOO_LARGE" });
  });

  it("enforces the limit on the actual bytes even if Content-Length is falsified", async () => {
    const big = JSON.stringify({ data: "x".repeat(4096) });
    const result = await readJsonBody(jsonRequest(big, { "Content-Length": "10" }), 1024);
    expect(result).toMatchObject({ ok: false, status: 413, code: "PAYLOAD_TOO_LARGE" });
  });

  it("accepts a body exactly at the limit", async () => {
    const payload = JSON.stringify({ a: "b" });
    const limit = new TextEncoder().encode(payload).byteLength;
    const result = await readJsonBody(jsonRequest(payload), limit);
    expect(result).toEqual({ ok: true, body: { a: "b" } });
  });
});

describe("formatIssues", () => {
  it("joins path and message pairs with semicolons", () => {
    expect(
      formatIssues([
        { path: ["guestCount"], message: "Too small" },
        { path: ["preferences", 0], message: "Required" },
      ])
    ).toBe("guestCount: Too small; preferences.0: Required");
  });

  it("returns an empty string when there are no issues", () => {
    expect(formatIssues([])).toBe("");
  });
});
