/**
 * @file app/api/ask/route.ts
 * POST /api/ask
 * Non-streaming quick answer endpoint for targeted planning questions using gemini-2.5-flash-lite.
 * Implements caching for frequently asked questions to reduce API calls.
 */

import { NextResponse } from "next/server";
import { askRequestSchema } from "@/lib/validators";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { checkPlanningScope } from "@/lib/guardrails";
import { askQuestion, getModelForTier } from "@/lib/gemini";
import { askCache } from "@/lib/cache";
import { measureAsync } from "@/lib/performance";
import type { ApiErrorResponse, AskApiResponse, GeminiModel } from "@/types/event";

export async function POST(request: Request): Promise<NextResponse<AskApiResponse | ApiErrorResponse>> {
  try {
    const ip = getClientIp(request.headers);
    const rateCheck = checkRateLimit(ip, "ask");

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded for quick questions. Please wait a moment.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429, headers: rateCheck.headers }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Malformed JSON payload.",
          code: "INVALID_JSON",
        },
        { status: 400, headers: rateCheck.headers }
      );
    }

    const validation = askRequestSchema.safeParse(body);
    if (!validation.success) {
      const details = validation.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");

      return NextResponse.json(
        {
          error: "Invalid ask request parameters.",
          code: "VALIDATION_ERROR",
          details,
        },
        { status: 400, headers: rateCheck.headers }
      );
    }

    const { question, eventContext } = validation.data;
    const scopeCheck = checkPlanningScope(question);

    if (!scopeCheck.isEventRelated && scopeCheck.redirectMessage) {
      return NextResponse.json(
        {
          answer: scopeCheck.redirectMessage,
          model: getModelForTier("simple") as GeminiModel,
        },
        { status: 200, headers: rateCheck.headers }
      );
    }

    // Generate cache key from question and context
    const cacheKey = `${question.toLowerCase().trim()}:${JSON.stringify(eventContext || {})}`;
    
    // Check cache first
    const cachedAnswer = askCache.get(cacheKey);
    if (cachedAnswer) {
      return NextResponse.json(
        {
          answer: cachedAnswer,
          model: getModelForTier("simple") as GeminiModel,
          cached: true,
        },
        {
          status: 200,
          headers: {
            ...rateCheck.headers,
            'X-Cache-Status': 'HIT',
          },
        }
      );
    }

    const { answer, model } = await measureAsync(
      'api_ask_question',
      () => askQuestion(question, eventContext),
      { questionLength: question.length }
    );

    // Store in cache for future requests
    askCache.set(cacheKey, answer);

    return NextResponse.json(
      {
        answer,
        model,
        cached: false,
      },
      {
        status: 200,
        headers: {
          ...rateCheck.headers,
          'X-Cache-Status': 'MISS',
        },
      }
    );
  } catch (err) {
    console.error("Unhandled error in /api/ask:", err);
    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try asking again.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
