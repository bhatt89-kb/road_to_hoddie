"use client";

import React, { useEffect, useState } from "react";
import styles from "./UsageWidget.module.css";
import type { UsageApiResponse } from "@/types/event";

export const UsageWidget: React.FC = () => {
  const [data, setData] = useState<UsageApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchUsage() {
      try {
        const res = await fetch("/api/usage");
        if (res.ok) {
          const json: UsageApiResponse = await res.json();
          if (isMounted) setData(json);
        }
      } catch (err) {
        console.warn("Could not fetch usage status:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchUsage();
    return () => {
      isMounted = false;
    };
  }, []);

  const remaining = isLoading || !data ? "—" : String(data.remaining);
  const limit = data ? data.limit : 120;

  let indicatorClass = styles.indicator;
  if (data) {
    if (data.remaining <= 2) {
      indicatorClass = `${styles.indicator} ${styles.exhausted}`;
    } else if (data.remaining <= 10) {
      indicatorClass = `${styles.indicator} ${styles.warning}`;
    }
  }

  return (
    <div
      className={styles.widget}
      title="Remaining API quota for your session (resets every 15 minutes)"
      aria-label={`API quota: ${remaining} requests remaining`}
    >
      <span className={indicatorClass} aria-hidden="true" />
      <span>Quota:</span>
      <span className={styles.count}>{remaining}</span>
      <span style={{ opacity: 0.6 }}>/ {data ? limit : "—"}</span>
    </div>
  );
};
