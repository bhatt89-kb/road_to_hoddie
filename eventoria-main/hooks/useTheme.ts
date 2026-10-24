"use client";

import { useSyncExternalStore, useEffect, useCallback } from "react";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";

export type Theme = "light" | "dark";

const THEME_CHANGE_EVENT = "eventoria-theme-change";

function getThemeSnapshot(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME) as Theme | null;
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function getServerSnapshot(): Theme {
  return "light";
}

function subscribeToTheme(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", callback);
  window.addEventListener(THEME_CHANGE_EVENT, callback);

  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
    mql.removeEventListener("change", callback);
  };
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const current = getThemeSnapshot();
    const next: Theme = current === "light" ? "dark" : "light";
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, next);
      window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
    } catch {
      // Ignore localStorage errors
    }
    document.documentElement.setAttribute("data-theme", next);
  }, []);

  return { theme, toggleTheme, mounted: true };
}
