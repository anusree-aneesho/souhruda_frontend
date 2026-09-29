export const RANGES = ["Today", "Yesterday", "1 Week", "1 Month", "1 Year"];

export function getRangeBounds(range) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const tomorrow = addDays(today, 1);

  switch (range) {
    case "Today":     return [today, tomorrow];
    case "Yesterday": return [addDays(today, -1), today];
    case "1 Week":    return [addDays(today, -6), tomorrow];
    case "1 Month":   return [addDays(today, -29), tomorrow];
    case "1 Year":    return [addDays(today, -364), tomorrow];
    default:          return [today, tomorrow];
  }
}