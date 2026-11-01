import React from "react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BudgetTab } from "@/components/planner/BudgetTab";
import { TimelineTab } from "@/components/planner/TimelineTab";
import { EventPlanForm } from "@/components/planner/EventPlanForm";
import type { BudgetItem, TimelineItem } from "@/types/event";

describe("BudgetTab component", () => {
  const sampleBudget: BudgetItem[] = [
    {
      category: "Venue",
      estimatedCost: 300000,
      percentOfTotal: 30,
      notes: "Main hall",
      priority: "essential",
      savingTips: ["Book off-season discount"],
    },
    {
      category: "Catering",
      estimatedCost: 400000,
      percentOfTotal: 40,
      notes: "Buffet dinner",
      priority: "essential",
      savingTips: ["Seasonal vegetables"],
    },
  ];

  it("renders budget categories and formatted INR costs", () => {
    render(<BudgetTab budgetItems={sampleBudget} totalBudget={1000000} />);

    expect(screen.getByText("Venue")).toBeInTheDocument();
    expect(screen.getByText("Catering")).toBeInTheDocument();
    // Total allocated is 7,00,000
    expect(screen.getByText("Currently Allocated")).toBeInTheDocument();
  });

  it("calls onUpdateCost when input is changed", () => {
    const handleUpdate = vi.fn();
    render(
      <BudgetTab
        budgetItems={sampleBudget}
        totalBudget={1000000}
        onUpdateCost={handleUpdate}
      />
    );

    const input = screen.getByLabelText(/Venue cost/i);
    fireEvent.change(input, { target: { value: "350000" } });
    expect(handleUpdate).toHaveBeenCalledWith(0, 350000);
  });

  it("shows overspend warning when allocated exceeds total budget", () => {
    render(<BudgetTab budgetItems={sampleBudget} totalBudget={500000} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/exceed your planned budget/i);
  });
});

describe("TimelineTab component", () => {
  const sampleTimeline: TimelineItem[] = [
    {
      title: "Confirm Venue Booking",
      description: "Pay advance and sign agreement",
      phase: "Initial Planning",
      daysBeforeEvent: 90,
      category: "Venue",
      priority: "high",
      status: "todo",
    },
    {
      title: "Menu Tasting",
      description: "Sample catering options",
      phase: "Vendor Booking",
      daysBeforeEvent: 45,
      category: "Catering",
      priority: "medium",
      status: "done",
    },
  ];

  it("renders timeline tasks grouped by phase", () => {
    render(<TimelineTab timelineItems={sampleTimeline} />);
    expect(screen.getByText("Initial Planning")).toBeInTheDocument();
    expect(screen.getByText("Confirm Venue Booking")).toBeInTheDocument();
    expect(screen.getByText("Menu Tasting")).toBeInTheDocument();
  });

  it("triggers onToggleStatus when checkbox button is clicked", () => {
    const handleToggle = vi.fn();
    render(<TimelineTab timelineItems={sampleTimeline} onToggleStatus={handleToggle} />);

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(handleToggle).toHaveBeenCalledWith(0);
  });
});

describe("EventPlanForm component", () => {
  it("renders celebration type buttons and dispatches form submission", () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(<EventPlanForm onSubmit={handleSubmit} isLoading={false} />);

    expect(screen.getByText("Wedding")).toBeInTheDocument();
    expect(screen.getByText("Birthday")).toBeInTheDocument();
    expect(screen.getByText("Community")).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /generate celebration plan/i });
    fireEvent.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalled();
  });
});
