// src/components/Reports/shared/format.js
export function formatCurrency(value) {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgoIso(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}