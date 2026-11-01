/**
 * @file lib/config.ts
 * @module Config
 * @description Environment configuration with runtime validation and type-safe getters.
 * Validates all environment variables at startup and provides strongly-typed access.
 * 
 * @security All sensitive values (API keys) are accessed server-side only
 */

import { z } from 'zod';
import type { GeminiModel } from '@/types/event';

// ============================================================================
// Environment Variable Schemas
// ============================================================================

/**
 * Schema for validating environment variables
 * Ensures all required config is present and valid at startup
 */
const envSchema = z.object({
  // Gemini API Configuration
  GEMINI_API_KEY: z
    .string()
    .min(1, 'GEMINI_API_KEY is required')
    .optional()
    .describe('Google Gemini API key for AI generation'),
  
  GEMINI_MODEL_COMPLEX: z
    .string()
    .default('gemini-2.5-flash')
    .describe('Model for complex tasks (plan generation, chat)'),
  
  GEMINI_MODEL_SIMPLE: z
    .string()
    .default('gemini-2.5-flash-lite')
    .describe('Model for simple tasks (quick questions)'),
  
  // Node Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('Node.js environment'),
  
  // Next.js Configuration
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .optional()
    .describe('Public application URL'),
  
  // Feature Flags
  ENABLE_CACHING: z
    .string()
    .transform(val => val === 'true')
    .default('true')
    .describe('Enable LRU caching for API responses'),
  
  ENABLE_RATE_LIMITING: z
    .string()
    .transform(val => val === 'true')
    .default('true')
    .describe('Enable rate limiting protection'),
  
  // Performance Monitoring
  ENABLE_PERFORMANCE_MONITORING: z
    .string()
    .transform(val => val === 'true')
    .default('false')
    .describe('Enable performance metrics collection'),
  
  // Logging
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug'])
    .default('info')
    .describe('Logging verbosity level'),
});

/**
 * Validated and parsed environment variables
 */
type Env = z.infer<typeof envSchema>;

// ============================================================================
// Configuration Singleton
// ============================================================================

/**
 * Configuration class with lazy validation and type-safe getters
 * Validates environment on first access
 */
class Configuration {
  private env: Env | null = null;
  private validationError: Error | null = null;

  /**
   * Validates and returns environment configuration
   * Throws if validation fails
   * 
   * @throws {Error} If required environment variables are missing or invalid
   * @returns {Env} Validated environment configuration
   */
  private getEnv(): Env {
    // Return cached env if already validated
    if (this.env) {
      return this.env;
    }

    // Re-throw validation error if it occurred
    if (this.validationError) {
      throw this.validationError;
    }

    // Validate environment variables
    try {
      this.env = envSchema.parse({
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GEMINI_MODEL_COMPLEX: process.env.GEMINI_MODEL_COMPLEX,
        GEMINI_MODEL_SIMPLE: process.env.GEMINI_MODEL_SIMPLE,
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        ENABLE_CACHING: process.env.ENABLE_CACHING,
        ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING,
        ENABLE_PERFORMANCE_MONITORING: process.env.ENABLE_PERFORMANCE_MONITORING,
        LOG_LEVEL: process.env.LOG_LEVEL,
      });
      return this.env;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = `Environment validation failed:\n${error.errors
          .map(err => `  - ${err.path.join('.')}: ${err.message}`)
          .join('\n')}`;
        this.validationError = new Error(message);
        throw this.validationError;
      }
      throw error;
    }
  }

  // ============================================================================
  // Gemini Configuration
  // ============================================================================

  /**
   * Gets the Gemini API key
   * Returns undefined if not configured (allows fallback mode)
   * 
   * @returns {string | undefined} Gemini API key or undefined
   * @security Server-side only - never expose to client
   */
  get geminiApiKey(): string | undefined {
    return this.getEnv().GEMINI_API_KEY;
  }

  /**
   * Gets the model name for complex tasks
   * 
   * @returns {GeminiModel} Model identifier for complex operations
   */
  get geminiModelComplex(): GeminiModel {
    return this.getEnv().GEMINI_MODEL_COMPLEX as GeminiModel;
  }

  /**
   * Gets the model name for simple tasks
   * 
   * @returns {GeminiModel} Model identifier for simple operations
   */
  get geminiModelSimple(): GeminiModel {
    return this.getEnv().GEMINI_MODEL_SIMPLE as GeminiModel;
  }

  /**
   * Checks if Gemini API is configured
   * 
   * @returns {boolean} True if API key is available
   */
  get isGeminiConfigured(): boolean {
    return !!this.geminiApiKey;
  }

  // ============================================================================
  // Environment & Runtime
  // ============================================================================

  /**
   * Gets the Node.js environment
   * 
   * @returns {'development' | 'production' | 'test'} Current environment
   */
  get nodeEnv(): 'development' | 'production' | 'test' {
    return this.getEnv().NODE_ENV;
  }

  /**
   * Checks if running in production
   * 
   * @returns {boolean} True if NODE_ENV is 'production'
   */
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  /**
   * Checks if running in development
   * 
   * @returns {boolean} True if NODE_ENV is 'development'
   */
  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  /**
   * Checks if running in test mode
   * 
   * @returns {boolean} True if NODE_ENV is 'test'
   */
  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  /**
   * Gets the public application URL
   * 
   * @returns {string | undefined} Application URL or undefined
   */
  get appUrl(): string | undefined {
    return this.getEnv().NEXT_PUBLIC_APP_URL;
  }

  // ============================================================================
  // Feature Flags
  // ============================================================================

  /**
   * Checks if caching is enabled
   * 
   * @returns {boolean} True if caching should be used
   */
  get isCachingEnabled(): boolean {
    return this.getEnv().ENABLE_CACHING;
  }

  /**
   * Checks if rate limiting is enabled
   * 
   * @returns {boolean} True if rate limiting should be enforced
   */
  get isRateLimitingEnabled(): boolean {
    return this.getEnv().ENABLE_RATE_LIMITING;
  }

  /**
   * Checks if performance monitoring is enabled
   * 
   * @returns {boolean} True if metrics should be collected
   */
  get isPerformanceMonitoringEnabled(): boolean {
    return this.getEnv().ENABLE_PERFORMANCE_MONITORING;
  }

  // ============================================================================
  // Logging Configuration
  // ============================================================================

  /**
   * Gets the logging level
   * 
   * @returns {'error' | 'warn' | 'info' | 'debug'} Log verbosity level
   */
  get logLevel(): 'error' | 'warn' | 'info' | 'debug' {
    return this.getEnv().LOG_LEVEL;
  }

  /**
   * Checks if debug logging is enabled
   * 
   * @returns {boolean} True if log level is 'debug'
   */
  get isDebugEnabled(): boolean {
    return this.logLevel === 'debug';
  }

  // ============================================================================
  // Validation & Health Check
  // ============================================================================

  /**
   * Validates all environment variables
   * Useful for startup health checks
   * 
   * @throws {Error} If validation fails
   * @returns {boolean} True if all variables are valid
   */
  validate(): boolean {
    this.getEnv();
    return true;
  }

  /**
   * Gets environment configuration summary for debugging
   * Redacts sensitive values in production
   * 
   * @returns {Record<string, unknown>} Configuration summary
   */
  getSummary(): Record<string, unknown> {
    const env = this.getEnv();
    return {
      nodeEnv: env.NODE_ENV,
      geminiConfigured: this.isGeminiConfigured,
      geminiModelComplex: env.GEMINI_MODEL_COMPLEX,
      geminiModelSimple: env.GEMINI_MODEL_SIMPLE,
      cachingEnabled: env.ENABLE_CACHING,
      rateLimitingEnabled: env.ENABLE_RATE_LIMITING,
      performanceMonitoringEnabled: env.ENABLE_PERFORMANCE_MONITORING,
      logLevel: env.LOG_LEVEL,
      appUrl: env.NEXT_PUBLIC_APP_URL,
    };
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

/**
 * Global configuration instance
 * Validates environment variables on first access
 * 
 * @example
 * import { config } from '@/lib/config';
 * 
 * if (config.isGeminiConfigured) {
 *   const apiKey = config.geminiApiKey;
 * }
 */
export const config = new Configuration();

/**
 * Export type for testing and type inference
 */
export type { Env };
