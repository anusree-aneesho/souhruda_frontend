// src/components/common/BranchFilter.jsx
//
// Super admin only: the branch switcher, shown in the topbar (in place of the
// old static branch badge). It offers "All branches" + every branch.
//
// It reads and writes the app-wide selected branch (utils/selectedBranch.js),
// which is shared with Settings. The choice is sent to the backend as
// X-Branch-Id on every request, which is what narrows the lists. Pages refetch
// by depending on useSelectedBranch()?.id.
//
// Looks like a pill showing the current branch name; a transparent native
// <select> sits on top of it, so clicking the pill opens the branch list.
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Building2, ChevronDown } from "lucide-react";
import { getBranchesApi, BRANCHES_CHANGED_EVENT } from "../../api/api";
import { useAuth } from "../../Context/AuthContext";
import { useViewBranch, setViewBranch, setSelectedBranch } from "../../utils/selectedBranch";

// Pages where the branch can be switched: exactly the sidebar destinations.
// Everywhere else (order details, report print page, patient follow-up details,
// activity log, individual reports like /reports/home-collection/hc-summary...)
// the top bar just shows the current branch name.
const SWITCHABLE_EXACT = [
  "/",
  "/patients",
  "/lab-orders",
  "/home-collection",
  "/test-master",
  "/follow-ups",
  "/statistics",
  "/settings/lab-settings",
  "/settings/gst",
  "/settings/staff-management",
  "/settings/test-configuration",
];

function isSwitchablePath(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (SWITCHABLE_EXACT.includes(path)) return true;
  // Sidebar report categories: /reports/<category> (exactly one segment).
  if (/^\/reports\/[^/]+$/.test(path)) return true;
  return false;
}

export default function BranchFilter() {
  const { user } = useAuth();
  // What the dropdown shows follows the "view branch" (the one the list pages,
  // GST Settings, etc. read): "all" | { id, name }.
  const view = useViewBranch();
  const selected = view === "all" ? null : view;
  const { pathname } = useLocation();
  const [branches, setBranches] = useState([]);
  const isSuperAdmin = user?.role === "super_admin";

  const loadBranches = useCallback(() => {
    let cancelled = false;
    getBranchesApi()
      .then((res) => {
        if (!cancelled) setBranches(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setBranches([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The topbar stays mounted across pages, so refetch on navigation...
  useEffect(() => {
    if (!isSuperAdmin) return;
    return loadBranches();
  }, [isSuperAdmin, pathname, loadBranches]);

  // ...and whenever a branch is added / edited / deleted in Settings.
  useEffect(() => {
    if (!isSuperAdmin) return;
    window.addEventListener(BRANCHES_CHANGED_EVENT, loadBranches);
    return () => window.removeEventListener(BRANCHES_CHANGED_EVENT, loadBranches);
  }, [isSuperAdmin, loadBranches]);

  if (!isSuperAdmin) return null;

  const pillColors = selected
    ? "bg-teal-50 text-teal-700"
    : "bg-amber-50 text-amber-700";

  // Not a sidebar page: show the current branch, no switching.
  if (!isSwitchablePath(pathname)) {
    return (
      <div
        title="Current branch"
        className={`flex max-w-[15rem] items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${pillColors}`}
      >
        <Building2 size={13} className="shrink-0" />
        <span className="truncate">{selected ? selected.name : "All branches"}</span>
      </div>
    );
  }

  function handleChange(e) {
    const id = e.target.value;
    if (!id) {
      // All branches
      setSelectedBranch(null);
      setViewBranch("all");
      return;
    }
    const branch = branches.find((b) => String(b.id) === id);
    if (branch) {
      // Set both: the view branch drives what the pages show, the Settings
      // branch is the working branch for new records.
      setSelectedBranch(branch);
      setViewBranch(branch);
    }
  }

  // Keep the current pick visible even if the list hasn't loaded yet.
  const hasSelectedInList = selected && branches.some((b) => b.id === selected.id);

  return (
    <div
      title="Switch branch"
      className={`relative flex max-w-[15rem] items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors focus-within:ring-2 focus-within:ring-teal-500 ${pillColors} ${
        selected ? "hover:bg-teal-100" : "hover:bg-amber-100"
      }`}
    >
      <Building2 size={13} className="shrink-0" />
      <span className="truncate">{selected ? selected.name : "All branches"}</span>
      <ChevronDown size={13} className="shrink-0 opacity-70" />

      <select
        value={selected?.id ?? ""}
        onChange={handleChange}
        aria-label="Switch branch"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 text-sm text-gray-700"
      >
        <option value="">All branches</option>
        {selected && !hasSelectedInList && (
          <option value={selected.id}>{selected.name}</option>
        )}
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
            {b.is_active === false ? " (inactive)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}