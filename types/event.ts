/**
 * @file types/event.ts
 * Core domain types and interfaces for the Eventoria GenAI Event Planner.
 * 
 * @module Types
 * @description Provides type-safe definitions for all event planning entities,
 * including branded types for IDs, discriminated unions for better type inference,
 * and comprehensive documentation for all public interfaces.
 */

// ============================================================================
// Branded Types for Type Safety
// ============================================================================

/**
 * Branded type for entity IDs to prevent mixing different ID types
 * @template T - The entity type this ID represents
 */
declare const __brand: unique symbol;
type Brand<T, TBrand extends string> = T & { [__brand]: TBrand };

/**
 * Unique identifier for an event plan
 * @example "plan_abc123"
 */
export type PlanId = Brand<string, 'PlanId'>;

/**
 * Unique identifier for a budget item
 * @example "budget_item_xyz789"
 */
export type BudgetItemId = Brand<string, 'BudgetItemId'>;

/**
 * Unique identifier for a timeline task
 * @example "timeline_def456"
 */
export type TimelineItemId = Brand<string, 'TimelineItemId'>;

/**
 * Unique identifier for a vendor checklist item
 * @example "vendor_ghi012"
 */
export type VendorChecklistItemId = Brand<string, 'VendorChecklistItemId'>;

/**
 * Unique identifier for a personalized idea
 * @example "idea_jkl345"
 */
export type PersonalizedIdeaId = Brand<string, 'PersonalizedIdeaId'>;

/**
 * Unique identifier for a chat message
 * @example "msg_mno678"
 */
export type MessageId = Brand<string, 'MessageId'>;

// ============================================================================
// Core Enums and Literal Types
// ============================================================================

/**
 * Supported event categories for planning
 * @constant
 */
export const EventTypes = {
  WEDDING: 'wedding',
  BIRTHDAY: 'birthday',
  COMMUNITY: 'community',
} as const;

/**
 * Supported event type for the planning assistant
 * Represents the three core celebration categories
 */
export type EventType = typeof EventTypes[keyof typeof EventTypes];

/**
 * Complexity classification for intelligent model routing
 * - simple: Quick answers, definitions (uses lite model)
 * - moderate: General questions, advice (uses lite model)
 * - complex: Full plan generation, detailed analysis (uses full model)
 */
export type QueryComplexity = "simple" | "moderate" | "complex";

/**
 * Google Gemini model identifiers for two-tier routing
 * - gemini-2.5-flash: Full-featured model for complex tasks
 * - gemini-2.5-flash-lite: Optimized model for quick responses
 */
export type GeminiModel = "gemini-2.5-flash" | "gemini-2.5-flash-lite";

/**
 * Budget priority level for cost allocation
 * - essential: Must-have items (60-70% of budget)
 * - recommended: Important but flexible (20-30% of budget)
 * - optional: Nice-to-have items (5-10% of budget)
 */
export type BudgetPriority = "essential" | "recommended" | "optional";

/**
 * Task completion status in timeline
 * Follows typical Kanban board states
 */
export type TaskStatus = "todo" | "in-progress" | "done";

/**
 * Vendor booking progress status
 * Tracks procurement pipeline stages
 */
export type VendorStatus = "not-started" | "shortlisted" | "booked";

// ============================================================================
// Request & Response Interfaces
// ============================================================================

/**
 * User-submitted event planning request with validation constraints
 * All fields are validated against LIMITS in constants.ts
 * 
 * @interface EventPlanRequest
 * 
 * @property {EventType} eventType - Type of celebration (wedding/birthday/community)
 * @property {number} guestCount - Expected attendees (1-10,000)
 * @property {number} budget - Total budget in INR (₹1,000 - ₹10 Crore)
 * @property {string} date - Event date in ISO 8601 format (YYYY-MM-DD)
 * @property {string} city - City or location name (required for local recommendations)
 * @property {string} description - Detailed event description (max 2000 chars)
 * @property {ReadonlyArray<string>} preferences - User preferences array (max 15 items)
 * 
 * @example
 * {
 *   eventType: 'wedding',
 *   guestCount: 250,
 *   budget: 2000000,
 *   date: '2026-12-15',
 *   city: 'Mumbai',
 *   description: 'Traditional Maharashtrian wedding',
 *   preferences: ['Vegetarian menu', 'Outdoor venue']
 * }
 */
export interface EventPlanRequest {
  readonly eventType: EventType;
  readonly guestCount: number;
  readonly budget: number;
  readonly date: string;
  readonly city: string;
  readonly description: string;
  readonly preferences: ReadonlyArray<string>;
}

/**
 * Partial event context for AI assistant conversations
 * Used to provide context without requiring all fields
 */
export type EventContext = Partial<EventPlanRequest>;

// ============================================================================
// Budget & Financial Interfaces
// ============================================================================

/**
 * Single budget line item with cost breakdown and recommendations
 * 
 * @interface BudgetItem
 * 
 * @property {BudgetItemId} [id] - Unique identifier for the item
 * @property {string} category - Budget category name (e.g., "Venue", "Catering")
 * @property {number} estimatedCost - AI-recommended cost in INR
 * @property {number} percentOfTotal - Percentage of total budget (0-100)
 * @property {string} notes - Contextual notes and recommendations
 * @property {BudgetPriority} priority - Priority level for this expense
 * @property {ReadonlyArray<string>} savingTips - Money-saving suggestions
 * @property {number} [userAdjustedCost] - User's manual cost adjustment
 * 
 * @invariant estimatedCost >= 0
 * @invariant percentOfTotal >= 0 && percentOfTotal <= 100
 */
export interface BudgetItem {
  readonly id?: BudgetItemId;
  readonly category: string;
  readonly estimatedCost: number;
  readonly percentOfTotal: number;
  readonly notes: string;
  readonly priority: BudgetPriority;
  readonly savingTips: ReadonlyArray<string>;
  readonly userAdjustedCost?: number;
}

/**
 * Budget summary with calculated totals
 * Derived from budget breakdown array
 */
export interface BudgetSummary {
  readonly totalAllocated: number;
  readonly totalAdjusted: number;
  readonly remainingBudget: number;
  readonly isOverBudget: boolean;
  readonly overspendAmount: number;
  readonly categoryCount: number;
}

// ============================================================================
// Timeline & Task Interfaces
// ============================================================================

/**
 * Timeline milestone with backward scheduling from event date
 * 
 * @interface TimelineItem
 * 
 * @property {TimelineItemId} [id] - Unique identifier
 * @property {string} title - Task title (e.g., "Confirm Venue Booking")
 * @property {string} description - Detailed task description
 * @property {string} phase - Planning phase (e.g., "Initial Planning", "Final Week")
 * @property {number} daysBeforeEvent - Days before event to complete (e.g., 90, 60, 30)
 * @property {string} category - Related budget category
 * @property {"high" | "medium" | "low"} priority - Task urgency level
 * @property {TaskStatus} [status] - Current completion status
 * 
 * @invariant daysBeforeEvent >= 0
 */
export interface TimelineItem {
  readonly id?: TimelineItemId;
  readonly title: string;
  readonly description: string;
  readonly phase: string;
  readonly daysBeforeEvent: number;
  readonly category: string;
  readonly priority: "high" | "medium" | "low";
  readonly status?: TaskStatus;
}

/**
 * Timeline grouped by planning phases
 */
export interface TimelinePhase {
  readonly phaseName: string;
  readonly items: ReadonlyArray<TimelineItem>;
  readonly completionPercentage: number;
}

// ============================================================================
// Vendor & Procurement Interfaces
// ============================================================================

/**
 * Vendor procurement checklist with interview questions and contract guidance
 * 
 * @interface VendorChecklistItem
 * 
 * @property {VendorChecklistItemId} [id] - Unique identifier
 * @property {string} category - Vendor category (e.g., "Photography", "Catering")
 * @property {"must-have" | "should-have" | "nice-to-have"} priorityTier - Vendor importance
 * @property {ReadonlyArray<string>} itemsToBook - Specific services to book
 * @property {ReadonlyArray<string>} questionsToAsk - Interview questions for vendor
 * @property {ReadonlyArray<string>} contractChecks - Contract review checklist
 * @property {ReadonlyArray<string>} tips - Domain-specific procurement tips
 * @property {number} estimateLowPercent - Lower bound cost estimate (% of budget)
 * @property {number} estimateHighPercent - Upper bound cost estimate (% of budget)
 * @property {number} bookByDaysBefore - Recommended booking deadline (days before event)
 * @property {VendorStatus} [status] - Current procurement status
 * 
 * @invariant estimateLowPercent >= 0 && estimateLowPercent <= 100
 * @invariant estimateHighPercent >= estimateLowPercent && estimateHighPercent <= 100
 * @invariant bookByDaysBefore >= 0
 */
export interface VendorChecklistItem {
  readonly id?: VendorChecklistItemId;
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

// ============================================================================
// Creative Ideas Interface
// ============================================================================

/**
 * Personalized creative idea with cost tier classification
 * 
 * @interface PersonalizedIdea
 * 
 * @property {PersonalizedIdeaId} [id] - Unique identifier
 * @property {string} title - Idea title
 * @property {string} description - Detailed implementation description
 * @property {string} category - Related category (e.g., "Guest Experience", "Decor")
 * @property {"diy" | "standard" | "premium"} tier - Cost tier classification
 * @property {number} estimatedCost - Estimated implementation cost in INR
 * 
 * @invariant estimatedCost >= 0
 */
export interface PersonalizedIdea {
  readonly id?: PersonalizedIdeaId;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly tier: "diy" | "standard" | "premium";
  readonly estimatedCost: number;
}

// ============================================================================
// Complete Event Plan Interface
// ============================================================================

/**
 * Complete AI-generated event plan with all components
 * This is the primary output of the /api/plan endpoint
 * 
 * @interface EventPlan
 * 
 * @property {PlanId} [id] - Unique plan identifier
 * @property {string} summary - Executive summary of the plan
 * @property {EventType} eventType - Type of event
 * @property {ReadonlyArray<BudgetItem>} budgetBreakdown - Complete budget allocation
 * @property {ReadonlyArray<TimelineItem>} timeline - Backward-scheduled milestones
 * @property {ReadonlyArray<VendorChecklistItem>} vendorChecklist - Procurement guidance
 * @property {ReadonlyArray<PersonalizedIdea>} personalizedIdeas - Creative suggestions
 * @property {ReadonlyArray<string>} tips - General planning tips
 * @property {number} [createdAt] - Timestamp when plan was generated
 * @property {number} [totalBudget] - Original budget amount in INR
 * 
 * @example
 * {
 *   id: 'plan_abc123',
 *   summary: 'Traditional wedding plan for 250 guests...',
 *   eventType: 'wedding',
 *   budgetBreakdown: [...],
 *   timeline: [...],
 *   vendorChecklist: [...],
 *   personalizedIdeas: [...],
 *   tips: ['Book venue 6 months early', ...],
 *   createdAt: 1704067200000,
 *   totalBudget: 2000000
 * }
 */
export interface EventPlan {
  readonly id?: PlanId;
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

// ============================================================================
// Chat & Messaging Interfaces
// ============================================================================

/**
 * Chat message in conversation history
 * 
 * @interface ChatMessage
 * 
 * @property {MessageId} id - Unique message identifier
 * @property {"user" | "assistant" | "system"} role - Message sender role
 * @property {string} content - Message text content
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {"quick" | "detailed"} [modelTier] - Model tier used for assistant responses
 * 
 * @example
 * {
 *   id: 'msg_abc123',
 *   role: 'user',
 *   content: 'How can I reduce my wedding budget?',
 *   timestamp: 1704067200000
 * }
 */
export interface ChatMessage {
  readonly id: MessageId;
  readonly role: "user" | "assistant" | "system";
  readonly content: string;
  readonly timestamp: number;
  readonly modelTier?: "quick" | "detailed";
}

/**
 * Chat session with conversation history
 */
export interface ChatSession {
  readonly sessionId: string;
  readonly messages: ReadonlyArray<ChatMessage>;
  readonly eventContext?: EventContext;
  readonly createdAt: number;
  readonly updatedAt: number;
}

// ============================================================================
// Classification & Routing Interfaces
// ============================================================================

/**
 * Classification result from deterministic event classifier
 * Used for intelligent model routing and request optimization
 * 
 * @interface ClassificationResult
 * 
 * @property {QueryComplexity} complexity - Determined complexity level
 * @property {GeminiModel} model - Recommended model for this query
 * @property {EventType | null} eventType - Detected event type (if any)
 * @property {ReadonlyArray<string>} detectedCategories - Detected budget categories
 * @property {number} estimatedTokens - Estimated token count for request
 * @property {boolean} requiresChunking - Whether input should be chunked
 * 
 * @example
 * {
 *   complexity: 'complex',
 *   model: 'gemini-2.5-flash',
 *   eventType: 'wedding',
 *   detectedCategories: ['venue', 'catering'],
 *   estimatedTokens: 3500,
 *   requiresChunking: false
 * }
 */
export interface ClassificationResult {
  readonly complexity: QueryComplexity;
  readonly model: GeminiModel;
  readonly eventType: EventType | null;
  readonly detectedCategories: ReadonlyArray<string>;
  readonly estimatedTokens: number;
  readonly requiresChunking: boolean;
}

// ============================================================================
// Rate Limiting Interfaces
// ============================================================================

/**
 * Rate limit check result with quota information
 * Includes all data needed for HTTP headers
 * 
 * @interface RateLimitResult
 * 
 * @property {boolean} allowed - Whether request is allowed
 * @property {number} remaining - Remaining requests in window
 * @property {number} resetAt - Unix timestamp when quota resets
 * @property {number} limit - Maximum requests per window
 * @property {Record<string, string>} headers - HTTP headers to include in response
 * 
 * @example
 * {
 *   allowed: true,
 *   remaining: 8,
 *   resetAt: 1704067800000,
 *   limit: 10,
 *   headers: {
 *     'X-RateLimit-Limit': '10',
 *     'X-RateLimit-Remaining': '8',
 *     'X-RateLimit-Reset': '1704067800'
 *   }
 * }
 */
export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: number;
  readonly limit: number;
  readonly headers: Record<string, string>;
}

/**
 * Rate limit configuration per endpoint
 */
export interface RateLimitConfig {
  readonly maxRequests: number;
  readonly windowMs: number;
  readonly message?: string;
}

// ============================================================================
// Source & Metadata Types
// ============================================================================

/**
 * Source of a generated plan
 * - ai: Generated by actual Gemini API call
 * - fallback: Generated by offline deterministic algorithm
 */
export type PlanSource = "ai" | "fallback";

/**
 * Generation metadata for tracking and debugging
 */
export interface GenerationMetadata {
  readonly source: PlanSource;
  readonly model: GeminiModel;
  readonly tokensUsed?: number;
  readonly latencyMs?: number;
  readonly cacheHit?: boolean;
}

// ============================================================================
// API Response Interfaces
// ============================================================================

/**
 * Standard error response format
 * Consistent across all API endpoints
 * 
 * @interface ApiErrorResponse
 * 
 * @property {string} error - Human-readable error message
 * @property {string} code - Machine-readable error code (e.g., 'VALIDATION_ERROR')
 * @property {string} [details] - Additional error details for debugging
 * 
 * @example
 * {
 *   error: 'Invalid event type',
 *   code: 'VALIDATION_ERROR',
 *   details: 'eventType must be one of: wedding, birthday, community'
 * }
 */
export interface ApiErrorResponse {
  readonly error: string;
  readonly code: string;
  readonly details?: string;
}

/**
 * Successful Plan API response (POST /api/plan)
 * 
 * @interface PlanApiResponse
 */
export interface PlanApiResponse {
  readonly plan: EventPlan;
  readonly model: GeminiModel;
  readonly source: PlanSource;
  readonly classification: {
    readonly complexity: QueryComplexity;
    readonly model: GeminiModel;
  };
  readonly metadata?: GenerationMetadata;
}

/**
 * Successful Quick Ask API response (POST /api/ask)
 * 
 * @interface AskApiResponse
 */
export interface AskApiResponse {
  readonly answer: string;
  readonly model: GeminiModel;
  readonly metadata?: GenerationMetadata;
}

/**
 * Usage API response (GET /api/usage)
 * Returns current rate limit quota status
 * 
 * @interface UsageApiResponse
 */
export interface UsageApiResponse {
  readonly remaining: number;
  readonly resetAt: number;
  readonly limit: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make all properties of T mutable
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Deep partial type - makes all nested properties optional
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract readonly array element type
 */
export type ArrayElement<T> = T extends ReadonlyArray<infer U> ? U : never;

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Type guard for checking if a value is of type T
 */
export type TypeGuard<T> = (value: unknown) => value is T;

// ============================================================================
// Type Guards & Validators
// ============================================================================

/**
 * Type guard to check if a string is a valid EventType
 */
export function isEventType(value: unknown): value is EventType {
  return (
    typeof value === 'string' &&
    ['wedding', 'birthday', 'community'].includes(value)
  );
}

/**
 * Type guard to check if a string is a valid TaskStatus
 */
export function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === 'string' &&
    ['todo', 'in-progress', 'done'].includes(value)
  );
}

/**
 * Type guard to check if a string is a valid VendorStatus
 */
export function isVendorStatus(value: unknown): value is VendorStatus {
  return (
    typeof value === 'string' &&
    ['not-started', 'shortlisted', 'booked'].includes(value)
  );
}

// ============================================================================
// Branded Type Constructors
// ============================================================================

/**
 * Creates a PlanId from a string
 * Use with caution - ensures type safety at compile time
 */
export function createPlanId(id: string): PlanId {
  return id as PlanId;
}

/**
 * Creates a MessageId from a string
 * Use with caution - ensures type safety at compile time
 */
export function createMessageId(id: string): MessageId {
  return id as MessageId;
}

/**
 * Creates a BudgetItemId from a string
 * Use with caution - ensures type safety at compile time
 */
export function createBudgetItemId(id: string): BudgetItemId {
  return id as BudgetItemId;
}

/**
 * Creates a TimelineItemId from a string
 * Use with caution - ensures type safety at compile time
 */
export function createTimelineItemId(id: string): TimelineItemId {
  return id as TimelineItemId;
}

/**
 * Creates a VendorChecklistItemId from a string
 * Use with caution - ensures type safety at compile time
 */
export function createVendorChecklistItemId(id: string): VendorChecklistItemId {
  return id as VendorChecklistItemId;
}

/**
 * Creates a PersonalizedIdeaId from a string
 * Use with caution - ensures type safety at compile time
 */
export function createPersonalizedIdeaId(id: string): PersonalizedIdeaId {
  return id as PersonalizedIdeaId;
}
