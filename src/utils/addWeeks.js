// src/utils/addWeeks.js
export function addWeeksToDate(dateStr, weeks) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  date.setDate(date.getDate() + weeks * 7);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}