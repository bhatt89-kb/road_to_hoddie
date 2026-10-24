"use client";

import React from "react";
import styles from "./ThemeToggle.module.css";
import { useTheme } from "@/hooks/useTheme";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <button
        type="button"
        className={styles.themeToggle}
        aria-label="Toggle theme"
        disabled
      >
        <span aria-hidden="true">☀️</span>
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={styles.themeToggle}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span aria-hidden="true">{isDark ? "🌙" : "☀️"}</span>
    </button>
  );
};
