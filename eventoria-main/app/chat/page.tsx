"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import type { EventPlan, EventPlanRequest } from "@/types/event";

const ChatInterface = dynamic(
  () => import("@/components/planner/ChatInterface").then(m => ({ default: m.ChatInterface })),
  {
    loading: () => (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="lg" />
      </div>
    ),
    ssr: false,
  }
);

function ChatPageContent() {
  const [currentPlan] = useLocalStorage<EventPlan | null>(
    LOCAL_STORAGE_KEYS.CURRENT_PLAN,
    null
  );

  const context: Partial<EventPlanRequest> | undefined = currentPlan
    ? {
        eventType: currentPlan.eventType,
        budget: currentPlan.totalBudget,
      }
    : undefined;

  return (
    <div className="container" style={{ paddingBottom: "var(--space-12)", paddingTop: "var(--space-6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-size-2xl)", fontWeight: 800 }}>
            Eventoria Celebration Advisor
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
            Real-time context-aware planning assistant powered by Gemini 2.5
          </p>
        </div>

        {currentPlan && (
          <Link href="/planner" tabIndex={-1}>
            <Button size="sm" variant="outline">
              ← View Full Plan
            </Button>
          </Link>
        )}
      </div>

      <ChatInterface eventContext={context} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: "var(--space-16) 0", textAlign: "center" }}>
          <Spinner size="lg" />
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
