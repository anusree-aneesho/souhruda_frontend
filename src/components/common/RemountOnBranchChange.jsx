// src/components/common/RemountOnBranchChange.jsx
//
// Wraps a page so it remounts, and therefore refetches everything, whenever the
// branch picked in the topbar changes. Used for pages (Statistics, Reports)
// that load their data once on mount instead of watching the selected branch.
import { Fragment } from "react";
import { useSelectedBranch } from "../../utils/selectedBranch";

export default function RemountOnBranchChange({ children }) {
  const branch = useSelectedBranch();
  return <Fragment key={branch?.id ?? "all"}>{children}</Fragment>;
}
