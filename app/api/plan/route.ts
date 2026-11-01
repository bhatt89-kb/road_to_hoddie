/**
 * @file app/api/plan/route.ts
 * POST /api/plan
 * Generates a full structured Event Plan (budget, timeline, vendors, ideas).
 * Implements caching to reduce redundant AI API calls and improve response times.
 */

import { NextResponse } from "next/server";
import { eventPlanRequestSchema } from "@/lib/validators";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { classifyQuery } from "@/lib/classifier";
import { generateEventPlan } from "@/lib/gemini";
import { planCache, LRUCache } from "@/lib/cache";
import { measureAsync } from "@/lib/performance";
import { readJsonBody, formatIssues } from "@/lib/http";
import type { ApiErrorResponse, PlanApiResponse } from "@/types/event";

export async function POST(request: Request): Promise<NextResponse<PlanApiResponse | ApiErrorResponse>> {
  try {
    const ip = getClientIp(request.headers);
    const rateCheck = checkRateLimit(ip, "plan");

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before generating another event plan.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        {
          status: 429,
          headers: {
            ...rateCheck.headers,
            'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    const parsed = await readJsonBody(request);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.error, code: parsed.code },
        { status: parsed.status, headers: rateCheck.headers }
      );
    }

    const validation = eventPlanRequestSchema.safeParse(parsed.body);
    if (!validation.success) {
      const details = formatIssues(validation.error.issues);

      return NextResponse.json(
        {
          error: "Invalid event plan request parameters.",
          code: "VALIDATION_ERROR",
          details,
        },
        { status: 400, headers: rateCheck.headers }
      );
    }

    const planRequest = validation.data;
    
    // Generate cache key with ALL relevant fields to prevent incorrect cache hits
    const cacheKey = LRUCache.generateKey({
      eventType: planRequest.eventType,
      guestCount: planRequest.guestCount,
      budget: planRequest.budget,
      city: planRequest.city,
      date: planRequest.date,
      description: planRequest.description,
      preferences: planRequest.preferences,
    });

    // Check cache first
    const cachedPlan = planCache.get(cacheKey);
    if (cachedPlan) {
      return NextResponse.json(
        {
          ...cachedPlan,
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

    const classification = classifyQuery(
      `${planRequest.eventType} ${planRequest.description}`,
      true
    );

    const { plan, model, source } = await measureAsync(
      'api_plan_generation',
      () => generateEventPlan(planRequest),
      { eventType: planRequest.eventType, guestCount: planRequest.guestCount }
    );

    const response = {
      plan,
      model,
      source,
      classification: {
        complexity: classification.complexity,
        model: classification.model,
      },
      cached: false,
    };

    // Store in cache for future requests
    planCache.set(cacheKey, response);

    return NextResponse.json(
      response,
      {
        status: 200,
        headers: {
          ...rateCheck.headers,
          'X-Cache-Status': 'MISS',
        },
      }
    );
  } catch (err) {
    console.error("Unhandled error in /api/plan:", err);
    return NextResponse.json(
      {
        error: "An unexpected error occurred while generating your plan. Please try again.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
