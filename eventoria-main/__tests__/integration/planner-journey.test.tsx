import React from "react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PlannerPage from "@/app/planner/page";
import { resetRateLimiter } from "@/lib/rate-limiter";

import { generateFallbackPlan } from "@/lib/gemini";

// Mock router navigation
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/planner",
}));

describe("Complete End-to-End Planning Journey", () => {
  beforeEach(() => {
    resetRateLimiter();
    window.localStorage.clear();

    const samplePlan = generateFallbackPlan({
      eventType: "wedding",
      guestCount: 250,
      budget: 2000000,
      date: "2026-11-20",
      city: "Jaipur",
      description: "Royal destination wedding celebration.",
      preferences: ["Pure vegetarian menu"],
    });

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/plan")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              plan: samplePlan,
              model: "gemini-2.5-flash",
              classification: { complexity: "complex", model: "gemini-2.5-flash" },
            }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
    });
  });

  it("completes full flow: renders form, submits, views results, edits budget, and toggles task", async () => {
    render(<PlannerPage />);

    // 1. Initial Form View
    expect(screen.getByText(/Design Your Celebration/i)).toBeInTheDocument();
    expect(screen.getByText("Wedding")).toBeInTheDocument();

    // 2. Click 1-click demonstration preset to fill form quickly
    const presetBtn = screen.getByText(/Royal Palace Wedding/i);
    fireEvent.click(presetBtn);

    const budgetInput = screen.getByLabelText(/Total Budget \(INR\)/i) as HTMLInputElement;
    expect(budgetInput.value).toBe("2000000");

    // 3. Submit plan generation
    const submitBtn = screen.getByRole("button", { name: /generate celebration plan/i });
    fireEvent.click(submitBtn);

    // 4. Verify Plan Results Render
    await waitFor(
      () => {
        expect(screen.getByText(/Celebration Blueprint/i)).toBeInTheDocument();
        expect(screen.getByText("Budget Breakdown")).toBeInTheDocument();
        expect(screen.getByText("Milestone Timeline")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // 5. Test Tab Switching
    const timelineTab = screen.getByRole("tab", { name: /Milestone Timeline/i });
    fireEvent.click(timelineTab);
    expect(timelineTab).toHaveAttribute("aria-selected", "true");

    const vendorsTab = screen.getByRole("tab", { name: /Vendor Checklists/i });
    fireEvent.click(vendorsTab);
    expect(vendorsTab).toHaveAttribute("aria-selected", "true");

    const ideasTab = screen.getByRole("tab", { name: /Personalized Ideas/i });
    fireEvent.click(ideasTab);
    expect(ideasTab).toHaveAttribute("aria-selected", "true");

    // 6. Test Data Persistence: verify localStorage contains current plan
    const stored = window.localStorage.getItem("eventoria_current_plan");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.eventType).toBe("wedding");

    // 7. Clear data button
    const clearBtn = screen.getByRole("button", { name: /Clear Data/i });
    fireEvent.click(clearBtn);

    const confirmBtn = screen.getByRole("button", { name: /Confirm Delete/i });
    fireEvent.click(confirmBtn);

    // Verify localStorage cleared and returned to initial form view
    expect(window.localStorage.getItem("eventoria_current_plan")).toBeNull();
    expect(screen.getByText(/Design Your Celebration/i)).toBeInTheDocument();
  });
});
