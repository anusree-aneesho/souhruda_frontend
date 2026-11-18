// src/components/Dashboard/TodaysOrders/StatusBadge.jsx
import { Building2 } from "lucide-react";
import { useViewBranch } from "../../../utils/selectedBranch";
import { useAuth } from "../../../Context/AuthContext";

const styles = {
  Completed: "bg-green-100 text-green-700",
  Pending: "bg-amber-100 text-amber-700",
  "Sample Collected": "bg-blue-100 text-blue-700",
  Collected: "bg-amber-100 text-amber-700",
  "Report Ready": "bg-green-100 text-green-700",
  Requested: "bg-gray-100 text-gray-500",
  Assigned: "bg-blue-100 text-blue-700",
  "En Route": "bg-amber-100 text-amber-700",
  Processing: "bg-indigo-100 text-indigo-700",
  Sent: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  Normal: "bg-green-100 text-green-700",
  Low: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-700",
  Abnormal: "bg-red-100 text-red-700",
  Overdue: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${styles[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

// Small branch-name pill. Only shown to admin / super admin when the top bar is on
// "All branches", so rows from different branches can be told apart.
export function BranchTag({ name, className = "" }) {
  const view = useViewBranch();
  const { user } = useAuth();
  const isAdmin = ["super_admin", "admin"].includes(user?.role);
  if (!isAdmin || view !== "all" || !name) return null;
  return (
    <span
      className={`inline-flex max-w-[10rem] items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700 ${className}`}
    >
      <Building2 size={11} className="shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  );
}