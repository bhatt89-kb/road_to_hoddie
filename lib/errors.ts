/**
 * @file lib/errors.ts
 * @module Errors
 * @description Custom error classes and error handling utilities for the application.
 * Provides structured error responses with proper status codes and error context.
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error|Error Documentation}
 */

import { ERROR_CODES, HTTP_STATUS } from './constants';
import type { ApiErrorResponse } from '@/types/event';

// ============================================================================
// Base Application Error
// ============================================================================

/**
 * Base error class for all application errors
 * Extends native Error with additional context
 * 
 * @class ApplicationError
 * @extends Error
 */
export class ApplicationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    statusCode: number = HTTP_STATUS.INTERNAL_ERROR,
    details?: unknown,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts error to API response format
   * 
   * @returns {ApiErrorResponse} Formatted error response
   */
  toJSON(): ApiErrorResponse {
    return {
      error: this.message,
      code: this.code,
      details: this.details instanceof Error ? this.details.message : (typeof this.details === 'string' ? this.details : undefined),
    };
  }

  /**
   * Converts error to HTTP Response object
   * 
   * @returns {Response} Next.js Response object
   */
  toResponse(): Response {
    return Response.json(this.toJSON(), {
      status: this.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

/**
 * Validation error for invalid request parameters
 * Thrown when request data fails validation
 * 
 * @class ValidationError
 * @extends ApplicationError
 * 
 * @example
 * throw new ValidationError('Invalid guest count', { guestCount: -5 });
 */
export class ValidationError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(
      message,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
      details,
      true
    );
  }
}

/**
 * Error for malformed or unparseable request body
 * 
 * @class BadRequestError
 * @extends ApplicationError
 */
export class BadRequestError extends ApplicationError {
  constructor(message: string = 'Invalid request format', details?: unknown) {
    super(
      message,
      ERROR_CODES.BAD_REQUEST,
      HTTP_STATUS.BAD_REQUEST,
      details,
      true
    );
  }
}

// ============================================================================
// Rate Limiting Errors
// ============================================================================

/**
 * Rate limit exceeded error
 * Includes retry-after information
 * 
 * @class RateLimitError
 * @extends ApplicationError
 * 
 * @example
 * throw new RateLimitError('Too many requests', { resetAt: Date.now() + 900000 });
 */
export class RateLimitError extends ApplicationError {
  public readonly retryAfter?: number;

  constructor(
    message: string = 'Too many requests. Please try again later.',
    retryAfter?: number,
    details?: unknown
  ) {
    super(
      message,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      details,
      true
    );
    this.retryAfter = retryAfter;
  }

  /**
   * Override toResponse to include Retry-After header
   */
  override toResponse(): Response {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.retryAfter) {
      headers['Retry-After'] = Math.ceil(this.retryAfter / 1000).toString();
    }

    return Response.json(this.toJSON(), {
      status: this.statusCode,
      headers,
    });
  }
}

// ============================================================================
// Authentication & Authorization Errors
// ============================================================================

/**
 * Unauthorized error for missing or invalid authentication
 * 
 * @class UnauthorizedError
 * @extends ApplicationError
 */
export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Authentication required', details?: unknown) {
    super(
      message,
      ERROR_CODES.UNAUTHORIZED,
      HTTP_STATUS.UNAUTHORIZED,
      details,
      true
    );
  }
}

/**
 * Forbidden error for insufficient permissions
 * 
 * @class ForbiddenError
 * @extends ApplicationError
 */
export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Access forbidden', details?: unknown) {
    super(
      message,
      ERROR_CODES.UNAUTHORIZED,
      HTTP_STATUS.FORBIDDEN,
      details,
      true
    );
  }
}

// ============================================================================
// Resource Errors
// ============================================================================

/**
 * Not found error for missing resources
 * 
 * @class NotFoundError
 * @extends ApplicationError
 * 
 * @example
 * throw new NotFoundError('Event plan not found', { planId: 'plan_123' });
 */
export class NotFoundError extends ApplicationError {
  constructor(message: string = 'Resource not found', details?: unknown) {
    super(
      message,
      ERROR_CODES.NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
      details,
      true
    );
  }
}

// ============================================================================
// AI & External Service Errors
// ============================================================================

/**
 * Timeout error for operations that exceed time limits
 * 
 * @class TimeoutError
 * @extends ApplicationError
 */
export class TimeoutError extends ApplicationError {
  constructor(
    message: string = 'Operation timed out',
    operation?: string,
    timeoutMs?: number
  ) {
    super(
      message,
      ERROR_CODES.TIMEOUT,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      { operation, timeoutMs },
      true
    );
  }
}

/**
 * Error for AI-generated content that fails validation
 * 
 * @class AIGenerationError
 * @extends ApplicationError
 */
export class AIGenerationError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(
      message,
      ERROR_CODES.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_ERROR,
      details,
      true
    );
  }
}

/**
 * Error for requests outside application scope
 * Used by guardrails to reject off-topic queries
 * 
 * @class OffScopeError
 * @extends ApplicationError
 * 
 * @example
 * throw new OffScopeError('This query is not related to event planning');
 */
export class OffScopeError extends ApplicationError {
  constructor(
    message: string = 'Query is outside the scope of event planning',
    details?: unknown
  ) {
    super(
      message,
      ERROR_CODES.OFF_SCOPE,
      HTTP_STATUS.BAD_REQUEST,
      details,
      true
    );
  }
}

// ============================================================================
// Internal Server Errors
// ============================================================================

/**
 * Generic internal server error
 * Used for unexpected errors
 * 
 * @class InternalServerError
 * @extends ApplicationError
 */
export class InternalServerError extends ApplicationError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(
      message,
      ERROR_CODES.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_ERROR,
      details,
      false // Non-operational - indicates bug
    );
  }
}

/**
 * Configuration error for missing or invalid configuration
 * 
 * @class ConfigurationError
 * @extends ApplicationError
 */
export class ConfigurationError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(
      message,
      ERROR_CODES.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_ERROR,
      details,
      false // Non-operational - requires admin intervention
    );
  }
}

// ============================================================================
// Error Type Guards
// ============================================================================

/**
 * Type guard to check if error is an ApplicationError
 * 
 * @param {unknown} error - Error to check
 * @returns {error is ApplicationError} True if error is ApplicationError
 */
export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}

/**
 * Type guard to check if error is operational (expected/recoverable)
 * 
 * @param {unknown} error - Error to check
 * @returns {boolean} True if error is operational
 */
export function isOperationalError(error: unknown): boolean {
  if (isApplicationError(error)) {
    return error.isOperational;
  }
  return false;
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Converts any error to a standardized ApplicationError
 * Useful for normalizing errors from external libraries
 * 
 * @param {unknown} error - Error to normalize
 * @returns {ApplicationError} Normalized application error
 * 
 * @example
 * try {
 *   await externalAPI.call();
 * } catch (error) {
 *   throw normalizeError(error);
 * }
 */
export function normalizeError(error: unknown): ApplicationError {
  // Already an ApplicationError
  if (isApplicationError(error)) {
    return error;
  }

  // Standard Error object
  if (error instanceof Error) {
    return new InternalServerError(error.message, {
      originalError: error.name,
      stack: error.stack,
    });
  }

  // String error
  if (typeof error === 'string') {
    return new InternalServerError(error);
  }

  // Unknown error type
  return new InternalServerError('An unexpected error occurred', { error });
}

/**
 * Safely extracts error message from unknown error
 * 
 * @param {unknown} error - Error object
 * @returns {string} Error message
 * 
 * @example
 * const message = getErrorMessage(error);
 * console.error(message);
 */
export function getErrorMessage(error: unknown): string {
  if (isApplicationError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

/**
 * Logs error with appropriate severity based on error type
 * 
 * @param {unknown} error - Error to log
 * @param {string} [context] - Additional context for logging
 * 
 * @example
 * try {
 *   await generatePlan(request);
 * } catch (error) {
 *   logError(error, 'POST /api/plan');
 *   throw error;
 * }
 */
export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[${context}]` : '';
  
  if (isApplicationError(error)) {
    if (error.isOperational) {
      // Operational errors are expected - log as warning
      console.warn(`${prefix} Operational error:`, error.message, error.details);
    } else {
      // Non-operational errors indicate bugs - log as error with full stack
      console.error(`${prefix} Non-operational error:`, error);
    }
  } else if (error instanceof Error) {
    console.error(`${prefix} Unexpected error:`, error);
  } else {
    console.error(`${prefix} Unknown error:`, error);
  }
}

/**
 * Creates a standardized error response from any error
 * Hides internal details in production
 * 
 * @param {unknown} error - Error to convert
 * @param {boolean} [includeStack=false] - Whether to include stack trace
 * @returns {Response} Next.js Response object
 * 
 * @example
 * export async function POST(request: Request) {
 *   try {
 *     return await handleRequest(request);
 *   } catch (error) {
 *     return createErrorResponse(error);
 *   }
 * }
 */
export function createErrorResponse(
  error: unknown,
  includeStack: boolean = false
): Response {
  const normalizedError = normalizeError(error);
  
  // Log the error
  logError(normalizedError);
  
  // Don't expose internal error details in production
  if (!includeStack && !normalizedError.isOperational) {
    return Response.json(
      {
        error: 'An unexpected error occurred',
        code: ERROR_CODES.INTERNAL_ERROR,
      },
      {
        status: HTTP_STATUS.INTERNAL_ERROR,
      }
    );
  }
  
  return normalizedError.toResponse();
}

/**
 * Async error boundary wrapper for API route handlers
 * Automatically catches and converts errors to proper responses
 * 
 * @template T - Return type of handler
 * @param {() => Promise<T>} handler - Async handler function
 * @returns {Promise<T>} Handler result or error response
 * 
 * @example
 * export async function POST(request: Request) {
 *   return withErrorHandling(async () => {
 *     const data = await request.json();
 *     return Response.json({ success: true });
 *   });
 * }
 */
export async function withErrorHandling<T>(
  handler: () => Promise<T>
): Promise<T | Response> {
  try {
    return await handler();
  } catch (error) {
    return createErrorResponse(error);
  }
}

// ============================================================================
// Error Recovery Strategies
// ============================================================================

/**
 * Retry configuration for operations
 */
export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  shouldRetry: (error: unknown) => boolean;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  shouldRetry: (error: unknown) => {
    // Retry on timeout or service unavailable errors
    if (isApplicationError(error)) {
      return error.statusCode === HTTP_STATUS.SERVICE_UNAVAILABLE;
    }
    return false;
  },
};

/**
 * Executes an operation with automatic retry on failure
 * 
 * @template T - Return type
 * @param {() => Promise<T>} operation - Operation to execute
 * @param {Partial<RetryConfig>} [config] - Retry configuration
 * @returns {Promise<T>} Operation result
 * @throws {ApplicationError} If all retry attempts fail
 * 
 * @example
 * const result = await withRetry(
 *   async () => await externalAPI.call(),
 *   { maxAttempts: 5, delayMs: 500 }
 * );
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's not a retryable error
      if (!finalConfig.shouldRetry(error)) {
        throw error;
      }

      // Don't delay on last attempt
      if (attempt < finalConfig.maxAttempts) {
        const delay = finalConfig.delayMs * Math.pow(finalConfig.backoffMultiplier, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw normalizeError(lastError);
}
