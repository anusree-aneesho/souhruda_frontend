// src/components/Reports/shared/hcStatus.js
// Shared label/color map for home_collection_requests.status across the
// Home Collection report views, kept in one place so they stay consistent.

export const HC_STATUS_META = {
  requested: { label: "Requested", className: "bg-gray-100 text-gray-600" },
  assigned: { label: "Assigned", className: "bg-blue-50 text-blue-700" },
  en_route: { label: "En Route", className: "bg-indigo-50 text-indigo-700" },
  collected: { label: "Collected", className: "bg-teal-50 text-teal-700" },
  processing: { label: "Processing", className: "bg-cyan-50 text-cyan-700" },
  report_ready: { label: "Report Ready", className: "bg-purple-50 text-purple-700" },
  sent: { label: "Sent", className: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelled", className: "bg-rose-50 text-rose-700" },
};

export function HcStatusBadge({ status }) {
  const meta = HC_STATUS_META[status] || { label: status || "—", className: "bg-gray-100 text-gray-500" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.className}`}>
      {meta.label}
    </span>
  );
}

export function formatHcDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}