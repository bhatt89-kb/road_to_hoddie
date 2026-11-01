"use client";

import React, { useState } from "react";
import styles from "./IdeasTab.module.css";
import { Badge } from "@/components/ui/Badge";
import { formatCurrencyINR } from "@/lib/format";
import type { PersonalizedIdea } from "@/types/event";

export interface IdeasTabProps {
  readonly ideas: ReadonlyArray<PersonalizedIdea>;
}

const TIER_BADGES: Record<string, "emerald" | "amber" | "sky"> = {
  diy: "emerald",
  standard: "amber",
  premium: "sky",
};

const IdeasTabComponent: React.FC<IdeasTabProps> = ({ ideas }) => {
  const [selectedTier, setSelectedTier] = useState<string>("all");

  const filteredIdeas =
    selectedTier === "all" ? ideas : ideas.filter((idea) => idea.tier === selectedTier);

  return (
    <div className={styles.ideasContainer} aria-label="Personalized celebration ideas">
      {/* Tier Filter Row */}
      <div className={styles.filterRow} role="group" aria-label="Filter ideas by tier">
        <button
          type="button"
          className={`${styles.filterButton} ${
            selectedTier === "all" ? styles.filterButtonActive : ""
          }`}
          onClick={() => setSelectedTier("all")}
        >
          All Ideas ({ideas.length})
        </button>
        <button
          type="button"
          className={`${styles.filterButton} ${
            selectedTier === "diy" ? styles.filterButtonActive : ""
          }`}
          onClick={() => setSelectedTier("diy")}
        >
          🌱 DIY / Budget-Friendly
        </button>
        <button
          type="button"
          className={`${styles.filterButton} ${
            selectedTier === "standard" ? styles.filterButtonActive : ""
          }`}
          onClick={() => setSelectedTier("standard")}
        >
          ✨ Standard Highlights
        </button>
        <button
          type="button"
          className={`${styles.filterButton} ${
            selectedTier === "premium" ? styles.filterButtonActive : ""
          }`}
          onClick={() => setSelectedTier("premium")}
        >
          👑 Premium Experiences
        </button>
      </div>

      {/* Ideas Grid */}
      <div className={styles.ideasGrid} role="list">
        {filteredIdeas.map((idea, index) => (
          <div key={`${idea.title}-${index}`} className={styles.ideaCard} role="listitem">
            <div className={styles.ideaHeader}>
              <div>
                <span className={styles.ideaCategory}>{idea.category}</span>
                <h3 className={styles.ideaTitle}>{idea.title}</h3>
              </div>
              <Badge variant={TIER_BADGES[idea.tier] || "amber"}>{idea.tier.toUpperCase()}</Badge>
            </div>

            <p className={styles.ideaDescription}>{idea.description}</p>

            <div className={styles.costTag}>
              <span>Est. Cost:</span>
              <span className={styles.costValue}>
                {idea.estimatedCost > 0
                  ? formatCurrencyINR(idea.estimatedCost)
                  : "Included / Low-cost"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const IdeasTab = React.memo(IdeasTabComponent);
