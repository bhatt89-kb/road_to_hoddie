import { describe, it, expect } from "vitest";
import {
  formatCurrencyINR,
  formatPercentage,
  formatDate,
  calculateDateBefore,
} from "@/lib/format";

describe("formatCurrencyINR", () => {
  it("formats standard amounts in Indian Rupee format", () => {
    const formatted = formatCurrencyINR(1500000);
    // Should contain ₹ and 15,00,000 (en-IN grouping)
    expect(formatted).toMatch(/₹\s*15,00,000/);
  });

  it("handles 0 and negative amounts gracefully", () => {
    expect(formatCurrencyINR(0)).toMatch(/₹\s*0/);
    expect(formatCurrencyINR(-5000)).toContain("-");
  });

  it("handles NaN and non-finite numbers safely", () => {
    expect(formatCurrencyINR(NaN)).toBe("₹0");
    expect(formatCurrencyINR(Infinity)).toBe("₹0");
  });

  it("formats compact amounts in Lakhs and Crores", () => {
    expect(formatCurrencyINR(2500000, { compact: true })).toBe("₹25 Lakh");
    expect(formatCurrencyINR(12000000, { compact: true })).toBe("₹1.2 Cr");
    expect(formatCurrencyINR(50000, { compact: true })).toBe("₹50k");
  });

  it("can omit symbol when configured", () => {
    const res = formatCurrencyINR(100000, { showSymbol: false });
    expect(res).not.toContain("₹");
    expect(res).toContain("1,00,000");
  });
});

describe("formatPercentage", () => {
  it("formats numeric percentages directly", () => {
    expect(formatPercentage(25)).toBe("25%");
    expect(formatPercentage(12.5)).toBe("12.5%");
  });

  it("formats ratio decimals when asRatio is true", () => {
    expect(formatPercentage(0.155, true)).toBe("15.5%");
  });

  it("handles NaN gracefully", () => {
    expect(formatPercentage(NaN)).toBe("0%");
  });
});

describe("formatDate and calculateDateBefore", () => {
  it("formats valid date strings into en-IN display", () => {
    const formatted = formatDate("2026-12-25");
    expect(formatted).toMatch(/25\s+Dec\s+2026/);
  });

  it("calculates backward dates from event date", () => {
    const result = calculateDateBefore("2026-10-31", 30);
    expect(result).toMatch(/1\s+Oct\s+2026/);
  });

  it("handles unparseable date strings safely", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
    expect(calculateDateBefore("invalid-date", 10)).toBe("10 days before event");
  });
});
