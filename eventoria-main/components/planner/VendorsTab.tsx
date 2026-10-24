"use client";

import React from "react";
import styles from "./VendorsTab.module.css";
import { Badge } from "@/components/ui/Badge";
import type { VendorChecklistItem, VendorStatus } from "@/types/event";

export interface VendorsTabProps {
  readonly vendorItems: ReadonlyArray<VendorChecklistItem>;
  readonly onToggleStatus?: (index: number) => void;
}

const STATUS_BADGE_CONFIG: Record<
  VendorStatus,
  { label: string; variant: "gray" | "amber" | "emerald" }
> = {
  "not-started": { label: "Not Started", variant: "gray" },
  shortlisted: { label: "Shortlisted", variant: "amber" },
  booked: { label: "Booked ✓", variant: "emerald" },
};

const TIER_BADGES: Record<string, "rose" | "amber" | "gray"> = {
  "must-have": "rose",
  "should-have": "amber",
  "nice-to-have": "gray",
};

const VendorsTabComponent: React.FC<VendorsTabProps> = ({
  vendorItems,
  onToggleStatus,
}) => {
  return (
    <div className={styles.vendorGrid} role="list" aria-label="Vendor checklists">
      {vendorItems.map((vendor, index) => {
        const currentStatus: VendorStatus = vendor.status || "not-started";
        const statusConfig = STATUS_BADGE_CONFIG[currentStatus];

        return (
          <div key={`${vendor.category}-${index}`} className={styles.vendorCard} role="listitem">
            <div className={styles.cardHeader}>
              <h3 className={styles.vendorTitle}>{vendor.category}</h3>
              <div className={styles.badges}>
                <Badge variant={TIER_BADGES[vendor.priorityTier] || "amber"}>
                  {vendor.priorityTier}
                </Badge>
                <button
                  type="button"
                  className={styles.statusToggle}
                  onClick={() => onToggleStatus && onToggleStatus(index)}
                  title="Click to cycle status (Not Started -> Shortlisted -> Booked)"
                  aria-label={`Vendor status for ${vendor.category}: ${statusConfig.label}`}
                >
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                </button>
              </div>
            </div>

            {/* Items to Book */}
            {vendor.itemsToBook && vendor.itemsToBook.length > 0 && (
              <div className={styles.sectionBlock}>
                <span className={styles.blockTitle}>Scope to Book</span>
                <ul className={styles.bulletList}>
                  {vendor.itemsToBook.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Questions to Ask */}
            {vendor.questionsToAsk && vendor.questionsToAsk.length > 0 && (
              <div className={styles.sectionBlock}>
                <span className={styles.blockTitle}>Essential Questions to Ask</span>
                <ul className={styles.bulletList}>
                  {vendor.questionsToAsk.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contract Checks */}
            {vendor.contractChecks && vendor.contractChecks.length > 0 && (
              <div className={styles.sectionBlock}>
                <span className={styles.blockTitle}>Contract Safety Checks</span>
                <ul className={styles.bulletList}>
                  {vendor.contractChecks.map((check, i) => (
                    <li key={i}>{check}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.footerInfo}>
              <span>Target: {vendor.bookByDaysBefore}d before</span>
              <span>
                Cost: {vendor.estimateLowPercent}%–{vendor.estimateHighPercent}% of budget
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const VendorsTab = React.memo(VendorsTabComponent);
