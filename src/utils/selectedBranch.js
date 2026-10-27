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
