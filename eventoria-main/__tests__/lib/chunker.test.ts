import { describe, it, expect } from "vitest";
import { chunkText, fitContext } from "@/lib/chunker";

describe("chunkText", () => {
  it("returns empty array for empty or whitespace text", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   ")).toEqual([]);
  });

  it("passes through text without modification if within token limit", () => {
    const text = "A short celebration description that easily fits within limits.";
    const chunks = chunkText(text, { maxTokens: 100 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it("splits by paragraph boundaries when text exceeds chunk budget", () => {
    const para1 = "Paragraph 1 is detailed and contains background about the wedding.";
    const para2 = "Paragraph 2 is about catering requirements and vegetarian options.";
    const fullText = `${para1}\n\n${para2}`;

    // Set maxTokens small enough to force paragraph split
    const chunks = chunkText(fullText, { maxTokens: 15 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toContain("Paragraph 1");
  });

  it("splits long single sentences by words if necessary", () => {
    const superLongSentence = "Word ".repeat(100).trim();
    const chunks = chunkText(superLongSentence, { maxTokens: 20 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length > 0)).toBe(true);
  });
});

describe("fitContext", () => {
  it("leaves text unchanged if already within budget", () => {
    const text = "Short context";
    expect(fitContext(text, 50)).toBe(text);
  });

  it("appends condensation notice when truncated", () => {
    const longText = "Detailed facts about celebration. ".repeat(50);
    const result = fitContext(longText, 25);
    expect(result).toContain("[Context condensed to fit token budget]");
  });
});
