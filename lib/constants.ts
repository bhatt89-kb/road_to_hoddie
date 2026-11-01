/**
 * @file lib/constants.ts
 * @module Constants
 * @description Application-wide constants, validation limits, and configuration values.
 * Centralizes all magic numbers and business rules for maintainability.
 * 
 * @see {@link https://nextjs.org/docs|Next.js Documentation}
 * @see {@link ./config.ts|Configuration Module}
 */

import type { EventType, GeminiModel } from "@/types/event";

// ============================================================================
// Event Types & Categories
// ============================================================================

/**
 * Supported event types list for the planning assistant.
 * These are the three core celebration categories supported by Eventoria.
 * 
 * @constant {ReadonlyArray<EventType>}
 * @readonly
 * 
 * @example
 * EVENT_TYPES.forEach(type => {
 *   console.log(`Generating plan for ${type}`);
 * });
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
 * @constant {Readonly<Record<EventType, ReadonlyArray<string>>>}
 * @readonly
 * 
 * Categories are ordered by typical priority (essential to optional).
 * The last category is always "Contingency" (8-10% of budget).
 * 
 * @example
 * const weddingCategories = REQUIRED_CATEGORIES.wedding;
 * console.log(`Wedding requires ${weddingCategories.length} categories`);
 */
export const REQUIRED_CATEGORIES: Readonly<Record<EventType, ReadonlyArray<string>>> = {
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
} as const;

/**
 * Event type display names for UI
 * 
 * @constant
 * @readonly
 */
export const EVENT_TYPE_LABELS: Readonly<Record<EventType, string>> = {
  wedding: "Wedding",
  birthday: "Birthday",
  community: "Community Event",
} as const;

/**
 * Event type descriptions for UI tooltips and help text
 * 
 * @constant
 * @readonly
 */
export const EVENT_TYPE_DESCRIPTIONS: Readonly<Record<EventType, string>> = {
  wedding: "Traditional and modern wedding ceremonies with comprehensive planning",
  birthday: "Birthday parties for all ages, from intimate gatherings to large celebrations",
  community: "Community events, festivals, and public gatherings",
} as const;

// ============================================================================
// Model Configuration
// ============================================================================

/**
 * Default Google Gemini model identifiers for two-tier routing.
 * 
 * **Two-Tier Strategy:**
 * - **complex**: Used for full plan generation, detailed analysis, streaming chat
 *   - Higher token limits, better reasoning
 *   - Slower but more comprehensive responses
 * - **simple**: Used for quick questions, definitions, and rapid responses
 *   - Faster inference, lower cost
 *   - Optimized for sub-second latency
 * 
 * @constant
 * @readonly
 * 
 * @see {@link https://ai.google.dev/gemini-api/docs/models|Gemini Models Documentation}
 * @see {@link ./classifier.ts|Query Classification Logic}
 */
export const DEFAULT_MODELS: Readonly<{
  readonly complex: GeminiModel;
  readonly simple: GeminiModel;
}> = {
  complex: "gemini-2.5-flash",
  simple: "gemini-2.5-flash-lite",
} as const;

/**
 * Model performance characteristics for monitoring and debugging
 * 
 * @constant
 * @readonly
 */
export const MODEL_SPECS: Readonly<Record<GeminiModel, {
  maxTokens: number;
  avgLatencyMs: number;
  costTier: 'low' | 'medium' | 'high';
}>> = {
  "gemini-2.5-flash": {
    maxTokens: 8192,
    avgLatencyMs: 2000,
    costTier: 'medium',
  },
  "gemini-2.5-flash-lite": {
    maxTokens: 4096,
    avgLatencyMs: 500,
    costTier: 'low',
  },
} as const;

// ============================================================================
// Validation Limits & Constraints
// ============================================================================

/**
 * Input validation constraints and limits to prevent abuse and ensure data quality.
 * All limits are enforced server-side via Zod schemas in validators.ts
 * 
 * **Security Considerations:**
 * - Prevents DoS attacks via excessive input size
 * - Protects against token exhaustion attacks
 * - Ensures reasonable API costs
 * - Maintains response quality
 * 
 * @constant
 * @readonly
 * 
 * @see {@link ./validators.ts|Validation Schemas}
 */
export const LIMITS = {
  // Guest Count Constraints
  /** Minimum number of guests allowed (1 guest minimum) */
  MIN_GUESTS: 1,
  /** Maximum number of guests allowed (prevents unrealistic plans) */
  MAX_GUESTS: 10000,
  
  // Budget Constraints (INR)
  /** Minimum budget in INR (₹1,000) */
  MIN_BUDGET: 1000,
  /** Maximum budget in INR (₹10 Crore = 100 million) */
  MAX_BUDGET: 100000000,
  
  // Text Length Constraints
  /** Maximum description length in characters */
  MAX_DESCRIPTION_LENGTH: 2000,
  /** Maximum number of preference items */
  MAX_PREFERENCES: 15,
  /** Maximum length per preference string */
  MAX_PREFERENCE_LENGTH: 100,
  /** Maximum city name length */
  MAX_CITY_LENGTH: 100,
  
  // Chat & Messaging Constraints
  /** Maximum chat message input length */
  MAX_CHAT_INPUT_LENGTH: 1500,
  /** Maximum messages stored in chat history */
  MAX_CHAT_HISTORY_MESSAGES: 20,
  /** Maximum messages sent per request */
  MAX_CHAT_MESSAGES_PER_REQUEST: 10,
  
  // Token & Performance Constraints
  /** Token threshold for triggering content chunking */
  MAX_TOKEN_ESTIMATE_FOR_CHUNKING: 4000,
  /** Maximum HTTP request body size in bytes (64 KB) */
  MAX_REQUEST_BODY_BYTES: 64 * 1024,
  
  // Date Constraints
  /** Minimum days in future for event date (allows last-minute planning) */
  MIN_DAYS_IN_FUTURE: 0,
  /** Maximum days in future for event date (2 years) */
  MAX_DAYS_IN_FUTURE: 730,
} as const;

/**
 * Recommended ranges for optimal plan quality
 * These are soft limits for UX guidance, not enforced
 * 
 * @constant
 * @readonly
 */
export const RECOMMENDED_RANGES = {
  GUESTS: {
    small: { min: 1, max: 50 },
    medium: { min: 51, max: 200 },
    large: { min: 201, max: 500 },
    extraLarge: { min: 501, max: 10000 },
  },
  BUDGET_INR: {
    economy: { min: 1000, max: 100000 },
    moderate: { min: 100001, max: 500000 },
    premium: { min: 500001, max: 2000000 },
    luxury: { min: 2000001, max: 100000000 },
  },
  PLANNING_LEAD_TIME_DAYS: {
    lastMinute: { min: 0, max: 30 },
    standard: { min: 31, max: 90 },
    ideal: { min: 91, max: 180 },
    extended: { min: 181, max: 730 },
  },
} as const;

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

/**
 * Rate limit sliding window duration in milliseconds.
 * All rate limits use a 15-minute rolling window per client IP.
 * 
 * @constant {number}
 * @readonly
 * @default 900000 (15 minutes)
 * 
 * @see {@link https://en.wikipedia.org/wiki/Rate_limiting#Sliding_window|Sliding Window Algorithm}
 */
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Rate limit quotas per 15-minute sliding window by API route.
 * Protects AI endpoints from abuse and manages API costs.
 * 
 * **Rate Limit Strategy:**
 * - More expensive operations have stricter limits
 * - Tiered approach based on computational cost
 * - Balances usability with cost control
 * 
 * @constant
 * @readonly
 * 
 * Routes and limits:
 * - **plan** (10/15min): Most expensive, full plan generation with complex model
 * - **chat** (30/15min): Streaming responses, moderate cost
 * - **ask** (60/15min): Simple model, low cost, fast responses
 * - **usage** (120/15min): No AI call, just quota checks
 * 
 * @security Critical for preventing API quota exhaustion and abuse
 * @see {@link ./rate-limiter.ts|Rate Limiter Implementation}
 */
export const RATE_LIMIT_MAX_REQUESTS: Readonly<{
  readonly plan: number;
  readonly chat: number;
  readonly ask: number;
  readonly usage: number;
}> = {
  plan: 10,
  chat: 30,
  ask: 60,
  usage: 120,
} as const;

/**
 * Rate limit bypass tokens for testing and development
 * Only active in non-production environments
 * 
 * @constant
 * @readonly
 * @security Never enable in production
 */
export const RATE_LIMIT_BYPASS_ENABLED = process.env.NODE_ENV !== 'production';

/**
 * Rate limit response headers standard names
 * Following RFC 6585 and common conventions
 * 
 * @constant
 * @readonly
 */
export const RATE_LIMIT_HEADERS = {
  LIMIT: 'X-RateLimit-Limit',
  REMAINING: 'X-RateLimit-Remaining',
  RESET: 'X-RateLimit-Reset',
  RETRY_AFTER: 'Retry-After',
} as const;

// ============================================================================
// LocalStorage Keys
// ============================================================================

/**
 * LocalStorage keys used throughout the application for client-side persistence.
 * Centralized to prevent typos and ensure consistency across components.
 * 
 * **Data Privacy:**
 * - All data stored locally in browser
 * - Never transmitted to external servers
 * - User maintains full control via browser storage
 * - Includes "Delete My Data" functionality
 * 
 * @constant
 * @readonly
 * 
 * Keys:
 * - **CURRENT_PLAN**: Active event plan being edited
 * - **SAVED_PLANS**: Array of all saved plans
 * - **THEME**: User's theme preference (light/dark/system)
 * - **CHAT_HISTORY**: Conversation history with AI assistant
 * 
 * @privacy All data stored locally, never sent to external servers
 * @see {@link ../hooks/useLocalStorage.ts|LocalStorage Hook}
 */
export const LOCAL_STORAGE_KEYS: Readonly<{
  readonly CURRENT_PLAN: string;
  readonly SAVED_PLANS: string;
  readonly THEME: string;
  readonly CHAT_HISTORY: string;
}> = {
  CURRENT_PLAN: "eventoria_current_plan",
  SAVED_PLANS: "eventoria_saved_plans",
  THEME: "eventoria_theme",
  CHAT_HISTORY: "eventoria_chat_history",
} as const;

/**
 * LocalStorage key prefix for namespacing
 * Prevents conflicts with other applications
 * 
 * @constant
 * @readonly
 */
export const STORAGE_PREFIX = 'eventoria_';

/**
 * Maximum localStorage data size warning threshold (bytes)
 * Most browsers allow 5-10MB, we warn at 4MB
 * 
 * @constant
 * @readonly
 */
export const STORAGE_SIZE_WARNING_BYTES = 4 * 1024 * 1024;

// ============================================================================
// Cache Configuration
// ============================================================================

/**
 * Cache time-to-live (TTL) values in milliseconds
 * Different cache durations for different data types
 * 
 * @constant
 * @readonly
 */
export const CACHE_TTL_MS: Readonly<{
  readonly PLAN: number;
  readonly ASK: number;
  readonly CLASSIFICATION: number;
}> = {
  /** Plan cache TTL: 1 hour (plans are expensive to generate) */
  PLAN: 60 * 60 * 1000,
  /** Quick ask cache TTL: 30 minutes (answers are lightweight) */
  ASK: 30 * 60 * 1000,
  /** Classification cache TTL: 5 minutes (very cheap, refresh often) */
  CLASSIFICATION: 5 * 60 * 1000,
} as const;

/**
 * Maximum cache sizes (number of entries)
 * Prevents unbounded memory growth
 * 
 * @constant
 * @readonly
 */
export const CACHE_MAX_SIZE: Readonly<{
  readonly PLAN: number;
  readonly ASK: number;
}> = {
  /** Max plan cache entries (each plan ~10-50KB) */
  PLAN: 50,
  /** Max ask cache entries (each answer ~1-2KB) */
  ASK: 200,
} as const;

// ============================================================================
// API Timeouts
// ============================================================================

/**
 * API request timeout values in milliseconds
 * Prevents hanging requests and provides better UX
 * 
 * @constant
 * @readonly
 */
export const API_TIMEOUTS_MS: Readonly<{
  readonly PLAN: number;
  readonly CHAT: number;
  readonly ASK: number;
}> = {
  /** Plan generation timeout: 30 seconds */
  PLAN: 30000,
  /** Chat streaming timeout: 60 seconds */
  CHAT: 60000,
  /** Quick ask timeout: 15 seconds */
  ASK: 15000,
} as const;

// ============================================================================
// Error Codes
// ============================================================================

/**
 * Standardized error codes for API responses
 * Enables programmatic error handling on client
 * 
 * @constant
 * @readonly
 */
export const ERROR_CODES: Readonly<{
  readonly VALIDATION_ERROR: string;
  readonly RATE_LIMIT_EXCEEDED: string;
  readonly UNAUTHORIZED: string;
  readonly NOT_FOUND: string;
  readonly INTERNAL_ERROR: string;
  readonly BAD_REQUEST: string;
  readonly TIMEOUT: string;
  readonly OFF_SCOPE: string;
}> = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  TIMEOUT: 'TIMEOUT',
  OFF_SCOPE: 'OFF_SCOPE',
} as const;

// ============================================================================
// HTTP Status Codes
// ============================================================================

/**
 * Standard HTTP status codes used in API responses
 * 
 * @constant
 * @readonly
 */
export const HTTP_STATUS: Readonly<{
  readonly OK: number;
  readonly CREATED: number;
  readonly BAD_REQUEST: number;
  readonly UNAUTHORIZED: number;
  readonly FORBIDDEN: number;
  readonly NOT_FOUND: number;
  readonly TOO_MANY_REQUESTS: number;
  readonly INTERNAL_ERROR: number;
  readonly SERVICE_UNAVAILABLE: number;
}> = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

