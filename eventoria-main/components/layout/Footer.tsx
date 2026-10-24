import React from "react";
import Link from "next/link";
import styles from "./Footer.module.css";
import { AI_DISCLAIMER } from "@/lib/guardrails";

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={`container ${styles.inner}`}>
        <div className={styles.disclaimerBox}>
          <strong>Transparency Notice: </strong>
          {AI_DISCLAIMER}
        </div>

        <div className={styles.bottomRow}>
          <div>
            <span>© {new Date().getFullYear()} Eventoria Celebration AI. Built for the GenAI Challenge.</span>
          </div>
          <div className={styles.links}>
            <Link href="/" className={styles.link}>
              Overview
            </Link>
            <Link href="/planner" className={styles.link}>
              Plan Celebration
            </Link>
            <Link href="/chat" className={styles.link}>
              AI Assistant
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
