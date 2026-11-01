"use client";

import React, { useState } from "react";
import styles from "./BudgetTab.module.css";
import { Badge } from "@/components/ui/Badge";
import { formatCurrencyINR, formatPercentage } from "@/lib/format";
import type { BudgetItem, BudgetPriority } from "@/types/event";

export interface BudgetTabProps {
  readonly budgetItems: ReadonlyArray<BudgetItem>;
  readonly totalBudget?: number;
  readonly onUpdateCost?: (index: number, newCost: number) => void;
}

const PRIORITY_BADGE_VARIANTS: Record<BudgetPriority, "emerald" | "amber" | "gray"> = {
  essential: "emerald",
  recommended: "amber",
  optional: "gray",
};

const BudgetTabComponent: React.FC<BudgetTabProps> = ({
  budgetItems,
  totalBudget = 0,
  onUpdateCost,
}) => {
  const [expandedTips, setExpandedTips] = useState<Record<number, boolean>>({});

  const toggleTips = (idx: number) => {
    setExpandedTips((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const totalAllocated = budgetItems.reduce(
    (sum, item) => sum + (item.userAdjustedCost ?? item.estimatedCost),
    0
  );

  const baselineBudget = totalBudget || totalAllocated;
  const remainingBudget = baselineBudget - totalAllocated;
  const isOverspend = remainingBudget < 0;

  return (
    <div className={styles.budgetContainer}>
      {/* Top Metrics Row */}
      <div className={styles.summaryHeader}>
        <div className={styles.metricBox}>
          <span className={styles.metricLabel}>Baseline Total Budget</span>
          <span className={styles.metricValue}>{formatCurrencyINR(baselineBudget)}</span>
        </div>
        <div className={styles.metricBox}>
          <span className={styles.metricLabel}>Currently Allocated</span>
          <span className={styles.metricValue}>{formatCurrencyINR(totalAllocated)}</span>
        </div>
        <div className={styles.metricBox}>
          <span className={styles.metricLabel}>
            {isOverspend ? "Budget Deficit" : "Remaining Buffer"}
          </span>
          <span
            className={`${styles.metricValue} ${
              isOverspend ? styles.metricValueWarning : ""
            }`}
          >
            {formatCurrencyINR(Math.abs(remainingBudget))}
          </span>
        </div>
      </div>

      {isOverspend && (
        <div className={styles.overspendAlert} role="alert">
          ⚠️ Current allocations exceed your planned budget by{" "}
          {formatCurrencyINR(Math.abs(remainingBudget))}. Consider adjusting non-essential
          categories below.
        </div>
      )}

      {/* Category Breakdown */}
      <div className={styles.categoryList} role="list" aria-label="Budget categories">
        {budgetItems.map((item, index) => {
          const currentCost = item.userAdjustedCost ?? item.estimatedCost;
          const pct = item.percentOfTotal;
          const badgeVariant = PRIORITY_BADGE_VARIANTS[item.priority] || "amber";
          const showTips = Boolean(expandedTips[index]);

          return (
            <div key={item.category} className={styles.categoryItem} role="listitem">
              <div className={styles.categoryTop}>
                <div className={styles.categoryName}>
                  <span>{item.category}</span>
                  <Badge variant={badgeVariant}>{item.priority}</Badge>
                </div>

                <div className={styles.costSection}>
                  <div className={styles.costInputWrapper}>
                    <span style={{ fontSize: "var(--font-size-xs)", opacity: 0.7 }}>₹</span>
                    <input
                      type="number"
                      aria-label={`${item.category} cost`}
                      className={styles.costInput}
                      value={currentCost}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!isNaN(val) && onUpdateCost) {
                          onUpdateCost(index, val);
                        }
                      }}
                      min={0}
                      step={1000}
                    />
                  </div>
                  <span style={{ fontSize: "var(--font-size-xs)", opacity: 0.7, minWidth: "40px" }}>
                    ({formatPercentage(pct)})
                  </span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className={styles.progressBarContainer}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                  aria-hidden="true"
                />
              </div>

              {item.notes && <p className={styles.categoryNotes}>{item.notes}</p>}

              {item.savingTips && item.savingTips.length > 0 && (
                <div>
                  <button
                    type="button"
                    className={styles.tipsToggle}
                    onClick={() => toggleTips(index)}
                    aria-expanded={showTips}
                  >
                    {showTips ? "▲ Hide saving tips" : "💡 View cost saving tips"}
                  </button>

                  {showTips && (
                    <ul className={styles.tipsList}>
                      {item.savingTips.map((tip, tIdx) => (
                        <li key={tIdx}>{tip}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const BudgetTab = React.memo(BudgetTabComponent);
