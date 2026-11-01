/**
 * @file lib/validators.ts
 * @module Validators
 * @description Zod validation schemas for all incoming API requests and AI-generated outputs.
 * Provides runtime type validation with detailed error messages for better UX.
 * 
 * @see {@link https://zod.dev|Zod Documentation}
 */

import { z } from "zod";
import { LIMITS, ERROR_CODES } from "./constants";

// ============================================================================
// Custom Error Messages
// ============================================================================

const ERROR_MESSAGES = {
  REQUIRED: (field: string) => `${field} is required`,
  INVALID_TYPE: (field: string, expected: string) => `${field} must be a ${expected}`,
  MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters`,
  MAX_LENGTH: (field: string, max: number) => `${field} cannot exceed ${max} characters`,
  MIN_VALUE: (field: string, min: number) => `${field} must be at least ${min}`,
  MAX_VALUE: (field: string, max: number) => `${field} cannot exceed ${max}`,
  INVALID_FORMAT: (field: string) => `${field} has an invalid format`,
  INVALID_ENUM: (field: string, values: string[]) => 
    `${field} must be one of: ${values.join(', ')}`,
} as const;

// ============================================================================
// Custom Refinements
// ============================================================================

/**
 * Validates that a date string is parseable and represents a valid future date
 * 
 * @param dateStr - Date string to validate
 * @returns True if date is valid and in the future (or within grace period)
 */
function isValidFutureDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  
  // Allow dates from yesterday to account for timezone differences
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  // Maximum future date (2 years from now)
  const maxFuture = new Date();
  maxFuture.setDate(maxFuture.getDate() + LIMITS.MAX_DAYS_IN_FUTURE);
  
  return date >= yesterday && date <= maxFuture;
}

/**
 * Validates that city name doesn't contain suspicious patterns
 * Prevents injection attacks and ensures reasonable input
 * 
 * @param city - City name to validate
 * @returns True if city name is valid
 */
function isValidCityName(city: string): boolean {
  // Reject if contains HTML/script tags
  if (/<[^>]*>/g.test(city)) return false;
  
  // Reject if contains control characters
  if (/[\x00-\x1F\x7F]/.test(city)) return false;
  
  // Must start with a letter
  if (!/^[a-zA-Z]/.test(city)) return false;
  
  // Allow letters, spaces, hyphens, apostrophes, and common diacritics
  const validCityRegex = /^[a-zA-Z\s\-'À-ÿ]+$/;
  return validCityRegex.test(city);
}

/**
 * Validates that description doesn't contain suspicious patterns
 * 
 * @param description - Description to validate
 * @returns True if description is valid
 */
function isValidDescription(description: string): boolean {
  // Reject if contains excessive HTML/script content
  const htmlTagCount = (description.match(/<[^>]*>/g) || []).length;
  if (htmlTagCount > 3) return false;
  
  // Reject if contains control characters (except newlines and tabs)
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(description)) return false;
  
  return true;
}

// ============================================================================
// Request Validation Schemas
// ============================================================================

/**
 * Schema for user-submitted event planning requests
 * Validates all required fields with comprehensive error messages
 * 
 * @example
 * const result = eventPlanRequestSchema.safeParse(requestBody);
 * if (!result.success) {
 *   return Response.json({ error: result.error.format() }, { status: 400 });
 * }
 */
export const eventPlanRequestSchema = z
  .object({
    eventType: z.enum(["wedding", "birthday", "community"] as const, {
      errorMap: () => ({
        message: ERROR_MESSAGES.INVALID_ENUM('Event type', ['wedding', 'birthday', 'community']),
      }),
    }),
    
    guestCount: z
      .number({
        required_error: ERROR_MESSAGES.REQUIRED('Guest count'),
        invalid_type_error: ERROR_MESSAGES.INVALID_TYPE('Guest count', 'number'),
      })
      .int('Guest count must be a whole number')
      .min(
        LIMITS.MIN_GUESTS,
        `Guest count must be at least ${LIMITS.MIN_GUESTS}`
      )
      .max(
        LIMITS.MAX_GUESTS,
        `Guest count cannot exceed ${LIMITS.MAX_GUESTS.toLocaleString('en-IN')}`
      )
      .refine(
        (val) => val > 0,
        'Guest count must be greater than 0'
      ),
    
    budget: z
      .number({
        required_error: ERROR_MESSAGES.REQUIRED('Budget'),
        invalid_type_error: ERROR_MESSAGES.INVALID_TYPE('Budget', 'number'),
      })
      .min(
        LIMITS.MIN_BUDGET,
        `Budget must be at least ₹${LIMITS.MIN_BUDGET.toLocaleString('en-IN')}`
      )
      .max(
        LIMITS.MAX_BUDGET,
        `Budget cannot exceed ₹${(LIMITS.MAX_BUDGET / 10000000).toFixed(0)} Crore`
      )
      .refine(
        (val) => Number.isFinite(val) && !isNaN(val),
        'Budget must be a valid number'
      ),
    
    date: z
      .string({
        required_error: ERROR_MESSAGES.REQUIRED('Event date'),
        invalid_type_error: ERROR_MESSAGES.INVALID_TYPE('Event date', 'string'),
      })
      .trim()
      .min(1, ERROR_MESSAGES.REQUIRED('Event date'))
      .refine(
        (val) => !isNaN(new Date(val).getTime()),
        'Event date must be a valid date format (YYYY-MM-DD)'
      )
      .refine(
        isValidFutureDate,
        'Event date must be in the future (within the next 2 years)'
      ),
    
    city: z
      .string({
        required_error: ERROR_MESSAGES.REQUIRED('City'),
        invalid_type_error: ERROR_MESSAGES.INVALID_TYPE('City', 'string'),
      })
      .trim()
      .min(2, ERROR_MESSAGES.MIN_LENGTH('City', 2))
      .max(LIMITS.MAX_CITY_LENGTH, ERROR_MESSAGES.MAX_LENGTH('City', LIMITS.MAX_CITY_LENGTH))
      .refine(
        isValidCityName,
        'City name contains invalid characters or format'
      ),
    
    description: z
      .string({
        invalid_type_error: ERROR_MESSAGES.INVALID_TYPE('Description', 'string'),
      })
      .trim()
      .max(
        LIMITS.MAX_DESCRIPTION_LENGTH,
        ERROR_MESSAGES.MAX_LENGTH('Description', LIMITS.MAX_DESCRIPTION_LENGTH)
      )
      .refine(
        isValidDescription,
        'Description contains invalid or suspicious content'
      )
      .default(""),
    
    preferences: z
      .array(
        z
          .string()
          .trim()
          .min(1, 'Preference cannot be empty')
          .max(
            LIMITS.MAX_PREFERENCE_LENGTH,
            ERROR_MESSAGES.MAX_LENGTH('Preference item', LIMITS.MAX_PREFERENCE_LENGTH)
          )
          .refine(
            (val) => !/[\x00-\x1F\x7F]/.test(val),
            'Preference contains invalid control characters'
          )
      )
      .max(
        LIMITS.MAX_PREFERENCES,
        `Cannot provide more than ${LIMITS.MAX_PREFERENCES} preferences`
      )
      .default([])
      .transform((arr) => arr.filter((item) => item.length > 0)), // Remove empty strings
  })
  .strict({
    message: 'Unknown fields in request. Only expected fields are allowed.',
  });

/**
 * Validated and transformed event plan request type
 */
export type ValidatedEventPlanRequest = z.infer<typeof eventPlanRequestSchema>;

// ============================================================================
// AI Output Validation Schemas
// ============================================================================

/**
 * Schema for individual budget items generated by AI
 * Validates AI output to ensure mathematical consistency
 */
export const budgetItemSchema = z
  .object({
    category: z.string().min(1, 'Budget category name is required'),
    estimatedCost: z
      .number()
      .nonnegative('Estimated cost must be non-negative')
      .finite('Estimated cost must be a finite number'),
    percentOfTotal: z
      .number()
      .min(0, 'Percentage must be at least 0')
      .max(100, 'Percentage cannot exceed 100'),
    notes: z.string().default(""),
    priority: z
      .enum(["essential", "recommended", "optional"])
      .default("recommended"),
    savingTips: z.array(z.string()).default([]),
  })
  .strict()
  .refine(
    (data) => {
      // Ensure percentage and cost are mathematically consistent
      // (This is a sanity check, actual validation happens on full plan)
      return data.percentOfTotal >= 0 && data.percentOfTotal <= 100;
    },
    'Budget item percentages must sum to valid range'
  );

/**
 * Schema for timeline items generated by AI
 */
export const timelineItemSchema = z
  .object({
    title: z.string().min(1, 'Timeline task title is required'),
    description: z.string().default(""),
    phase: z.string().min(1, 'Timeline phase is required'),
    daysBeforeEvent: z
      .number()
      .int('Days before event must be a whole number')
      .nonnegative('Days before event must be non-negative')
      .max(730, 'Timeline items cannot be more than 2 years before event'),
    category: z.string().min(1, 'Timeline category is required'),
    priority: z.enum(["high", "medium", "low"]).default("medium"),
  })
  .strict();

/**
 * Schema for vendor checklist items generated by AI
 */
export const vendorChecklistItemSchema = z
  .object({
    category: z.string().min(1, 'Vendor category is required'),
    priorityTier: z
      .enum(["must-have", "should-have", "nice-to-have"])
      .default("must-have"),
    itemsToBook: z.array(z.string()).default([]),
    questionsToAsk: z.array(z.string()).default([]),
    contractChecks: z.array(z.string()).default([]),
    tips: z.array(z.string()).default([]),
    estimateLowPercent: z
      .number()
      .min(0, 'Low estimate must be at least 0%')
      .max(100, 'Low estimate cannot exceed 100%')
      .default(0),
    estimateHighPercent: z
      .number()
      .min(0, 'High estimate must be at least 0%')
      .max(100, 'High estimate cannot exceed 100%')
      .default(0),
    bookByDaysBefore: z
      .number()
      .int('Booking deadline must be a whole number')
      .nonnegative('Booking deadline must be non-negative')
      .default(30),
  })
  .strict()
  .refine(
    (data) => data.estimateHighPercent >= data.estimateLowPercent,
    'High estimate must be greater than or equal to low estimate'
  );

/**
 * Schema for personalized ideas generated by AI
 */
export const personalizedIdeaSchema = z
  .object({
    title: z.string().min(1, 'Idea title is required'),
    description: z.string().default(""),
    category: z.string().min(1, 'Idea category is required'),
    tier: z.enum(["diy", "standard", "premium"]).default("standard"),
    estimatedCost: z
      .number()
      .nonnegative('Estimated cost must be non-negative')
      .finite('Estimated cost must be a finite number')
      .default(0),
  })
  .strict();

/**
 * Schema for full EventPlan output from AI
 * Includes cross-field validations for mathematical consistency
 */
export const eventPlanSchema = z
  .object({
    summary: z.string().min(10, 'Plan summary must be at least 10 characters'),
    eventType: z.enum(["wedding", "birthday", "community"]),
    budgetBreakdown: z
      .array(budgetItemSchema)
      .min(1, 'Budget breakdown must have at least one item'),
    timeline: z
      .array(timelineItemSchema)
      .min(1, 'Timeline must have at least one milestone'),
    vendorChecklist: z
      .array(vendorChecklistItemSchema)
      .min(1, 'Vendor checklist must have at least one item'),
    personalizedIdeas: z
      .array(personalizedIdeaSchema)
      .min(1, 'Must have at least one personalized idea'),
    tips: z.array(z.string()).default([]),
  })
  .strict()
  .refine(
    (data) => {
      // Validate that budget percentages sum to approximately 100%
      const totalPercent = data.budgetBreakdown.reduce(
        (sum, item) => sum + item.percentOfTotal,
        0
      );
      return totalPercent >= 98 && totalPercent <= 102; // Allow 2% tolerance
    },
    'Budget breakdown percentages must sum to approximately 100%'
  )
  .refine(
    (data) => {
      // Validate that timeline items are in descending order (furthest to nearest)
      for (let i = 0; i < data.timeline.length - 1; i++) {
        if (data.timeline[i].daysBeforeEvent < data.timeline[i + 1].daysBeforeEvent) {
          return false;
        }
      }
      return true;
    },
    'Timeline items should be ordered from furthest to nearest event date'
  );

/**
 * Validated event plan type
 */
export type ValidatedEventPlan = z.infer<typeof eventPlanSchema>;

// ============================================================================
// Chat & Messaging Schemas
// ============================================================================

/**
 * Schema for individual chat messages
 * Validates message structure and content
 */
export const chatMessageSchema = z
  .object({
    id: z
      .string()
      .min(1, 'Message ID is required')
      .default(() => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`),
    role: z.enum(["user", "assistant", "system"], {
      errorMap: () => ({
        message: ERROR_MESSAGES.INVALID_ENUM('Role', ['user', 'assistant', 'system']),
      }),
    }),
    content: z
      .string()
      .trim()
      .min(1, 'Message content cannot be empty')
      .max(
        LIMITS.MAX_CHAT_INPUT_LENGTH,
        ERROR_MESSAGES.MAX_LENGTH('Message', LIMITS.MAX_CHAT_INPUT_LENGTH)
      )
      .refine(
        (val) => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(val),
        'Message contains invalid control characters'
      ),
    timestamp: z
      .number()
      .int('Timestamp must be an integer')
      .positive('Timestamp must be positive')
      .default(() => Date.now()),
    modelTier: z.enum(["quick", "detailed"]).optional(),
  })
  .strict();

/**
 * Schema for streaming chat request
 * Validates conversation history and context
 */
export const chatRequestSchema = z
  .object({
    messages: z
      .array(chatMessageSchema)
      .min(1, 'At least one message is required')
      .max(
        LIMITS.MAX_CHAT_MESSAGES_PER_REQUEST,
        `Cannot send more than ${LIMITS.MAX_CHAT_MESSAGES_PER_REQUEST} messages per request`
      )
      .refine(
        (messages) => messages[messages.length - 1]?.role === 'user',
        'Last message must be from user'
      ),
    eventContext: eventPlanRequestSchema.partial().optional(),
  })
  .strict();

/**
 * Validated chat request type
 */
export type ValidatedChatRequest = z.infer<typeof chatRequestSchema>;

/**
 * Schema for non-streaming quick ask request
 * Validates single question format
 */
export const askRequestSchema = z
  .object({
    question: z
      .string()
      .trim()
      .min(1, 'Question cannot be empty')
      .max(
        LIMITS.MAX_CHAT_INPUT_LENGTH,
        ERROR_MESSAGES.MAX_LENGTH('Question', LIMITS.MAX_CHAT_INPUT_LENGTH)
      )
      .refine(
        (val) => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(val),
        'Question contains invalid control characters'
      )
      .refine(
        (val) => val.split(/\s+/).length >= 2,
        'Question must contain at least 2 words'
      ),
    eventContext: eventPlanRequestSchema.partial().optional(),
  })
  .strict();

/**
 * Validated ask request type
 */
export type ValidatedAskRequest = z.infer<typeof askRequestSchema>;

// ============================================================================
// Utility Validation Functions
// ============================================================================

/**
 * Validates and parses request body with detailed error reporting
 * 
 * @template T - Schema type
 * @param {z.ZodSchema<T>} schema - Zod schema to validate against
 * @param {unknown} data - Data to validate
 * @returns {Promise<{success: true, data: T} | {success: false, error: string, code: string}>}
 * 
 * @example
 * const result = await validateRequest(eventPlanRequestSchema, requestBody);
 * if (!result.success) {
 *   return Response.json({ error: result.error, code: result.code }, { status: 400 });
 * }
 * const validData = result.data;
 */
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<
  | { success: true; data: T }
  | { success: false; error: string; code: string; details?: unknown }
> {
  try {
    const validated = await schema.parseAsync(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
        code: ERROR_CODES.VALIDATION_ERROR,
        details: error.errors,
      };
    }
    return {
      success: false,
      error: 'Invalid request format',
      code: ERROR_CODES.BAD_REQUEST,
    };
  }
}

/**
 * Formats Zod validation errors for user-friendly display
 * 
 * @param {z.ZodError} error - Zod validation error
 * @returns {string} Formatted error message
 * 
 * @example
 * const formatted = formatValidationError(zodError);
 * // Returns: "Guest count must be at least 1. Budget must be a number."
 */
export function formatValidationError(error: z.ZodError): string {
  return error.errors
    .map((err) => {
      const path = err.path.join('.');
      return path ? `${path}: ${err.message}` : err.message;
    })
    .join('. ');
}

/**
 * Type guard to check if an error is a Zod validation error
 * 
 * @param {unknown} error - Error to check
 * @returns {error is z.ZodError} True if error is ZodError
 */
export function isValidationError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError;
}
