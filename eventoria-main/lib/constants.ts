/**
 * @file lib/constants.ts
 * @module Constants
 * @description Global constants, required event categories, model identifiers, and limits.
 * Centralizes all magic numbers and configuration values for maintainability.
 * 
 * @see {@link https://nextjs.org/docs|Next.js Documentation}
 */

import type { EventType, GeminiModel } from "@/types/event";

/**
 * Supported event types list for the planning assistant.
 * These are the three core celebration categories supported by Eventoria.
 * 
 * @constant {ReadonlyArray<EventType>}
 * @readonly
 */
export const EVENT_TYPES: ReadonlyArray<EventType> = [
  "wedding",
  "birthday",
  "community",
] as const;

/**
 * Minimum required budget categories enforced per event type.
 * Each event type has domain-specific categories that must be included
 * in every generated plan to ensure comprehensive coverage.
 * 
 * @constant {Record<EventType, ReadonlyArray<string>>}
 * @readonly
 * 
 * @example
 * REQUIRED_CATEGORIES.wedding // Returns array with Venue, Catering, etc.
 */
export const REQUIRED_CATEGORIES: Record<EventType, ReadonlyArray<string>> = {
  wedding: [
    "Venue",
    "Catering",
    "Decor & Florals",
    "Photography & Videography",
    "Attire & Grooming",
    "Music & Entertainment",
    "Stationery & Invitations",
    "Rituals & Officiants",
    "Transport & Logistics",
    "Contingency",
  ],
  birthday: [
    "Venue or Home Setup",
    "Theme & Decor",
    "Cake & Food",
    "Entertainment & Activities",
    "Return Gifts & Favors",
    "Photography",
    "Contingency",
  ],
  community: [
    "Venue & Permits",
    "Logistics & AV",
    "Safety & First Aid",
    "Volunteers & Staffing",
    "Sponsors & Outreach",
    "Food & Water Stations",
    "Cleanup & Waste Management",
    "Contingency",
  ],
};

/**
 * Default Google Gemini model identifiers for two-tier routing.
 * 
 * - **complex**: Used for full plan generation, detailed analysis, streaming chat
 * - **simple**: Used for quick questions, definitions, and rapid responses
 * 
 * @constant
 * @readonly
 * 
 * @see {@link https://ai.google.dev/gemini-api/docs/models|Gemini Models}
 */
export const DEFAULT_MODELS: {
  readonly complex: GeminiModel;
  readonly simple: GeminiModel;
} = {
  complex: "gemini-2.5-flash",
  simple: "gemini-2.5-flash-lite",
} as const;

/**
 * Input validation constraints and limits to prevent abuse and ensure data quality.
 * All limits are enforced server-side via Zod schemas.
 * 
 * @constant
 * @readonly
 * 
 * Limits include:
 * - Guest count: 1 to 10,000
 * - Budget: ₹1,000 to ₹10 Crore (INR)
 * - Text lengths for descriptions and preferences
 * - Chat history size to prevent token overflow
 * 
 * @security Prevents DoS attacks and token exhaustion
 */
export const LIMITS = {
  MIN_GUESTS: 1,
  MAX_GUESTS: 10000,
  MIN_BUDGET: 1000, // INR 1,000 minimum
  MAX_BUDGET: 100000000, // INR 10 Crore maximum
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_PREFERENCES: 15,
  MAX_PREFERENCE_LENGTH: 100,
  MAX_CHAT_INPUT_LENGTH: 1500,
  MAX_CHAT_HISTORY_MESSAGES: 20,
  MAX_TOKEN_ESTIMATE_FOR_CHUNKING: 4000,
  MAX_REQUEST_BODY_BYTES: 64 * 1024,  // 64 KB
  MAX_CHAT_MESSAGES_PER_REQUEST: 10,  // cap messages array sent per request
} as const;

/**
 * Rate limit sliding window duration in milliseconds.
 * All rate limits use a 15-minute rolling window.
 * 
 * @constant {number}
 * @readonly
 * @default 900000 (15 minutes)
 */
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Rate limit quotas per 15-minute sliding window by API route.
 * Protects AI endpoints from abuse and manages API costs.
 * 
 * @constant
 * @readonly
 * 
 * Routes and limits:
 * - plan: 10 requests (expensive, full generation)
 * - chat: 30 requests (streaming, moderate cost)
 * - ask: 60 requests (simple tier, low cost)
 * - usage: 120 requests (no AI, just quota checks)
 * 
 * @security Critical for preventing API quota exhaustion
 */
export const RATE_LIMIT_MAX_REQUESTS = {
  plan: 10,
  chat: 30,
  ask: 60,
  usage: 120,
} as const;

/**
 * LocalStorage keys used throughout the application for client-side persistence.
 * Centralized to prevent typos and ensure consistency.
 * 
 * @constant
 * @readonly
 * 
 * Keys:
 * - CURRENT_PLAN: Active event plan being worked on
 * - SAVED_PLANS: List of all saved plans
 * - THEME: User's theme preference (light/dark)
 * - CHAT_HISTORY: Conversation history with AI assistant
 * 
 * @privacy All data stored locally, never sent to external servers
 */
export const LOCAL_STORAGE_KEYS = {
  CURRENT_PLAN: "eventoria_current_plan",
  SAVED_PLANS: "eventoria_saved_plans",
  THEME: "eventoria_theme",
  CHAT_HISTORY: "eventoria_chat_history",
} as const;
