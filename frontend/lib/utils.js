/**
 * Utility helpers for the MailDoor frontend.
 */

import { clsx } from "clsx";

/**
 * Merge class names — thin wrapper for conditional classes.
 * Uses clsx under the hood for conditional joining.
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * Format a date string into a human-readable format.
 * @param {string|Date} date
 * @param {object} opts - Intl.DateTimeFormat options
 */
export function formatDate(date, opts = {}) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  }).format(new Date(date));
}

/**
 * Format relative time (e.g., "2 hours ago").
 * @param {string|Date} date
 */
export function timeAgo(date) {
  if (!date) return "—";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const { label, seconds: s } of intervals) {
    const count = Math.floor(seconds / s);
    if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

/**
 * Truncate a string to a max length with ellipsis.
 */
export function truncate(str, max = 40) {
  if (!str || str.length <= max) return str;
  return str.slice(0, max) + "…";
}

/**
 * Mask an API key for display (show prefix + suffix).
 */
export function maskApiKey(prefix, suffix) {
  return `${prefix}••••••••${suffix}`;
}

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
