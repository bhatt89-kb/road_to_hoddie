"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Header.module.css";

export const Header: React.FC = () => {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Brand */}
        <Link href="/" className={styles.brand} aria-label="Eventoria Home">
          <div className={styles.logoIcon} aria-hidden="true">
            <div className={styles.logoInner}>✨</div>
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Eventoria</span>
            <span className={styles.brandSubtitle}>⚡ AI Active</span>
          </div>
        </Link>

        {/* Status pill */}
        <div className={styles.statusPill} aria-live="polite">
          <span className={styles.statusDot} aria-hidden="true" />
          Gemini Engine Ready
        </div>

        {/* Nav */}
        <nav className={styles.nav} aria-label="Main Navigation">
          <Link href="/" className={`${styles.navLink} ${pathname === "/" ? styles.navLinkActive : ""}`}>
            Overview
          </Link>
          <Link href="/planner" className={`${styles.navLink} ${pathname === "/planner" ? styles.navLinkActive : ""}`}>
            Studio
          </Link>
          <Link href="/chat" className={`${styles.navLink} ${pathname === "/chat" ? styles.navLinkActive : ""}`}>
            Assistant
          </Link>
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          <Link href="/planner" className={styles.ctaBtn}>
            🚀 Start Planning
          </Link>
        </div>
      </div>
    </header>
  );
};
