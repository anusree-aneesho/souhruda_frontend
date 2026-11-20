// src/utils/permissions.js

// Same normalisation the sidebar uses, so "Front Office", "front-office"
// and "front_office" all become "front_office".
export function normaliseRole(role) {
  return String(role ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

// Allow-list: only these roles may enter, save or complete results.
// Any role added later (e.g. accountant) is blocked by default.
export const RESULT_ENTRY_ROLES = [
  "super_admin",
  "superadmin",
  "admin",
  "lab_incharge",
  "lab_technician",
  "technician", 
  "lab_assistant",
];

export function canEnterResults(role) {
  return RESULT_ENTRY_ROLES.includes(normaliseRole(role));
}