"use client";

import React, { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEventPlanner } from "@/hooks/useEventPlanner";
import { EventPlanForm } from "@/components/planner/EventPlanForm";
import { PlanResults } from "@/components/planner/PlanResults";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { EventType } from "@/types/event";

function PlannerContent() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get("type") as EventType) || "wedding";

  const {
    plan,
    status,
    error,
    source,
    generatePlan,
    updateBudgetItem,
    toggleTimelineStatus,
    toggleVendorStatus,
    clearPlan,
  } = useEventPlanner();

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  const handleNewPlan = () => {
    setIsCreatingNew(true);
  };

  const handleFormSubmit = async (req: Parameters<typeof generatePlan>[0]) => {
    setIsCreatingNew(false);
    await generatePlan(req);
    // Move focus to results heading after successful generation
    setTimeout(() => {
      resultsHeadingRef.current?.focus();
    }, 100);
  };

  return (
    <div className="container" style={{ paddingBottom: "var(--space-16)", paddingTop: "var(--space-8)" }}>
      {/* Header title */}
      <div style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
        <h1
          ref={resultsHeadingRef}
          tabIndex={-1}
          style={{ fontSize: "var(--font-size-3xl)", fontWeight: 800, marginBottom: "var(--space-2)" }}
        >
          {plan && !isCreatingNew ? "Your Celebration Blueprint" : "Design Your Celebration"}
        </h1>
        <p style={{ color: "var(--color-text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
          {plan && !isCreatingNew
            ? "Review your personalized budget breakdown, milestone countdown, vendor checklist, and ideas."
            : "Enter your celebration parameters below to generate a tailored budget, backward timeline, and checklist."}
        </p>
      </div>

      {/* Loading State */}
      {status === "loading" && (
        <Card style={{ textAlign: "center", padding: "var(--space-12) var(--space-6)" }}>
          <Spinner size="lg" style={{ margin: "0 auto var(--space-4) auto" }} />
          <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, marginBottom: "var(--space-2)" }}>
            Synthesizing Your Celebration Plan...
          </h2>
          <p style={{ color: "var(--color-text-secondary)", maxWidth: "480px", margin: "0 auto" }}>
            Gemini AI is calculating realistic INR allocations, scheduling milestone timelines, and assembling tailored vendor checklists.
          </p>
        </Card>
      )}

      {/* Error State */}
      {status === "error" && error && (
        <Card style={{ borderLeft: "4px solid var(--color-error)", marginBottom: "var(--space-6)" }}>
          <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, color: "var(--color-error)", marginBottom: "var(--space-2)" }}>
            Unable to Generate Plan
          </h2>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>{error}</p>
          <Button variant="secondary" size="sm" onClick={() => setIsCreatingNew(true)}>
            Try Again
          </Button>
        </Card>
      )}

      {/* Plan Results View */}
      {plan && !isCreatingNew && status !== "loading" && (
        <PlanResults
          plan={plan}
          source={source}
          onUpdateBudgetItem={updateBudgetItem}
          onToggleTimelineStatus={toggleTimelineStatus}
          onToggleVendorStatus={toggleVendorStatus}
          onClearPlan={clearPlan}
          onNewPlan={handleNewPlan}
        />
      )}

      {/* Form View (when no plan or creating new) */}
      {(!plan || isCreatingNew) && (
        <div>
          {plan && (
            <div style={{ textAlign: "center", marginBottom: "var(--space-4)" }}>
              <Button size="sm" variant="ghost" onClick={() => setIsCreatingNew(false)}>
                ← Return to Saved Plan
              </Button>
            </div>
          )}
          <EventPlanForm
            onSubmit={handleFormSubmit}
            isLoading={status === "loading"}
            initialEventType={initialType}
          />
        </div>
      )}
    </div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: "var(--space-16) 0", textAlign: "center" }}>
          <Spinner size="lg" />
        </div>
      }
    >
      <PlannerContent />
    </Suspense>
  );
}
