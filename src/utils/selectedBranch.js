// src/utils/selectedBranch.js
//
// The branch a super admin has chosen to work in (Settings -> Branches).
// Kept in localStorage so it survives a refresh, and broadcast through a window
// event so every part of the UI (topbar badge, settings page) stays in sync.
//
// api.js sends this branch's id as an X-Branch-Id header on every request, and
// the backend uses it as the branch for new patients, lab orders, home
// collections, etc. Only a super admin's header is honoured by the backend.

import { useEffect, useState } from "react";

const STORAGE_KEY = "souhruda_selected_branch";
const CHANGE_EVENT = "souhruda:selected-branch-changed";

export function getSelectedBranch() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const branch = raw ? JSON.parse(raw) : null;
    return branch && branch.id ? branch : null;
  } catch {
    return null;
  }
}

export function setSelectedBranch(branch) {
  try {
    if (branch) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(branch));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage errors (private browsing, quota, etc.)
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearSelectedBranch() {
  setSelectedBranch(null);
  setViewBranch(undefined);
}

// ── List-page "view" branch ────────────────────────────────────────────────
// Used by the dropdown on Patients / Lab Orders / Home Collection / Follow-ups.
// Separate from the Settings selection above, so changing it there never
// changes the working branch in Settings.
//   undefined -> not chosen (lists follow the Settings selection)
//   "all"     -> every branch
//   {id,name} -> that branch
const VIEW_KEY = "souhruda_view_branch";
const VIEW_EVENT = "souhruda:view-branch-changed";

export function getViewBranch() {
  try {
    const raw = localStorage.getItem(VIEW_KEY);
    if (!raw) return undefined;
    const v = JSON.parse(raw);
    return v === "all" || (v && v.id) ? v : undefined;
  } catch {
    return undefined;
  }
}

export function setViewBranch(value) {
  try {
    if (value === undefined) localStorage.removeItem(VIEW_KEY);
    else localStorage.setItem(VIEW_KEY, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
  window.dispatchEvent(new Event(VIEW_EVENT));
}

/** Header for list requests: the dropdown choice, else the Settings pick. */
export function viewBranchHeader() {
  const v = getViewBranch();
  if (v === "all") return { "X-View-Branch-Id": "all" };
  if (v?.id) return { "X-View-Branch-Id": String(v.id) };
  return {};
}

// Super admins and admins both have a Settings pick that the backend honours,
// so list pages default to it until the dropdown is used.
function isSuperAdminUser() {
  try {
    const role = JSON.parse(localStorage.getItem("souhruda_auth_user") || "null")?.role;
    return role === "super_admin" || role === "admin";
  } catch {
    return false;
  }
}

/** React hook: effective branch for list pages -> "all" | {id,name}. */
export function useViewBranch() {
  const settings = useSelectedBranch();
  const [view, setView] = useState(getViewBranch);

  useEffect(() => {
    const sync = () => setView(getViewBranch());
    window.addEventListener(VIEW_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(VIEW_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const fallback = isSuperAdminUser() ? settings : null;
  return view !== undefined ? view : fallback ?? "all";
}

/** React hook: the currently selected branch (or null), live-updating. */
export function useSelectedBranch() {
  const [branch, setBranch] = useState(getSelectedBranch);

  useEffect(() => {
    const sync = () => setBranch(getSelectedBranch());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync); // another tab changed it
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return branch;
}