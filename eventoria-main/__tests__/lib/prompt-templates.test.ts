import { describe, it, expect } from "vitest";
import {
  BASE_SYSTEM_RULES,
  PLAN_SYSTEM_PROMPT_V1,
  CHAT_SYSTEM_PROMPT_V1,
  buildPlanPrompt,
  buildEventContextPreface,
} from "@/lib/prompt-templates";
import { REQUIRED_CATEGORIES } from "@/lib/constants";
import type { EventPlanRequest } from "@/types/event";

describe("prompt-templates rules and prohibitions", () => {
  it("explicitly forbids inventing fake vendor names and fake contact details", () => {
    expect(BASE_SYSTEM_RULES).toContain("NEVER invent fake vendor business names");
    expect(BASE_SYSTEM_RULES).toContain("phone numbers");
  });

  it("mandates INR currency in base rules", () => {
    expect(BASE_SYSTEM_RULES).toContain("Indian Rupees");
    expect(BASE_SYSTEM_RULES).toContain("INR");
  });

  it("defines comprehensive system prompts for plan generation and chat", () => {
    expect(PLAN_SYSTEM_PROMPT_V1).toContain("budgetBreakdown");
    expect(PLAN_SYSTEM_PROMPT_V1).toContain("vendorChecklist");
    expect(CHAT_SYSTEM_PROMPT_V1).toContain("Eventoria Planning Assistant");
  });

  it("includes all required categories in plan prompt for each event type", () => {
    const weddingReq: EventPlanRequest = {
      eventType: "wedding",
      guestCount: 200,
      budget: 2000000,
      date: "2026-11-20",
      city: "Udaipur",
      description: "Palace wedding",
      preferences: ["Live Shehnai", "Royal Decor"],
    };

    const prompt = buildPlanPrompt(weddingReq);
    expect(prompt).toContain("<event_facts>");
    expect(prompt).toContain("Event Type: wedding");
    expect(prompt).toContain("Udaipur");

    for (const cat of REQUIRED_CATEGORIES.wedding) {
      expect(prompt).toContain(cat);
    }
  });

  it("formats event context preface accurately for chat", () => {
    const preface = buildEventContextPreface({
      eventType: "birthday",
      guestCount: 50,
      city: "Pune",
    });
    expect(preface).toContain("Type: birthday");
    expect(preface).toContain("Guests: 50");
    expect(preface).toContain("City: Pune");
  });

  it("returns empty string when no event context provided", () => {
    expect(buildEventContextPreface(undefined)).toBe("");
  });
});
