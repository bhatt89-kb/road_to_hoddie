/**
 * @file lib/gemini.ts
 * Google GenAI SDK wrapper (server-only).
 * Handles structured JSON output for plans, streaming chat, two-tier model selection,
 * retry backoff, and graceful fallback generation.
 */

import { GoogleGenAI } from "@google/genai";
import type {
  EventPlan,
  EventPlanRequest,
  GeminiModel,
  ChatMessage,
  PlanSource,
} from "@/types/event";
import { DEFAULT_MODELS, REQUIRED_CATEGORIES } from "./constants";
import {
  PLAN_SYSTEM_PROMPT_V1,
  CHAT_SYSTEM_PROMPT_V1,
  ASK_SYSTEM_PROMPT_V1,
  buildPlanPrompt,
  buildEventContextPreface,
} from "./prompt-templates";
import { eventPlanSchema } from "./validators";
import { sanitizeOutput } from "./guardrails";

/** Gets the API key from environment */
function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY?.trim();
}

/** Resolves the configured model name */
export function getModelForTier(tier: "complex" | "simple"): string {
  if (tier === "simple") {
    return process.env.GEMINI_MODEL_SIMPLE?.trim() || DEFAULT_MODELS.simple;
  }
  return process.env.GEMINI_MODEL_COMPLEX?.trim() || DEFAULT_MODELS.complex;
}

/** Initializes the GoogleGenAI instance */
function createClient(): GoogleGenAI | null {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

/**
 * Executes an async operation with retry and exponential backoff for transient network/rate errors.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 600
): Promise<T> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err: unknown) {
      attempt++;
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isTransient =
        errorMessage.includes("429") ||
        errorMessage.includes("503") ||
        errorMessage.includes("ResourceExhausted") ||
        errorMessage.includes("fetch failed");

      if (attempt > retries || !isTransient) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
    }
  }
  throw new Error("Retry attempts exhausted");
}

/** Timeout constants for Gemini API calls */
const PLAN_TIMEOUT_MS = 30_000;  // 30 seconds
const CHAT_TIMEOUT_MS = 60_000;  // 60 seconds
const ASK_TIMEOUT_MS  = 15_000;  // 15 seconds

/**
 * Deterministic fallback plan generator when API key is missing or service is offline.
 * Always produces a valid, mathematically correct plan following the required categories.
 */
export function generateFallbackPlan(request: EventPlanRequest): EventPlan {
  const categories = REQUIRED_CATEGORIES[request.eventType];
  const count = categories.length;
  // Reserve 8% for contingency
  const contingencyPct = 8;
  const remainingPct = 100 - contingencyPct;
  const basePct = Math.floor((remainingPct / (count - 1)) * 10) / 10;
  let allocatedPct = 0;

  const budgetBreakdown = categories.map((cat, idx) => {
    let pct: number;
    if (cat.toLowerCase().includes("contingency")) {
      pct = contingencyPct;
    } else if (idx === count - 2) {
      pct = Math.round((remainingPct - allocatedPct) * 10) / 10;
    } else {
      pct = basePct;
      allocatedPct += pct;
    }

    const estimatedCost = Math.round((request.budget * pct) / 100);

    return {
      category: cat,
      estimatedCost,
      percentOfTotal: pct,
      notes: `Estimated allocation based on ${request.guestCount} guests in ${request.city}.`,
      priority: (cat.toLowerCase().includes("venue") || cat.toLowerCase().includes("cater") || cat.toLowerCase().includes("contingency")
        ? "essential"
        : "recommended") as "essential" | "recommended",
      savingTips: [
        `Book ${cat} 3-6 months early to lock in off-peak pricing.`,
        `Ask for package deals combining related services.`,
      ],
    };
  });

  const timeline = [
    {
      title: "Establish Vision & Budget Lock",
      description: `Finalize the ${request.eventType} theme and confirm maximum budget of INR ${request.budget}.`,
      phase: "Initial Planning",
      daysBeforeEvent: 90,
      category: "General",
      priority: "high" as const,
    },
    {
      title: "Shortlist & Confirm Venue",
      description: `Inspect top 3 venue options in ${request.city} suited for ${request.guestCount} guests.`,
      phase: "Vendor Booking",
      daysBeforeEvent: 75,
      category: "Venue",
      priority: "high" as const,
    },
    {
      title: "Menu & Catering Finalization",
      description: "Arrange food tastings and agree on menu offerings and dietary options.",
      phase: "Vendor Booking",
      daysBeforeEvent: 45,
      category: "Catering",
      priority: "high" as const,
    },
    {
      title: "Send Invitations & Collect RSVPs",
      description: `Distribute digital/print invites to all ${request.guestCount} anticipated guests.`,
      phase: "Mid-Term",
      daysBeforeEvent: 30,
      category: "Stationery",
      priority: "medium" as const,
    },
    {
      title: "Final Walkthrough & Day-Of Schedule",
      description: "Confirm arrival times with all booked vendors and assign point-of-contact leads.",
      phase: "Final Week",
      daysBeforeEvent: 7,
      category: "Logistics",
      priority: "high" as const,
    },
  ];

  const vendorChecklist = categories.slice(0, 5).map((cat, i) => ({
    category: cat,
    priorityTier: (i < 2 ? "must-have" : "should-have") as "must-have" | "should-have",
    itemsToBook: [`Primary ${cat} provider`, `Backup / secondary assistant`],
    questionsToAsk: [
      `What is included in the base package and what attracts overtime fees?`,
      `Have you managed events for ${request.guestCount} guests in ${request.city} before?`,
    ],
    contractChecks: [
      "Cancellation and refund policy in writing",
      "Exact breakdown of taxes, overtime, and deposit schedule",
    ],
    tips: [`Verify past portfolio photos from real client events.`],
    estimateLowPercent: 10,
    estimateHighPercent: 25,
    bookByDaysBefore: 60 - i * 10,
  }));

  const personalizedIdeas = [
    {
      title: `Signature ${request.city} Welcome Experience`,
      description: `Incorporate local regional flavors and welcome drinks inspired by ${request.city} culinary heritage.`,
      category: "Guest Experience",
      tier: "standard" as const,
      estimatedCost: Math.round(request.budget * 0.04),
    },
    {
      title: "Interactive DIY Memory Photo Corner",
      description: "A self-service photo wall with polaroid cameras and a guestbook for personal handwritten notes.",
      category: "Decor & Activities",
      tier: "diy" as const,
      estimatedCost: Math.round(request.budget * 0.02),
    },
    {
      title: "Curated Live Acoustic or Folk Performance",
      description: "Feature local artists for a brief 45-minute live set during the main reception.",
      category: "Entertainment",
      tier: "premium" as const,
      estimatedCost: Math.round(request.budget * 0.07),
    },
  ];

  return {
    summary: `Curated ${request.eventType} strategy for ${request.guestCount} guests in ${request.city} with a budget of INR ${request.budget}. Designed for high memorable impact, smooth flow, and prudent cost allocation.`,
    eventType: request.eventType,
    budgetBreakdown,
    timeline,
    vendorChecklist,
    personalizedIdeas,
    tips: [
      "Keep 5-10% of total funds unallocated until the final week for unexpected requirements.",
      "Assign one dedicated family member or trusted friend as vendor coordinator on event day.",
      "Get all cancellation and overtime terms in signed agreements before paying advances.",
      "Confirm power backup and weather mitigation plans with your venue manager early.",
    ],
    createdAt: Date.now(),
    totalBudget: request.budget,
  };
}

/**
 * Generates a full structured Event Plan using Gemini API or fallback.
 *
 * @param request - Validated event planning request
 * @returns Complete validated EventPlan, model metadata, and source flag
 */
export async function generateEventPlan(request: EventPlanRequest): Promise<{
  plan: EventPlan;
  model: GeminiModel;
  source: PlanSource;
}> {
  const modelName = getModelForTier("complex") as GeminiModel;
  const client = createClient();

  if (!client) {
    // Graceful offline fallback
    const fallback = generateFallbackPlan(request);
    return { plan: fallback, model: modelName, source: "fallback" as PlanSource };
  }

  const prompt = buildPlanPrompt(request);

  try {
    const response = await Promise.race([
      withRetry(async () => {
        return await client.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: PLAN_SYSTEM_PROMPT_V1,
            responseMimeType: "application/json",
            temperature: 0.35,
            maxOutputTokens: 8192,
          },
        });
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini plan timed out after ${PLAN_TIMEOUT_MS}ms`)), PLAN_TIMEOUT_MS)
      ),
    ]);

    const responseText = response.text || "";
    const parsed = JSON.parse(responseText);
    const validated = eventPlanSchema.parse(parsed);

    return {
      plan: {
        ...validated,
        createdAt: Date.now(),
        totalBudget: request.budget,
      },
      model: modelName,
      source: "ai" as PlanSource,
    };
  } catch (err) {
    console.warn("Gemini plan generation encountered error, serving resilient fallback:", err);
    const fallback = generateFallbackPlan(request);
    return { plan: fallback, model: modelName, source: "fallback" as PlanSource };
  }
}

/**
 * Answers a single quick question concisely using the simple tier model (`gemini-2.5-flash-lite`).
 *
 * @param question - User's question
 * @param context - Optional event plan context
 * @returns Answer text string and model identifier
 */
export async function askQuestion(
  question: string,
  context?: Partial<EventPlanRequest>
): Promise<{ answer: string; model: GeminiModel }> {
  const modelName = getModelForTier("simple") as GeminiModel;
  const client = createClient();

  if (!client) {
    return {
      answer: `[Planning Tip]: For ${context?.eventType || "your event"} with ${context?.guestCount || "your"} guests in ${context?.city || "your city"}, prioritize securing the venue and catering first as they typically account for 50-60% of the overall budget.`,
      model: modelName,
    };
  }

  const preface = buildEventContextPreface(context);
  const prompt = `${preface}Question: ${question}`;

  try {
    const response = await Promise.race([
      withRetry(async () => {
        return await client.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: ASK_SYSTEM_PROMPT_V1,
            temperature: 0.6,
            maxOutputTokens: 2048,
          },
        });
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini ask timed out after ${ASK_TIMEOUT_MS}ms`)), ASK_TIMEOUT_MS)
      ),
    ]);

    const cleanAnswer = sanitizeOutput(response.text || "No response received.");
    return { answer: cleanAnswer, model: modelName };
  } catch (err) {
    console.warn("Gemini askQuestion fallback:", err);
    return {
      answer: `When planning your ${context?.eventType || "event"}, consider booking key vendors at least 2-3 months in advance to ensure availability and favorable rates.`,
      model: modelName,
    };
  }
}

/**
 * Creates an async generator streaming tokens from Gemini for real-time SSE chat.
 *
 * @param messages - Chat conversation history
 * @param context - Active event context
 * @returns AsyncIterable yielding text chunks
 */
export async function* streamChat(
  messages: ReadonlyArray<ChatMessage>,
  context?: Partial<EventPlanRequest>
): AsyncGenerator<string, void, unknown> {
  const modelName = getModelForTier("complex");
  const client = createClient();

  if (!client) {
    // Simulated stream for offline development / test
    const fallbackChunks = [
      "Hello! ",
      "I'm your Eventoria celebration assistant. ",
      "Based on your event details, ",
      "I recommend prioritizing your core essentials: venue, catering, and guest flow. ",
      "What specific aspect would you like to review first?",
    ];
    for (const chunk of fallbackChunks) {
      await new Promise((r) => setTimeout(r, 60));
      yield chunk;
    }
    return;
  }

  const preface = buildEventContextPreface(context);
  const formattedContents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  if (formattedContents.length > 0 && preface) {
    const lastUser = formattedContents[formattedContents.length - 1];
    if (lastUser && lastUser.parts && lastUser.parts[0]) {
      lastUser.parts[0].text = `${preface}${lastUser.parts[0].text}`;
    }
  }

  try {
    const streamPromise = client.models.generateContentStream({
      model: modelName,
      contents: formattedContents,
      config: {
        systemInstruction: CHAT_SYSTEM_PROMPT_V1,
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    });

    const stream = await Promise.race([
      streamPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini chat timed out after ${CHAT_TIMEOUT_MS}ms`)), CHAT_TIMEOUT_MS)
      ),
    ]);

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        yield sanitizeOutput(text);
      }
    }
  } catch (err) {
    console.warn("Gemini stream error, yielding fallback response:", err);
    yield "I apologize, but I encountered a temporary connection issue. Please try asking your question again in a moment.";
  }
}
