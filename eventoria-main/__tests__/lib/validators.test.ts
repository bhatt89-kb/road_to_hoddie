import { describe, it, expect } from "vitest";
import {
  eventPlanRequestSchema,
  eventPlanSchema,
  chatRequestSchema,
  askRequestSchema,
} from "@/lib/validators";

describe("eventPlanRequestSchema", () => {
  const validRequest = {
    eventType: "wedding",
    guestCount: 200,
    budget: 1500000,
    date: "2026-11-20",
    city: "Bengaluru",
    description: "Traditional South Indian wedding celebration.",
    preferences: ["Vegetarian food", "Live classical music"],
  };

  it("passes validation with valid data", () => {
    const result = eventPlanRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it("rejects invalid event types", () => {
    const invalid = { ...validRequest, eventType: "corporate" };
    const result = eventPlanRequestSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects guest counts outside allowed limits", () => {
    expect(eventPlanRequestSchema.safeParse({ ...validRequest, guestCount: 0 }).success).toBe(false);
    expect(eventPlanRequestSchema.safeParse({ ...validRequest, guestCount: 50000 }).success).toBe(false);
  });

  it("rejects budgets below minimum or above maximum", () => {
    expect(eventPlanRequestSchema.safeParse({ ...validRequest, budget: 100 }).success).toBe(false);
    expect(eventPlanRequestSchema.safeParse({ ...validRequest, budget: 1000000000 }).success).toBe(false);
  });

  it("rejects unknown extra fields due to strict mode", () => {
    const withExtra = { ...validRequest, unauthorizedField: "malicious_payload" };
    const result = eventPlanRequestSchema.safeParse(withExtra);
    expect(result.success).toBe(false);
  });

  it("rejects invalid date strings", () => {
    const invalidDate = { ...validRequest, date: "not-a-real-date" };
    const result = eventPlanRequestSchema.safeParse(invalidDate);
    expect(result.success).toBe(false);
  });
});

describe("eventPlanSchema", () => {
  const validPlan = {
    summary: "A beautiful wedding plan.",
    eventType: "wedding",
    budgetBreakdown: [
      {
        category: "Venue",
        estimatedCost: 500000,
        percentOfTotal: 33.3,
        notes: "Main hall",
        priority: "essential",
        savingTips: ["Book off-season"],
      },
    ],
    timeline: [
      {
        title: "Book Venue",
        description: "Visit shortlisted venues",
        phase: "Initial Planning",
        daysBeforeEvent: 90,
        category: "Venue",
        priority: "high",
      },
    ],
    vendorChecklist: [
      {
        category: "Venue",
        priorityTier: "must-have",
        itemsToBook: ["Banquet"],
        questionsToAsk: ["Overtime rates?"],
        contractChecks: ["Cancellation policy"],
        tips: ["Verify power backup"],
        estimateLowPercent: 30,
        estimateHighPercent: 40,
        bookByDaysBefore: 90,
      },
    ],
    personalizedIdeas: [
      {
        title: "Welcome drinks",
        description: "Fresh coconut water on arrival",
        category: "Hospitality",
        tier: "standard",
        estimatedCost: 15000,
      },
    ],
    tips: ["Hire a day-of coordinator"],
  };

  it("accepts a fully compliant EventPlan object", () => {
    const result = eventPlanSchema.safeParse(validPlan);
    expect(result.success).toBe(true);
  });

  it("rejects plans with empty breakdowns", () => {
    const emptyBreakdown = { ...validPlan, budgetBreakdown: [] };
    const result = eventPlanSchema.safeParse(emptyBreakdown);
    expect(result.success).toBe(false);
  });
});

describe("chatRequestSchema and askRequestSchema", () => {
  it("validates chat history messages", () => {
    const validChat = {
      messages: [
        {
          id: "msg-1",
          role: "user",
          content: "What flowers are in season in November?",
          timestamp: Date.now(),
        },
      ],
    };
    expect(chatRequestSchema.safeParse(validChat).success).toBe(true);
  });

  it("rejects empty chat messages", () => {
    const empty = { messages: [] };
    expect(chatRequestSchema.safeParse(empty).success).toBe(false);
  });

  it("validates quick ask questions", () => {
    expect(askRequestSchema.safeParse({ question: "How much for cake?" }).success).toBe(true);
    expect(askRequestSchema.safeParse({ question: "   " }).success).toBe(false);
  });
});
