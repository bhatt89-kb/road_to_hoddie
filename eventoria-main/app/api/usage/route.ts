/**
 * @file app/api/usage/route.ts
 * GET /api/usage
 * Returns the caller's current rate limit status and quota for plan generations.
 */

import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import type { UsageApiResponse } from "@/types/event";

export async function GET(request: Request): Promise<NextResponse<UsageApiResponse>> {
  const ip = getClientIp(request.headers);
  // We check usage for "usage" check or "plan" quota status without consuming an extra plan slot
  // We can query rate check
  const rateCheck = checkRateLimit(ip, "usage");

  return NextResponse.json(
    {
      remaining: rateCheck.remaining,
      resetAt: rateCheck.resetAt,
      limit: rateCheck.limit,
    },
    {
      status: 200,
      headers: rateCheck.headers,
    }
  );
}
