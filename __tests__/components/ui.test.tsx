import React from "react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";

describe("Button component", () => {
  it("renders button label and handles click event", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Create Plan</Button>);

    const btn = screen.getByRole("button", { name: /create plan/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("displays loading state and disables button when isLoading is true", () => {
    render(<Button isLoading>Generating Plan</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
  });
});

describe("Card and Badge components", () => {
  it("renders card title and contents", () => {
    render(
      <Card title="Budget Breakdown" subtitle="Detailed allocations">
        <p>Card content here</p>
      </Card>
    );

    expect(screen.getByText("Budget Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Detailed allocations")).toBeInTheDocument();
    expect(screen.getByText("Card content here")).toBeInTheDocument();
  });

  it("renders badge with appropriate variant", () => {
    render(<Badge variant="emerald">Approved</Badge>);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });
});

describe("Tabs ARIA component", () => {
  const tabs = [
    { id: "budget", label: "Budget", content: <div>Budget Content</div> },
    { id: "timeline", label: "Timeline", content: <div>Timeline Content</div> },
    { id: "vendors", label: "Vendors", content: <div>Vendors Content</div> },
  ];

  it("renders tabs with proper ARIA roles and handles tab selection", () => {
    const handleTabChange = vi.fn();
    render(
      <Tabs
        tabs={tabs}
        activeTab="budget"
        onTabChange={handleTabChange}
      />
    );

    const budgetTab = screen.getByRole("tab", { name: /budget/i });
    const timelineTab = screen.getByRole("tab", { name: /timeline/i });

    expect(budgetTab).toHaveAttribute("aria-selected", "true");
    expect(timelineTab).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Budget Content");

    fireEvent.click(timelineTab);
    expect(handleTabChange).toHaveBeenCalledWith("timeline");
  });

  it("supports keyboard arrow navigation between tabs", () => {
    const handleTabChange = vi.fn();
    render(
      <Tabs
        tabs={tabs}
        activeTab="budget"
        onTabChange={handleTabChange}
      />
    );

    const budgetTab = screen.getByRole("tab", { name: /budget/i });
    fireEvent.keyDown(budgetTab, { key: "ArrowRight" });
    expect(handleTabChange).toHaveBeenCalledWith("timeline");
  });
});
