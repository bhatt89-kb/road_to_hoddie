"use client";

import { useState, useCallback } from "react";
import type {
  EventPlan,
  EventPlanRequest,
  PlanApiResponse,
  ApiErrorResponse,
  TaskStatus,
  VendorStatus,
  PlanSource,
} from "@/types/event";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { useLocalStorage } from "./useLocalStorage";

export type PlanStatus = "idle" | "loading" | "success" | "error";

export function useEventPlanner() {
  const [savedPlan, setSavedPlan, removeSavedPlan] = useLocalStorage<EventPlan | null>(
    LOCAL_STORAGE_KEYS.CURRENT_PLAN,
    null
  );

  const [status, setStatus] = useState<PlanStatus>(savedPlan ? "success" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("budget");
  const [source, setSource] = useState<PlanSource>("ai");

  // Plan generation API call
  const generatePlan = useCallback(
    async (request: EventPlanRequest) => {
      setStatus("loading");
      setError(null);

      try {
        const response = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errData: ApiErrorResponse = await response.json();
          throw new Error(errData.error || "Failed to generate plan. Please try again.");
        }

        const data: PlanApiResponse = await response.json();
        setSavedPlan(data.plan);
        setSource(data.source ?? "ai");
        setStatus("success");
        setActiveTab("budget");
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(message);
        setStatus("error");
      }
    },
    [setSavedPlan]
  );

  // Edit budget line item cost & dynamically recalculate
  const updateBudgetItem = useCallback(
    (index: number, newCost: number) => {
      if (!savedPlan) return;
      const updatedBudget = [...savedPlan.budgetBreakdown];
      const target = updatedBudget[index];
      if (!target) return;

      const nonNegativeCost = Math.max(0, newCost);
      const totalBudget = savedPlan.totalBudget || savedPlan.budgetBreakdown.reduce((s, i) => s + i.estimatedCost, 0);
      const newPercent = totalBudget > 0 ? Math.round((nonNegativeCost / totalBudget) * 1000) / 10 : target.percentOfTotal;

      updatedBudget[index] = {
        ...target,
        estimatedCost: nonNegativeCost,
        percentOfTotal: newPercent,
        userAdjustedCost: nonNegativeCost,
      };

      setSavedPlan({
        ...savedPlan,
        budgetBreakdown: updatedBudget,
      });
    },
    [savedPlan, setSavedPlan]
  );

  // Toggle task status ('todo' -> 'in-progress' -> 'done')
  const toggleTimelineStatus = useCallback(
    (index: number) => {
      if (!savedPlan) return;
      const updatedTimeline = [...savedPlan.timeline];
      const target = updatedTimeline[index];
      if (!target) return;

      const currentStatus: TaskStatus = target.status || "todo";
      const nextStatus: TaskStatus =
        currentStatus === "todo" ? "in-progress" : currentStatus === "in-progress" ? "done" : "todo";

      updatedTimeline[index] = {
        ...target,
        status: nextStatus,
      };

      setSavedPlan({
        ...savedPlan,
        timeline: updatedTimeline,
      });
    },
    [savedPlan, setSavedPlan]
  );

  // Toggle vendor booking status ('not-started' -> 'shortlisted' -> 'booked')
  const toggleVendorStatus = useCallback(
    (index: number) => {
      if (!savedPlan) return;
      const updatedVendors = [...savedPlan.vendorChecklist];
      const target = updatedVendors[index];
      if (!target) return;

      const currentStatus: VendorStatus = target.status || "not-started";
      const nextStatus: VendorStatus =
        currentStatus === "not-started"
          ? "shortlisted"
          : currentStatus === "shortlisted"
          ? "booked"
          : "not-started";

      updatedVendors[index] = {
        ...target,
        status: nextStatus,
      };

      setSavedPlan({
        ...savedPlan,
        vendorChecklist: updatedVendors,
      });
    },
    [savedPlan, setSavedPlan]
  );

  // Reset or clear current plan
  const clearPlan = useCallback(() => {
    removeSavedPlan();
    setStatus("idle");
    setError(null);
  }, [removeSavedPlan]);

  return {
    plan: savedPlan,
    status,
    error,
    source,
    activeTab,
    setActiveTab,
    generatePlan,
    updateBudgetItem,
    toggleTimelineStatus,
    toggleVendorStatus,
    clearPlan,
    hasPlan: Boolean(savedPlan),
  };
}
