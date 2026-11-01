/**
 * @file lib/classifier.ts
 * Deterministic query and event classifier for two-tier Gemini model routing.
 * Routes simple queries to gemini-2.5-flash-lite and complex queries to gemini-2.5-flash.
 */

import type {
  ClassificationResult,
  EventType,
  GeminiModel,
  QueryComplexity,
} from "@/types/event";
import { DEFAULT_MODELS, LIMITS } from "./constants";

/** Patterns indicating complex planning queries */
const COMPLEX_PATTERNS: ReadonlyArray<RegExp> = [
  /budget\s*(breakdown|allocat|optimiz|calculat|cut|reduc)/i,
  /vendor\s*(comparison|negoti|contract|checklist|shortlist)/i,
  /timeline\s*(creat|build|plan|schedul|sequenc|backward)/i,
  /multi[- ]?day/i,
  /destination\s*(wedding|event|party)/i,
  /\d{3,}\s*guests?/i,
  /cultur(al|e)\s*(theme|tradition|ritual|custom)/i,
  /contingency|backup\s*plan|rain\s*plan/i,
  /full\s*(plan|comprehensive|itinerary)/i,
  /menu\s*(tasting|curat|cater)/i,
  /legal|permit|license|insurance/i,
  /coordinate|logistics|accommodat/i,
];

/** Patterns indicating simple quick queries */
const SIMPLE_PATTERNS: ReadonlyArray<RegExp> = [
  /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))\b/i,
  /^(thanks|thank\s*you|appreciate\s*it|bye|goodbye)\b/i,
  /^(what\s+is|define|who\s+is)\b/i,
  /^tip(s)?\s*(for|about|on)\b/i,
  /^quick\s*(question|tip|idea)\b/i,
  /^(how\s+much\s+(should|does))\b/i,
];

/** Event type detection patterns */
const EVENT_TYPE_PATTERNS: ReadonlyArray<{ readonly type: EventType; readonly regex: RegExp }> = [
  { type: "wedding", regex: /\b(wedding|shaadi|marriage|sangeet|mehendi|haldi|reception|bridal|groom)\b/i },
  { type: "birthday", regex: /\b(birthday|b'day|bday|turning\s+\d+|sweet\s+16|quincea|milestone\s+party)\b/i },
  { type: "community", regex: /\b(community|festival|fundraiser|marathon|cleanup|charity|block\s*party|puja|cultural\s*meet)\b/i },
];

/** Category detection patterns */
const CATEGORY_PATTERNS: ReadonlyArray<{ readonly category: string; readonly regex: RegExp }> = [
  { category: "Venue", regex: /\b(venue|hall|resort|lawn|banquet\w*|hotel|ballroom|location)\b/i },
  { category: "Catering", regex: /\b(cater\w*|food|buffet|menu|meal|drink|dessert|cake|bar)\b/i },
  { category: "Decor & Florals", regex: /\b(decor\w*|flower\w*|floral\w*|lighting|mandap|stage|theme|centerpiece)\b/i },
  { category: "Photography", regex: /\b(photo\w*|video\w*|album|drone|shoot\w*)\b/i },
  { category: "Attire & Grooming", regex: /\b(dress\w*|lehenga|sherwani|suit|makeup|hair|mehendi\s*artist|grooming)\b/i },
  { category: "Entertainment", regex: /\b(dj|music\w*|band|perform\w*|emcee|anchor|dance|show|games)\b/i },
  { category: "Invitations & Stationery", regex: /\b(invitation\w*|invite\w*|card|rsvp|stationery|e-invite)\b/i },
  { category: "Transport & Logistics", regex: /\b(transport\w*|cab|bus|valet|parking|hotel|stay|room)\b/i },
];

/**
 * Estimates token count from raw text string (heuristic: ~4 characters per token).
 *
 * @param text - Input text
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.trim().length / 4);
}

/**
 * Detects the most likely event type from raw text.
 *
 * @param text - Input text
 * @returns EventType if detected, otherwise null
 */
export function detectEventType(text: string): EventType | null {
  for (const { type, regex } of EVENT_TYPE_PATTERNS) {
    if (regex.test(text)) {
      return type;
    }
  }
  return null;
}

/**
 * Detects planning categories mentioned in the text.
 *
 * @param text - Input text
 * @returns Array of detected category names
 */
export function detectCategories(text: string): ReadonlyArray<string> {
  const found: string[] = [];
  for (const { category, regex } of CATEGORY_PATTERNS) {
    if (regex.test(text)) {
      found.push(category);
    }
  }
  return found;
}

/**
 * Classifies a user query to determine model routing, token estimate, and chunking needs.
 *
 * Routing logic:
 * 1. Plan generation or explicit multi-faceted queries -> complex tier
 * 2. Matches complex patterns -> complex tier
 * 3. Token count > 300 or multiple categories detected -> moderate/complex tier
 * 4. Matches simple greetings/short definitions -> simple tier
 * 5. Default when ambiguous -> complex tier (safety first)
 *
 * @param input - The text query or prompt to classify
 * @param isPlanGeneration - True if invoking full plan generation
 * @returns Complete classification result
 */
export function classifyQuery(
  input: string,
  isPlanGeneration = false
): ClassificationResult {
  const cleanInput = (input || "").trim();
  const estimatedTokens = estimateTokens(cleanInput);
  const detectedCategories = detectCategories(cleanInput);
  const eventType = detectEventType(cleanInput);
  const requiresChunking = estimatedTokens > LIMITS.MAX_TOKEN_ESTIMATE_FOR_CHUNKING;

  // Plan generation is always complex
  if (isPlanGeneration) {
    return {
      complexity: "complex",
      model: DEFAULT_MODELS.complex,
      eventType,
      detectedCategories,
      estimatedTokens,
      requiresChunking,
    };
  }

  // Matches simple greetings or short query patterns
  const matchesSimple = SIMPLE_PATTERNS.some((pat) => pat.test(cleanInput));
  const matchesComplex = COMPLEX_PATTERNS.some((pat) => pat.test(cleanInput));

  let complexity: QueryComplexity = "complex";
  let model: GeminiModel = DEFAULT_MODELS.complex;

  if (matchesSimple && !matchesComplex && estimatedTokens < 60 && detectedCategories.length <= 1) {
    complexity = "simple";
    model = DEFAULT_MODELS.simple;
  } else if (matchesSimple && !matchesComplex && estimatedTokens < 120 && detectedCategories.length <= 1) {
    complexity = "moderate";
    model = DEFAULT_MODELS.simple;
  } else {
    // Default when ambiguous, multi-category, or complex
    complexity = "complex";
    model = DEFAULT_MODELS.complex;
  }


  return {
    complexity,
    model,
    eventType,
    detectedCategories,
    estimatedTokens,
    requiresChunking,
  };
}
