// src/components/common/Topbar/ActiveBranchBadge.jsx
//
// Super admin only: shows which branch they are working in (new patients / orders /
// home collections are created under it, lists show only it), or "All branches"
// when none is picked. Links to Settings to change it.
import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useAuth } from "../../../Context/AuthContext";
import { useSelectedBranch } from "../../../utils/selectedBranch";

export default function ActiveBranchBadge() {
  const { user } = useAuth();
  const branch = useSelectedBranch();

  if (user?.role !== "super_admin") return null;

  return (
    <Link
      to="/settings/lab-settings"
      title="Change working branch"
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        branch
          ? "bg-teal-50 text-teal-700 hover:bg-teal-100"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      <Building2 size={13} />
      {branch ? branch.name : "All branches"}
    </Link>
  );
}
