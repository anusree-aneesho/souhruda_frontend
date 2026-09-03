// src/utils/calculateFlag.js
export function calculateFlag(range, result) {
  if (result === undefined || result === null || String(result).trim() === "") {
    return "Pending";
  }

  const numResult = parseFloat(result);

  // Threshold ranges like "<200" or ">40"
  const thresholdMatch = range.match(/^([<>])\s*(\d+(\.\d+)?)$/);
  if (thresholdMatch) {
    const [, operator, valueStr] = thresholdMatch;
    const threshold = parseFloat(valueStr);
    if (isNaN(numResult)) return "Pending";
    if (operator === "<") return numResult < threshold ? "Normal" : "High";
    return numResult > threshold ? "Normal" : "Low"; // operator === ">"
  }

  // Min-max ranges like "70-110"
  const rangeMatch = range.match(/^(\d+(\.\d+)?)\s*-\s*(\d+(\.\d+)?)$/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[3]);
    if (isNaN(numResult)) return "Pending";
    if (numResult < min) return "Low";
    if (numResult > max) return "High";
    return "Normal";
  }

  // Qualitative tests like "Negative", "Non-reactive"
  return String(result).trim().toLowerCase() === range.trim().toLowerCase() ? "Normal" : "Abnormal";
}