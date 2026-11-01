/**
 * @file types/event.ts
 * Core domain types and interfaces for the Eventoria GenAI Event Planner.
 */

/** Supported event categories */
export type EventType = "wedding" | "birthday" | "community";

/** Complexity classification for model routing */
export type QueryComplexity = "simple" | "moderate" | "complex";

/** Gemini model identifiers */
export type GeminiModel = "gemini-2.5-flash" | "gemini-2.5-flash-lite";

/** Budget priority level */
export type BudgetPriority = "essential" | "recommended" | "optional";

/** Task status in timeline */
export type TaskStatus = "todo" | "in-progress" | "done";

/** Vendor booking status */
export type VendorStatus = "not-started" | "shortlisted" | "booked";

/** User-submitted event planning request */
export interface EventPlanRequest {
  readonly eventType: EventType;
  readonly guestCount: number;
  readonly budget: number;
  readonly date: string;
  readonly city: string;
  readonly description: string;
  readonly preferences: ReadonlyArray<string>;
}

/** Budget line item */
export interface BudgetItem {
  readonly id?: string;
  readonly category: string;
  readonly estimatedCost: number;
  readonly percentOfTotal: number;
  readonly notes: string;
  readonly priority: BudgetPriority;
  readonly savingTips: ReadonlyArray<string>;
  readonly userAdjustedCost?: number;
}

/** Timeline task */
export interface TimelineItem {
  readonly id?: string;
  readonly title: string;
  readonly description: string;
  readonly phase: string;
  readonly daysBeforeEvent: number;
  readonly category: string;
  readonly priority: "high" | "medium" | "low";
  readonly status?: TaskStatus;
}

/** Vendor checklist entry */
export interface VendorChecklistItem {
  readonly id?: string;
  readonly category: string;
  readonly priorityTier: "must-have" | "should-have" | "nice-to-have";
  readonly itemsToBook: ReadonlyArray<string>;
  readonly questionsToAsk: ReadonlyArray<string>;
  readonly contractChecks: ReadonlyArray<string>;
  readonly tips: ReadonlyArray<string>;
  readonly estimateLowPercent: number;
  readonly estimateHighPercent: number;
  readonly bookByDaysBefore: number;
  readonly status?: VendorStatus;
}

/** Personalized idea */
export interface PersonalizedIdea {
  readonly id?: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly tier: "diy" | "standard" | "premium";
  readonly estimatedCost: number;
}

/** Complete AI-generated event plan */
export interface EventPlan {
  readonly id?: string;
  readonly summary: string;
  readonly eventType: EventType;
  readonly budgetBreakdown: ReadonlyArray<BudgetItem>;
  readonly timeline: ReadonlyArray<TimelineItem>;
  readonly vendorChecklist: ReadonlyArray<VendorChecklistItem>;
  readonly personalizedIdeas: ReadonlyArray<PersonalizedIdea>;
  readonly tips: ReadonlyArray<string>;
  readonly createdAt?: number;
  readonly totalBudget?: number;
}

/** Chat message */
export interface ChatMessage {
  readonly id: string;
  readonly role: "user" | "assistant" | "system";
  readonly content: string;
  readonly timestamp: number;
  readonly modelTier?: "quick" | "detailed";
}

/** Classification result from deterministic event classifier */
export interface ClassificationResult {
  readonly complexity: QueryComplexity;
  readonly model: GeminiModel;
  readonly eventType: EventType | null;
  readonly detectedCategories: ReadonlyArray<string>;
  readonly estimatedTokens: number;
  readonly requiresChunking: boolean;
}

/** Rate limit check result */
export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: number;
  readonly limit: number;
  readonly headers: Record<string, string>;
}

/** Source of a generated plan — ai = real Gemini call, fallback = offline deterministic */
export type PlanSource = "ai" | "fallback";

/** API error response shape */
export interface ApiErrorResponse {
  readonly error: string;
  readonly code: string;
  readonly details?: string;
}

/** Successful Plan API response */
export interface PlanApiResponse {
  readonly plan: EventPlan;
  readonly model: GeminiModel;
  readonly source: PlanSource;
  readonly classification: {
    readonly complexity: QueryComplexity;
    readonly model: GeminiModel;
  };
}

/** Successful Quick Ask API response */
export interface AskApiResponse {
  readonly answer: string;
  readonly model: GeminiModel;
}

/** Usage API response */
export interface UsageApiResponse {
  readonly remaining: number;
  readonly resetAt: number;
  readonly limit: number;
}
