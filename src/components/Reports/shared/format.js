// src/components/Reports/shared/format.js

// Rows per page for all report tables. Change it here and every report follows.
export const PAGE_SIZE = 10;

export function formatCurrency(value) {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

// Local-calendar YYYY-MM-DD. (toISOString() is UTC, which in India returns
// the previous day between 00:00 and 05:30 and shifts the default period.)
function toLocalIso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayIso() {
  return toLocalIso(new Date());
}

export function daysAgoIso(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toLocalIso(d);
}