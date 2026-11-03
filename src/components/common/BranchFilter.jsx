// src/components/common/BranchFilter.jsx
//
// Super admin only: a dropdown of "All branches" + every branch, shown in the
// header of Patients / Lab Orders / Home Collection / Follow-ups.
//
// It reads and writes the same app-wide selected branch used by Settings and
// the topbar badge (utils/selectedBranch.js), so all three stay in sync. The
// choice is sent to the backend as X-Branch-Id on every request, which is what
// narrows the lists. Pages refetch by depending on useSelectedBranch()?.id.
import { useEffect, useState } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { getBranchesApi } from "../../api/api";
import { useAuth } from "../../Context/AuthContext";
import { useSelectedBranch, setSelectedBranch } from "../../utils/selectedBranch";

export default function BranchFilter() {
  const { user } = useAuth();
  const selected = useSelectedBranch();
  const [branches, setBranches] = useState([]);
  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    if (!isSuperAdmin) return;
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
  }, [isSuperAdmin]);

  if (!isSuperAdmin) return null;

  function handleChange(e) {
    const id = e.target.value;
    if (!id) {
      setSelectedBranch(null); // All branches
      return;
    }
    const branch = branches.find((b) => String(b.id) === id);
    if (branch) setSelectedBranch(branch);
  }

  // Keep the current pick visible even if the list hasn't loaded yet.
  const hasSelectedInList = selected && branches.some((b) => b.id === selected.id);

  return (
    <div className="relative w-full sm:w-56">
      <Building2
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-teal-600"
      />
      <select
        value={selected?.id ?? ""}
        onChange={handleChange}
        aria-label="Filter by branch"
        className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-teal-500 focus:outline-none cursor-pointer"
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
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
    </div>
  );
}
