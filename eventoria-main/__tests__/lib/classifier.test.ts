import { describe, it, expect } from "vitest";
import {
  classifyQuery,
  estimateTokens,
  detectEventType,
  detectCategories,
} from "@/lib/classifier";

describe("estimateTokens", () => {
  it("estimates token count at approximately 4 characters per token", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("Hello world")).toBe(3); // 11 chars -> 3
  });
});

describe("detectEventType", () => {
  it("accurately detects wedding keywords", () => {
    expect(detectEventType("We are planning a grand shaadi in Jaipur")).toBe("wedding");
    expect(detectEventType("Need ideas for sangeet ceremony")).toBe("wedding");
  });

  it("accurately detects birthday keywords", () => {
    expect(detectEventType("My son's 5th birthday party")).toBe("birthday");
    expect(detectEventType("Sweet 16 celebration")).toBe("birthday");
  });

  it("accurately detects community gathering keywords", () => {
    expect(detectEventType("Organizing a neighbourhood festival fundraiser")).toBe("community");
    expect(detectEventType("Annual cultural charity meet")).toBe("community");
  });

  it("returns null when no event type is mentioned", () => {
    expect(detectEventType("What is the weather today?")).toBeNull();
  });
});

describe("detectCategories", () => {
  it("identifies mentioned planning categories", () => {
    const text = "We need catering and a good banquet venue, plus a photographer";
    const categories = detectCategories(text);
    expect(categories).toContain("Venue");
    expect(categories).toContain("Catering");
    expect(categories).toContain("Photography");
  });
});

describe("classifyQuery", () => {
  it("routes plan generation requests strictly to the complex tier", () => {
    const result = classifyQuery("Need a plan", true);
    expect(result.complexity).toBe("complex");
    expect(result.model).toBe("gemini-2.5-flash");
  });

  it("routes simple greetings and short questions to the simple tier", () => {
    const greeting = classifyQuery("Hello! How are you?");
    expect(greeting.complexity).toBe("simple");
    expect(greeting.model).toBe("gemini-2.5-flash-lite");

    const quickTip = classifyQuery("Tips for welcome drinks?");
    expect(quickTip.complexity).toBe("simple");
    expect(quickTip.model).toBe("gemini-2.5-flash-lite");
  });

  it("routes complex budget, vendor, or multi-day queries to complex tier", () => {
    const budgetQuery = classifyQuery("How should we optimize our budget allocation between venue and catering?");
    expect(budgetQuery.complexity).toBe("complex");
    expect(budgetQuery.model).toBe("gemini-2.5-flash");

    const vendorQuery = classifyQuery("Help negotiate vendor contracts for a 500 guest destination wedding");
    expect(budgetQuery.complexity).toBe("complex");
    expect(vendorQuery.model).toBe("gemini-2.5-flash");
  });

  it("defaults to complex tier when uncertain or ambiguous", () => {
    const ambiguous = classifyQuery("Something about flowers and colors and lights and stages and maybe a dance performance");
    expect(ambiguous.complexity).toBe("complex");
  });
});
