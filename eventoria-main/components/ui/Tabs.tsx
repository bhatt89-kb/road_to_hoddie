"use client";

import React, { useRef, useId } from "react";
import styles from "./Tabs.module.css";

export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: React.ReactNode;
  readonly badge?: React.ReactNode;
  readonly content: React.ReactNode;
}

export interface TabsProps {
  readonly tabs: ReadonlyArray<TabItem>;
  readonly activeTab: string;
  readonly onTabChange: (id: string) => void;
  readonly className?: string;
  readonly ariaLabel?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = "",
  ariaLabel = "Event plan sections",
}) => {
  const baseId = useId();
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = currentIndex;

    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      e.preventDefault();
    } else if (e.key === "Home") {
      nextIndex = 0;
      e.preventDefault();
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
      e.preventDefault();
    } else {
      return;
    }

    const nextTab = tabs[nextIndex];
    if (nextTab) {
      onTabChange(nextTab.id);
      // Focus newly selected tab
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[nextIndex]?.focus();
    }
  };

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className={`${styles.tabContainer} ${className}`}>
      <div
        ref={tabListRef}
        role="tablist"
        aria-label={ariaLabel}
        className={styles.tablist}
      >
        {tabs.map((tab, idx) => {
          const isSelected = tab.id === (currentTab ? currentTab.id : "");
          const tabId = `${baseId}-tab-${tab.id}`;
          const panelId = `${baseId}-panel-${tab.id}`;

          return (
            <button
              key={tab.id}
              role="tab"
              id={tabId}
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              className={styles.tab}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
            >
              {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && <span>{tab.badge}</span>}
            </button>
          );
        })}
      </div>

      {currentTab && (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${currentTab.id}`}
          aria-labelledby={`${baseId}-tab-${currentTab.id}`}
          tabIndex={0}
          className={styles.tabpanel}
        >
          {currentTab.content}
        </div>
      )}
    </div>
  );
};
