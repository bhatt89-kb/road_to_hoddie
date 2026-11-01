import { describe, it, expect } from "vitest";
import {
  generateFallbackPlan,
  generateEventPlan,
  askQuestion,
  streamChat,
  getModelForTier,
} from "@/lib/gemini";
import type { EventPlanRequest } from "@/types/event";
import { REQUIRED_CATEGORIES } from "@/lib/constants";

describe("getModelForTier", () => {
  it("returns configured or default models for tiers", () => {
    expect(getModelForTier("complex")).toBe("gemini-2.5-flash");
    expect(getModelForTier("simple")).toBe("gemini-2.5-flash-lite");
  });
});

describe("generateFallbackPlan", () => {
  const req: EventPlanRequest = {
    eventType: "wedding",
    guestCount: 250,
    budget: 1500000,
    date: "2026-12-10",
    city: "Mumbai",
    description: "Grand sunset wedding",
    preferences: ["Floral decor", "Live DJ"],
  };

  it("produces a structurally complete and valid plan", () => {
    const plan = generateFallbackPlan(req);
    expect(plan.summary).toContain("wedding");
    expect(plan.summary).toContain("Mumbai");
    expect(plan.eventType).toBe("wedding");
    expect(plan.budgetBreakdown.length).toBeGreaterThanOrEqual(REQUIRED_CATEGORIES.wedding.length);
    expect(plan.timeline.length).toBeGreaterThan(0);
    expect(plan.vendorChecklist.length).toBeGreaterThan(0);
    expect(plan.personalizedIdeas.length).toBeGreaterThan(0);
    expect(plan.tips.length).toBeGreaterThan(0);
  });

  it("verifies budget allocation math sums closely to 100%", () => {
    const plan = generateFallbackPlan(req);
    const totalPercent = plan.budgetBreakdown.reduce((sum, item) => sum + item.percentOfTotal, 0);
    expect(Math.round(totalPercent)).toBe(100);
  });

  it("includes all required wedding categories in the fallback plan", () => {
    const plan = generateFallbackPlan(req);
    const categoriesInPlan = plan.budgetBreakdown.map((b) => b.category);
    for (const cat of REQUIRED_CATEGORIES.wedding) {
      expect(categoriesInPlan).toContain(cat);
    }
  });
});

describe("generateEventPlan and askQuestion fallbacks when no API key configured", () => {
  it("resolves generateEventPlan without throwing even without GEMINI_API_KEY", async () => {
    const req: EventPlanRequest = {
      eventType: "birthday",
      guestCount: 30,
      budget: 50000,
      date: "2026-08-15",
      city: "Delhi",
      description: "10th Birthday party",
      preferences: ["Superhero theme"],
    };

    const res = await generateEventPlan(req);
    expect(res.plan).toBeDefined();
    expect(res.plan.eventType).toBe("birthday");
    expect(res.model).toBe("gemini-2.5-flash");
  });

  it("resolves askQuestion with a helpful answer", async () => {
    const res = await askQuestion("What is the average cake cost for 50 people?");
    expect(res.answer).toBeDefined();
    expect(res.answer.length).toBeGreaterThan(10);
    expect(res.model).toBe("gemini-2.5-flash-lite");
  });

  it("streams chat chunks as an async generator", async () => {
    const generator = streamChat([
      { id: "1", role: "user", content: "Hello", timestamp: Date.now() },
    ]);

    const collected: string[] = [];
    for await (const chunk of generator) {
      collected.push(chunk);
    }

    expect(collected.length).toBeGreaterThan(0);
    expect(collected.join("")).toContain("Eventoria");
  });
});
