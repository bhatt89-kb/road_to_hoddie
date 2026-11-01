"use client";

import React from "react";
import styles from "./TimelineTab.module.css";
import { Badge } from "@/components/ui/Badge";
import type { TimelineItem, TaskStatus } from "@/types/event";

export interface TimelineTabProps {
  readonly timelineItems: ReadonlyArray<TimelineItem>;
  readonly onToggleStatus?: (index: number) => void;
}

const PRIORITY_BADGES: Record<string, "rose" | "amber" | "sky"> = {
  high: "rose",
  medium: "amber",
  low: "sky",
};

const TimelineTabComponent: React.FC<TimelineTabProps> = ({
  timelineItems,
  onToggleStatus,
}) => {
  // Group tasks by phase
  const phases = Array.from(new Set(timelineItems.map((item) => item.phase)));

  return (
    <div className={styles.timelineContainer} aria-label="Event milestone timeline">
      {phases.map((phase) => {
        const tasksInPhase = timelineItems
          .map((item, originalIndex) => ({ item, originalIndex }))
          .filter(({ item }) => item.phase === phase);

        return (
          <div key={phase} className={styles.phaseGroup}>
            <div className={styles.phaseHeader}>
              <span className={styles.phaseDot} aria-hidden="true" />
              <h3>{phase}</h3>
            </div>

            <div className={styles.taskList} role="list">
              {tasksInPhase.map(({ item, originalIndex }) => {
                const status: TaskStatus = item.status || "todo";
                const isDone = status === "done";
                const isInProgress = status === "in-progress";

                let statusClass = styles.statusButton;
                let statusIcon = "";
                let statusLabel = "Mark task in-progress";

                if (isDone) {
                  statusClass = `${styles.statusButton} ${styles.statusButtonDone}`;
                  statusIcon = "✓";
                  statusLabel = "Task completed. Click to mark todo";
                } else if (isInProgress) {
                  statusClass = `${styles.statusButton} ${styles.statusButtonInProgress}`;
                  statusIcon = "⏳";
                  statusLabel = "Task in-progress. Click to mark completed";
                }

                return (
                  <div
                    key={`${item.title}-${originalIndex}`}
                    className={`${styles.taskCard} ${isDone ? styles.taskCardDone : ""}`}
                    role="listitem"
                  >
                    <button
                      type="button"
                      className={statusClass}
                      onClick={() => onToggleStatus && onToggleStatus(originalIndex)}
                      aria-label={`${statusLabel} for ${item.title}`}
                      title={statusLabel}
                    >
                      {statusIcon}
                    </button>

                    <div className={styles.taskContent}>
                      <div className={styles.taskHeader}>
                        <span
                          className={`${styles.taskTitle} ${
                            isDone ? styles.taskTitleDone : ""
                          }`}
                        >
                          {item.title}
                        </span>

                        <div className={styles.taskMeta}>
                          <span className={styles.daysNotice}>
                            {item.daysBeforeEvent > 0
                              ? `${item.daysBeforeEvent}d before event`
                              : "Day of Event"}
                          </span>
                          <Badge variant={PRIORITY_BADGES[item.priority] || "amber"}>
                            {item.priority}
                          </Badge>
                        </div>
                      </div>

                      {item.description && (
                        <p className={styles.taskDescription}>{item.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const TimelineTab = React.memo(TimelineTabComponent);
