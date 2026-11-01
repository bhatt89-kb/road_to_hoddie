/**
 * @file lib/format.ts
 * @module Format
 * @description Formatting utilities for Indian Rupee (INR), dates, and percentages.
 * Provides locale-aware formatting with Indian digit grouping (Lakh/Crore system)
 * and compact notation for large amounts.
 * 
 * **Indian Number System:**
 * - Thousand: 1,000 (1k)
 * - Lakh: 1,00,000 (100k)
 * - Crore: 1,00,00,000 (10M)
 * 
 * @example
 * formatCurrencyINR(1500000) // "₹15,00,000"
 * formatCurrencyINR(1500000, { compact: true }) // "₹15 Lakh"
 * formatPercentage(15.5) // "15.5%"
 * formatDate("2026-12-15") // "15 Dec 2026"
 */

// ============================================================================
// Currency Formatting
// ============================================================================

/**
 * Formats a numeric amount in INR with Indian comma grouping.
 * Supports standard and compact formats (Lakh/Crore notation).
 * 
 * **Indian Grouping System:**
 * - First 3 digits from right, then groups of 2
 * - Example: 12,34,56,789 (not 123,456,789)
 * 
 * **Compact Format:**
 * - ≥1 Cr (10,000,000) → "₹1.5 Cr"
 * - ≥1 Lakh (100,000) → "₹15 Lakh"
 * - ≥1k (1,000) → "₹15k"
 * - <1k → "₹500"
 * 
 * @param {number} amount - The numerical amount in INR (paisa not supported)
 * @param {object} [options={}] - Formatting options
 * @param {boolean} [options.showSymbol=true] - Whether to show ₹ symbol
 * @param {number} [options.maximumFractionDigits=0] - Decimal places (0 for whole numbers)
 * @param {boolean} [options.compact=false] - Use compact notation (Lakh/Crore)
 * @returns {string} Formatted currency string with ₹ symbol
 * 
 * @example
 * // Standard formatting
 * formatCurrencyINR(1234567) // "₹12,34,567"
 * formatCurrencyINR(1234567.89, { maximumFractionDigits: 2 }) // "₹12,34,567.89"
 * 
 * // Compact formatting
 * formatCurrencyINR(1500000, { compact: true }) // "₹15 Lakh"
 * formatCurrencyINR(25000000, { compact: true }) // "₹2.5 Cr"
 * formatCurrencyINR(5000, { compact: true }) // "₹5k"
 * 
 * // Without symbol
 * formatCurrencyINR(1000, { showSymbol: false }) // "1,000"
 * 
 * // Edge cases
 * formatCurrencyINR(0) // "₹0"
 * formatCurrencyINR(-500) // "-₹500"
 * formatCurrencyINR(NaN) // "₹0"
 * formatCurrencyINR(Infinity) // "₹0"
 * 
 * @see {@link https://en.wikipedia.org/wiki/Indian_numbering_system|Indian Numbering System}
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

// ============================================================================
// Percentage Formatting
// ============================================================================

/**
 * Formats a percentage value with proper rounding and symbol.
 * Accepts values as either ratio (0-1) or percentage (0-100).
 * 
 * @param {number} value - Value either as ratio (0-1) or percentage (0-100)
 * @param {boolean} [asRatio=false] - If true, multiplies by 100 first (for 0-1 values)
 * @returns {string} Formatted percentage string with % symbol
 * 
 * @example
 * // As percentage (default)
 * formatPercentage(15.5) // "15.5%"
 * formatPercentage(100) // "100%"
 * formatPercentage(0.5) // "0.5%"
 * 
 * // As ratio (0-1)
 * formatPercentage(0.155, true) // "15.5%"
 * formatPercentage(1, true) // "100%"
 * formatPercentage(0.005, true) // "0.5%"
 * 
 * // Edge cases
 * formatPercentage(NaN) // "0%"
 * formatPercentage(Infinity) // "0%"
 * 
 * @performance O(1) - constant time operation
 */
export function formatPercentage(value: number, asRatio = false): string {
  if (isNaN(value) || !isFinite(value)) {
    return "0%";
  }
  const pct = asRatio ? value * 100 : value;
  const rounded = Math.round(pct * 10) / 10;
  return `${rounded}%`;
}

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Formats an ISO date string into a user-friendly display format using Indian locale.
 * 
 * **Format:** "15 Dec 2026" (day month year)
 * 
 * @param {string | number | Date} dateStr - Date string, timestamp, or Date object
 * @returns {string} Formatted date string or original value if invalid
 * 
 * @example
 * formatDate("2026-12-15") // "15 Dec 2026"
 * formatDate("2026-01-01") // "1 Jan 2026"
 * formatDate(1735689600000) // "1 Jan 2026"
 * formatDate(new Date(2026, 11, 15)) // "15 Dec 2026"
 * 
 * // Invalid inputs
 * formatDate("invalid") // "invalid"
 * formatDate("") // ""
 * 
 * @performance O(1) - uses native Intl.DateTimeFormat
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
 * Computes a date by subtracting days from a target event date.
 * Useful for creating countdown timelines and planning milestones.
 * 
 * @param {string} eventDateStr - Target event date in YYYY-MM-DD or parseable ISO format
 * @param {number} daysBefore - Number of days prior to the event (positive integer)
 * @returns {string} Human-readable date string or fallback description
 * 
 * @example
 * // Valid date calculations
 * calculateDateBefore("2026-12-15", 30) // "15 Nov 2026"
 * calculateDateBefore("2026-12-15", 90) // "16 Sep 2026"
 * calculateDateBefore("2026-01-15", 15) // "31 Dec 2025"
 * 
 * // Invalid inputs - returns fallback
 * calculateDateBefore("invalid", 30) // "30 days before event"
 * calculateDateBefore("", 7) // "7 days before event"
 * 
 * @performance O(1) - simple date arithmetic
 * @see {@link formatDate} for date formatting
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
