// src/components/Reports/shared/branchFilter.js
//
// Branch dropdown support for the branch reports. The API returns every
// branch (rows) plus per-day-per-branch rows (daily), so picking a branch is
// a client-side filter — no extra request needed.
import { useState } from "react";

export const ALL_BRANCHES = "all";

export function filterByBranch(list, branchId) {
  if (branchId === ALL_BRANCHES) return list;
  return list.filter((r) => String(r.branch_id) === branchId);
}

// Builds the dropdown options from the latest loaded rows and keeps them while
// a new period is loading, so the dropdown doesn't blink empty.
export function useBranchOptions(allRows) {
  const [options, setOptions] = useState([]);
  const [source, setSource] = useState(null);

  // Update during render (the pattern React documents for state derived from
  // props) — only when a new, non-empty result arrives.
  if (allRows.length > 0 && allRows !== source) {
    setSource(allRows);
    setOptions(allRows.map((r) => ({ value: String(r.branch_id), label: r.branch_name })));
  }

  return [{ value: ALL_BRANCHES, label: "All branches" }, ...options];
}