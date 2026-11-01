/**
 * @file app/api/chat/route.ts
 * POST /api/chat
 * Real-time SSE (Server-Sent Events) streaming chat endpoint for planning assistance.
 */

import { NextResponse } from "next/server";
import { chatRequestSchema } from "@/lib/validators";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { checkPlanningScope } from "@/lib/guardrails";
import { streamChat } from "@/lib/gemini";
import { readJsonBody, formatIssues } from "@/lib/http";
import { createMessageId } from "@/types/event";
import type { ApiErrorResponse } from "@/types/event";

export async function POST(request: Request): Promise<Response> {
  const ip = getClientIp(request.headers);
  const rateCheck = checkRateLimit(ip, "chat");

  if (!rateCheck.allowed) {
    const errorResponse: ApiErrorResponse = {
      error: "Rate limit exceeded. Please pause before sending more chat messages.",
      code: "RATE_LIMIT_EXCEEDED",
    };
    return NextResponse.json(errorResponse, {
      status: 429,
      headers: rateCheck.headers,
    });
  }

  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    const errorResponse: ApiErrorResponse = { error: parsed.error, code: parsed.code };
    return NextResponse.json(errorResponse, {
      status: parsed.status,
      headers: rateCheck.headers,
    });
  }

  const validation = chatRequestSchema.safeParse(parsed.body);
  if (!validation.success) {
    const details = formatIssues(validation.error.issues);

    const errorResponse: ApiErrorResponse = {
      error: "Invalid chat request format.",
      code: "VALIDATION_ERROR",
      details,
    };
    return NextResponse.json(errorResponse, {
      status: 400,
      headers: rateCheck.headers,
    });
  }

  const { messages: rawMessages, eventContext } = validation.data;
  // Convert validated string IDs to the branded MessageId type for internal use
  const messages = rawMessages.map((msg) => ({
    ...msg,
    id: createMessageId(msg.id),
  }));
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

  // Domain scope check
  if (lastUserMessage) {
    const scopeCheck = checkPlanningScope(lastUserMessage.content);
    if (!scopeCheck.isEventRelated && scopeCheck.redirectMessage) {
      const redirectMsg = scopeCheck.redirectMessage;
      // Stream the polite redirection message via SSE
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: redirectMsg })}\n\n`)
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          ...rateCheck.headers,
        },
      });
    }
  }

  // Generate stream
  const encoder = new TextEncoder();
  const tokenGenerator = streamChat(messages, eventContext);

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const token of tokenGenerator) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: token })}\n\n`)
          );
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        console.error("Stream generation error:", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              text: "\n\n[Encountered a temporary streaming error]",
            })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      ...rateCheck.headers,
    },
  });
}
