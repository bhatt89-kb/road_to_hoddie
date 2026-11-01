/**
 * @file lib/http.ts
 * @module Http
 * @description Shared helpers for API route handlers: size-capped JSON body
 * parsing and consistent validation-error formatting.
 *
 * @security The body is read as a stream and aborted as soon as it exceeds the
 * limit, so a client cannot bypass the cap by omitting or falsifying the
 * `Content-Length` header (e.g. chunked transfer encoding).
 */

import { LIMITS } from "./constants";

export type JsonBodyResult =
  | { ok: true; body: unknown }
  | {
      ok: false;
      status: 400 | 413;
      error: string;
      code: "INVALID_JSON" | "PAYLOAD_TOO_LARGE";
    };

const TOO_LARGE: JsonBodyResult = {
  ok: false,
  status: 413,
  error: "Request body too large.",
  code: "PAYLOAD_TOO_LARGE",
};

const INVALID_JSON: JsonBodyResult = {
  ok: false,
  status: 400,
  error: "Malformed JSON payload.",
  code: "INVALID_JSON",
};

/**
 * Reads and parses a JSON request body while enforcing a hard byte limit.
 *
 * @param request - Incoming request
 * @param maxBytes - Maximum accepted body size in bytes
 * @returns Parsed body, or a ready-to-send error description
 */
export async function readJsonBody(
  request: Request,
  maxBytes: number = LIMITS.MAX_REQUEST_BODY_BYTES
): Promise<JsonBodyResult> {
  // Fast path: reject honest oversized requests without reading anything
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return TOO_LARGE;
  }

  let text: string;
  try {
    const reader = request.body?.getReader();
    if (!reader) {
      text = await request.text();
      if (new TextEncoder().encode(text).byteLength > maxBytes) return TOO_LARGE;
    } else {
      const decoder = new TextDecoder();
      let received = 0;
      text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > maxBytes) {
          await reader.cancel();
          return TOO_LARGE;
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    }
  } catch {
    return INVALID_JSON;
  }

  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return INVALID_JSON;
  }
}

/**
 * Formats Zod issues into a single human-readable `path: message; ...` string.
 */
export function formatIssues(
  issues: ReadonlyArray<{ path: ReadonlyArray<string | number>; message: string }>
): string {
  return issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}
