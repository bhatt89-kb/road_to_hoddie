"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./PlanResults.module.css";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BudgetTab } from "./BudgetTab";
import { TimelineTab } from "./TimelineTab";
import { VendorsTab } from "./VendorsTab";
import { IdeasTab } from "./IdeasTab";
import type { EventPlan } from "@/types/event";

export interface PlanResultsProps {
  readonly plan: EventPlan;
  readonly source?: "ai" | "fallback";
  readonly onUpdateBudgetItem?: (index: number, newCost: number) => void;
  readonly onToggleTimelineStatus?: (index: number) => void;
  readonly onToggleVendorStatus?: (index: number) => void;
  readonly onClearPlan: () => void;
  readonly onNewPlan: () => void;
}

const EVENT_TYPE_ICONS: Record<string, string> = {
  wedding: "💍",
  birthday: "🎂",
  community: "🎪",
};

export const PlanResults: React.FC<PlanResultsProps> = ({
  plan,
  source,
  onUpdateBudgetItem,
  onToggleTimelineStatus,
  onToggleVendorStatus,
  onClearPlan,
  onNewPlan,
}) => {
  const [activeTab, setActiveTab] = useState<string>("budget");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plan, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `eventoria-plan-${plan.eventType}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs: ReadonlyArray<TabItem> = [
    {
      id: "budget",
      label: "Budget Breakdown",
      icon: "₹",
      badge: <Badge variant="amber">{plan.budgetBreakdown.length}</Badge>,
      content: (
        <BudgetTab
          budgetItems={plan.budgetBreakdown}
          totalBudget={plan.totalBudget}
          onUpdateCost={onUpdateBudgetItem}
        />
      ),
    },
    {
      id: "timeline",
      label: "Milestone Timeline",
      icon: "⏳",
      badge: <Badge variant="sky">{plan.timeline.length}</Badge>,
      content: (
        <TimelineTab
          timelineItems={plan.timeline}
          onToggleStatus={onToggleTimelineStatus}
        />
      ),
    },
    {
      id: "vendors",
      label: "Vendor Checklists",
      icon: "📋",
      badge: <Badge variant="emerald">{plan.vendorChecklist.length}</Badge>,
      content: (
        <VendorsTab
          vendorItems={plan.vendorChecklist}
          onToggleStatus={onToggleVendorStatus}
        />
      ),
    },
    {
      id: "ideas",
      label: "Personalized Ideas",
      icon: "💡",
      badge: <Badge variant="rose">{plan.personalizedIdeas.length}</Badge>,
      content: <IdeasTab ideas={plan.personalizedIdeas} />,
    },
  ];

  const icon = EVENT_TYPE_ICONS[plan.eventType] || "✨";

  return (
    <div className={styles.resultsContainer}>
      {source === "fallback" && (
        <div role="alert" style={{
          padding: "var(--space-3) var(--space-4)",
          backgroundColor: "var(--color-warning-subtle)",
          color: "var(--color-warning)",
          borderRadius: "var(--radius-md)",
          marginBottom: "var(--space-4)",
          fontSize: "var(--font-size-sm)",
          border: "1px solid var(--color-warning)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
        }}>
          <span aria-hidden="true">⚠️</span>
          <span>
            <strong>Offline Plan:</strong> This is a deterministic template plan — not AI-generated.{" "}
            Add a <code>GEMINI_API_KEY</code> to get a real personalised plan.
          </span>
        </div>
      )}
      {/* Summary Card */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryTop}>
          <div className={styles.titleArea}>
            <span className={styles.eventIcon} aria-hidden="true">
              {icon}
            </span>
            <div>
              <h2 className={styles.summaryTitle}>
                {plan.eventType.charAt(0).toUpperCase() + plan.eventType.slice(1)} Celebration Plan
              </h2>
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                Saved locally on your device • Instant offline access
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Badge variant="emerald">AI Strategy Ready</Badge>
          </div>
        </div>

        <p className={styles.summaryText}>{plan.summary}</p>

        {/* Plan stats row */}
        <div className={styles.statRow}>
          <div className={styles.statItem}>
            <span>Categories:</span>
            <strong>{plan.budgetBreakdown.length}</strong>
          </div>
          <div className={styles.statItem}>
            <span>Tasks:</span>
            <strong>{plan.timeline.length}</strong>
          </div>
          <div className={styles.statItem}>
            <span>Checklists:</span>
            <strong>{plan.vendorChecklist.length}</strong>
          </div>
          <div className={styles.statItem}>
            <span>Custom Ideas:</span>
            <strong>{plan.personalizedIdeas.length}</strong>
          </div>
        </div>

        {/* Action Controls */}
        <div className={styles.actionBar}>
          <Link href="/chat" tabIndex={-1}>
            <Button size="sm" variant="primary" leftIcon="💬">
              Chat with Assistant
            </Button>
          </Link>
          <Button size="sm" variant="secondary" onClick={handleExportJSON} leftIcon="📥">
            Export JSON
          </Button>
          <Button size="sm" variant="secondary" onClick={handlePrint} leftIcon="🖨️">
            Print / PDF
          </Button>
          <Button size="sm" variant="outline" onClick={onNewPlan} leftIcon="✏️">
            New Plan
          </Button>

          <div style={{ marginLeft: "auto" }}>
            {showClearConfirm ? (
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-error)" }}>
                  Erase local data?
                </span>
                <Button size="sm" variant="danger" onClick={onClearPlan}>
                  Confirm Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowClearConfirm(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowClearConfirm(true)}
                title="Erase plan from localStorage"
              >
                🗑️ Clear Data
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Expert Tips Callout */}
      {plan.tips && plan.tips.length > 0 && (
        <div className={styles.tipsBanner}>
          <strong>✨ Expert Advisor Tips for Execution:</strong>
          <ul>
            {plan.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabbed Results */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ariaLabel="Plan details breakdown"
      />
    </div>
  );
};
