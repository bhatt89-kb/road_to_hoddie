/**
 * @file lib/format.ts
 * Formatting utilities for Indian Rupee (INR with en-IN digit grouping), dates, and percentages.
 */

/**
 * Formats a numeric amount in INR with Indian comma grouping (e.g. 15,00,000 -> ₹15,00,000).
 * Handles edge cases like 0, negative values, and non-finite inputs.
 *
 * @param amount - The numerical amount in INR
 * @param options - Optional formatting options
 * @returns Formatted currency string with ₹ symbol
 */
export function formatCurrencyINR(
  amount: number,
  options: {
    readonly showSymbol?: boolean;
    readonly maximumFractionDigits?: number;
    readonly compact?: boolean;
  } = {}
): string {
  const { showSymbol = true, maximumFractionDigits = 0, compact = false } = options;

  if (isNaN(amount) || !isFinite(amount)) {
    return showSymbol ? "₹0" : "0";
  }

  if (compact) {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    const prefix = showSymbol ? "₹" : "";

    if (abs >= 10000000) {
      // Crores
      const val = (abs / 10000000).toFixed(2).replace(/\.?0+$/, "");
      return `${sign}${prefix}${val} Cr`;
    }
    if (abs >= 100000) {
      // Lakhs
      const val = (abs / 100000).toFixed(2).replace(/\.?0+$/, "");
      return `${sign}${prefix}${val} Lakh`;
    }
    if (abs >= 1000) {
      // Thousands
      const val = (abs / 1000).toFixed(1).replace(/\.?0+$/, "");
      return `${sign}${prefix}${val}k`;
    }
  }

  const formatted = new Intl.NumberFormat("en-IN", {
    style: showSymbol ? "currency" : "decimal",
    currency: "INR",
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(amount);

  return formatted;
}

/**
 * Formats a percentage value (e.g., 0.155 -> "15.5%" or 15.5 -> "15.5%").
 *
 * @param value - Value either as ratio (0-1) or percentage (0-100)
 * @param asRatio - If true, multiplies by 100 first
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, asRatio = false): string {
  if (isNaN(value) || !isFinite(value)) {
    return "0%";
  }
  const pct = asRatio ? value * 100 : value;
  const rounded = Math.round(pct * 10) / 10;
  return `${rounded}%`;
}

/**
 * Formats an ISO date string into a user-friendly display format (e.g., "15 Dec 2026").
 *
 * @param dateStr - Date string or timestamp
 * @returns Formatted date string
 */
export function formatDate(dateStr: string | number | Date): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

/**
 * Computes an estimated date by subtracting days from a target event date.
 *
 * @param eventDateStr - Target event date in YYYY-MM-DD or parseable format
 * @param daysBefore - Days prior to the event
 * @returns Human-readable date string
 */
export function calculateDateBefore(eventDateStr: string, daysBefore: number): string {
  try {
    const eventDate = new Date(eventDateStr);
    if (isNaN(eventDate.getTime())) return `${daysBefore} days before event`;
    
    const targetDate = new Date(eventDate);
    targetDate.setDate(targetDate.getDate() - daysBefore);
    
    return formatDate(targetDate);
  } catch {
    return `${daysBefore} days before event`;
  }
}
