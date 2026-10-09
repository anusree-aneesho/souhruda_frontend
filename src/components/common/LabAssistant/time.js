// src/components/common/LabAssistant/time.js
// Small date/time helpers for chat timestamps and history grouping.

function parseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function formatClock(value) {
  const date = parseDate(value);
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Today -> "10:42 AM" | Yesterday -> "Yesterday 10:42 AM" | Older -> "Oct 3, 10:42 AM"
export function formatMessageStamp(value) {
  const date = parseDate(value);
  if (!date) return "";
  const now = new Date();
  if (startOfDay(date) === startOfDay(now)) return formatClock(date);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (startOfDay(date) === startOfDay(yesterday)) {
    return `Yesterday ${formatClock(date)}`;
  }
  const day = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${day}, ${formatClock(date)}`;
}

// "Just now" | "5m ago" | "3h ago" | "Yesterday" | "2d ago" | "Oct 3"
export function formatRelative(value) {
  const date = parseDate(value);
  if (!date) return "";
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const now = new Date();
  if (startOfDay(date) === startOfDay(now)) {
    return `${Math.floor(diffMinutes / 60)}h ago`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (startOfDay(date) === startOfDay(yesterday)) return "Yesterday";

  const days = Math.floor((startOfDay(now) - startOfDay(date)) / 86400000);
  if (days <= 7) return `${days}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// Groups items into Today / Yesterday / Previous 7 days / Older buckets.
export function groupByDate(items, getDate = (item) => item.updated_at) {
  const now = new Date();
  const startToday = startOfDay(now);
  const startYesterday = startToday - 86400000;
  const weekAgo = startToday - 7 * 86400000;

  const groups = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const item of items) {
    const timestamp = parseDate(getDate(item))?.getTime() ?? 0;
    if (timestamp >= startToday) groups[0].items.push(item);
    else if (timestamp >= startYesterday) groups[1].items.push(item);
    else if (timestamp >= weekAgo) groups[2].items.push(item);
    else groups[3].items.push(item);
  }

  return groups.filter((group) => group.items.length > 0);
}
