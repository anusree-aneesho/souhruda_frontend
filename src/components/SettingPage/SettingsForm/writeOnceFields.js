// Settings that an admin can set once and never change afterwards.

// Once saved, the lab location can never be changed, so refuse to accept a
// reading that is too rough (desktop IP/Wi-Fi positioning can be km off).
export const MAX_LOCATION_ACCURACY_M = 200;

export const SIGNATORY_SLOTS = [
  { key: "technician", field: "technician_user_id", label: "Technician" },
  { key: "lab_assistant", field: "lab_assistant_user_id", label: "Lab Assistant" },
  { key: "lab_incharge", field: "lab_incharge_user_id", label: "Lab Incharge" },
];
