import { describe, it, expect } from "vitest";
import {
  sanitizeInput,
  truncateInput,
  wrapInUserDelimiter,
  checkPlanningScope,
  sanitizeOutput,
} from "@/lib/guardrails";

describe("sanitizeInput and truncateInput", () => {
  it("strips ASCII control characters while preserving valid newlines", () => {
    const raw = "Line 1\x00\x08with null and backspace\nLine 2";
    const cleaned = sanitizeInput(raw);
    expect(cleaned).not.toContain("\x00");
    expect(cleaned).not.toContain("\x08");
    expect(cleaned).toContain("Line 1with null and backspace\nLine 2");
  });

  it("truncates string safely without crashing", () => {
    const longStr = "A".repeat(500);
    expect(truncateInput(longStr, 50)).toHaveLength(50);
    expect(truncateInput("Short", 50)).toBe("Short");
  });

  it("wraps user inputs in data delimiters", () => {
    const wrapped = wrapInUserDelimiter("Hello planner");
    expect(wrapped).toContain("<user_input>");
    expect(wrapped).toContain("Hello planner");
    expect(wrapped).toContain("</user_input>");
  });
});

describe("checkPlanningScope", () => {
  it("permits celebration and planning queries", () => {
    expect(checkPlanningScope("How do I calculate wedding buffet quantities?").isEventRelated).toBe(true);
    expect(checkPlanningScope("Ideas for 1st birthday theme").isEventRelated).toBe(true);
  });

  it("identifies and redirects completely off-topic requests (e.g. coding / exploits)", () => {
    const offTopic = checkPlanningScope("write python code to exploit bypass firewall");
    expect(offTopic.isEventRelated).toBe(false);
    expect(offTopic.redirectMessage).toBeDefined();
    expect(offTopic.redirectMessage).toContain("celebrations and events");
  });
});

describe("sanitizeOutput", () => {
  it("strips dangerous script and iframe tags from model output", () => {
    const dirty = "Enjoy your event! <script>alert('xss')</script> Great music.";
    const clean = sanitizeOutput(dirty);
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("alert");
    expect(clean).toContain("Enjoy your event!  Great music.");
  });

  it("strips iframe embeds", () => {
    const dirty = "Venue link: <iframe src='https://malicious.com'></iframe>";
    const clean = sanitizeOutput(dirty);
    expect(clean).not.toContain("<iframe");
  });
});
