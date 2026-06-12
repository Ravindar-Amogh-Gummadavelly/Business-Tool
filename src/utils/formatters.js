/**
 * formatters.js
 * ─────────────────────────────────────────────────
 * Utility functions for formatting currency, dates,
 * numbers, IDs, and relative time throughout the
 * Stock Inward Dashboard.
 * ─────────────────────────────────────────────────
 */

import { CURRENCIES } from './constants';

/* ============================================================
   Currency Formatting
   ============================================================ */

/**
 * Format a numeric amount with the appropriate currency symbol.
 *
 * @param {number}  amount       — The numeric value to format
 * @param {string}  currencyCode — One of 'INR', 'USD', 'EUR', 'GBP'
 * @param {boolean} compact      — If true, use compact format for chart axes (e.g. "₹1.2L")
 * @returns {string} Formatted currency string, e.g. "₹1,45,000.00"
 */
export function formatCurrency(amount, currencyCode = 'INR', compact = false) {
  // Find the currency config, fall back to INR
  const currency = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

  // Compact mode for chart axis labels
  if (compact) {
    return `${currency.symbol}${formatCompactNumber(amount)}`;
  }

  // Use Intl.NumberFormat for locale-aware formatting
  const localeMap = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
  };

  const locale = localeMap[currency.code] || 'en-IN';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback: manual formatting
    return `${currency.symbol}${Number(amount).toFixed(2)}`;
  }
}

/* ============================================================
   Date Formatting
   ============================================================ */

/**
 * Format a date value into a human-readable string.
 *
 * @param {Date|string|number} date   — Date to format
 * @param {string}             format — One of 'short', 'long', 'input', 'timestamp', 'time'
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'short') {
  if (!date) return '—';

  const d = new Date(date);

  // Guard against invalid dates
  if (isNaN(d.getTime())) return '—';

  switch (format) {
    case 'short':
      // "23 May 2026"
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

    case 'long':
      // "Friday, 23 May 2026"
      return d.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

    case 'input':
      // "2026-05-23" — for HTML date inputs
      return d.toISOString().split('T')[0];

    case 'timestamp':
      // "23 May 2026, 14:30"
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

    case 'time':
      // "14:30"
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

    case 'month-year':
      // "May 2026"
      return d.toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      });

    default:
      return d.toLocaleDateString('en-IN');
  }
}

/* ============================================================
   Number Formatting
   ============================================================ */

/**
 * Format a number with commas (locale-aware).
 *
 * @param {number} num — The number to format
 * @returns {string} Formatted number, e.g. "1,45,000"
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Format a number compactly for display (e.g. 1.2K, 3.5M).
 *
 * @param {number} num — The number to format
 * @returns {string} Compact formatted number
 */
export function formatCompactNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';

  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`; // Crore
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;      // Lakh
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;          // Thousand

  return num.toString();
}

/* ============================================================
   Purchase ID Generation
   ============================================================ */

/**
 * Generate a unique purchase ID in the format PH-YYYYMMDD-XXXX.
 *
 * @returns {string} Purchase ID, e.g. "PH-20260523-4A7B"
 */
export function generatePurchaseId() {
  const now = new Date();

  // Date part: YYYYMMDD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;

  // Random 4-character hex suffix
  const randomPart = Math.random()
    .toString(16)
    .substring(2, 6)
    .toUpperCase();

  return `PH-${datePart}-${randomPart}`;
}

/* ============================================================
   Relative Time Formatting
   ============================================================ */

/**
 * Get a human-readable relative time string.
 *
 * @param {Date|string|number} date — The date to compare against now
 * @returns {string} Relative time, e.g. "2 hours ago", "just now"
 */
export function getRelativeTime(date) {
  if (!date) return '—';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';

  const now = new Date();
  const diffMs = now - d;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  // Future dates
  if (diffMs < 0) return 'just now';

  if (diffSeconds < 30) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;

  // Older than a year — show formatted date
  return formatDate(d, 'short');
}

/* ============================================================
   Misc Helpers
   ============================================================ */

/**
 * Truncate text to a max length with ellipsis.
 *
 * @param {string} text   — The text to truncate
 * @param {number} maxLen — Maximum character length (default 50)
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLen = 50) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).trimEnd() + '…';
}

/**
 * Get the unit label for a unit value.
 *
 * @param {string} unitValue — e.g. 'pcs', 'kg', 'boxes'
 * @returns {string} Label, e.g. 'Pieces'
 */
export function getUnitLabel(unitValue) {
  const unitMap = {
    pcs: 'Pieces',
    kg: 'Kilograms',
    boxes: 'Boxes',
    dozens: 'Dozens',
    meters: 'Meters',
    liters: 'Liters',
  };
  return unitMap[unitValue] || unitValue;
}

/**
 * Get the currency symbol for a currency code.
 *
 * @param {string} currencyCode — e.g. 'INR', 'USD'
 * @returns {string} Symbol, e.g. '₹'
 */
export function getCurrencySymbol(currencyCode = 'INR') {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  return currency ? currency.symbol : '₹';
}
