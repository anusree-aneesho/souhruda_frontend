// src/components/Reports/BranchSummaryReport.jsx
//
// Shows the logged-in user's own branch only — this is "how is my branch
// doing", not a cross-branch comparison. The API is already scoped to the
// user's branch_id, so `rows` will contain at most one entry.
import { useState, useEffect, useCallback } from "react";
import { Building2, Users, ClipboardList, IndianRupee } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import { formatCurrency, todayIso, daysAgoIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getBranchSummaryReportApi } from "../../api/api";

export default function BranchSummaryReport({ onBack }) {
  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIso());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getBranchSummaryReportApi({ dateFrom, dateTo });
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const branch = data?.rows?.[0] || null;
  const headers = ["Branch", "Code", "Orders", "Patients", "Home Collections", "Tests Revenue", "Home Visit Revenue", "Total Revenue"];
  const csvRows = branch
    ? [[
        branch.branch_name,
        branch.branch_code,
        branch.orders,
        branch.patients,
        branch.home_collections,
        branch.tests_revenue,
        branch.home_visit_revenue,
        branch.total_revenue,
      ]]
    : [];

  return (
    <div className="space-y-6">
      {!onBack && (
        <h2 className="text-sm font-semibold text-gray-900">Your Branch Summary</h2>
      )}
      <ReportToolbar
        onBack={onBack}
        fields={[
          { label: "Date From", value: dateFrom, onChange: setDateFrom, max: dateTo },
          { label: "Date To", value: dateTo, onChange: setDateTo, min: dateFrom },
        ]}
        onExportCsv={() => exportToCsv("branch-summary-report", headers, csvRows)}
        onExportPdf={() => exportToPdf("Branch Summary Report", headers, csvRows)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && !branch && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your account isn't assigned to a branch, so this report has nothing to show.
        </div>
      )}

      {branch && (
        <>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Building2 className="h-4 w-4" />
            <span className="font-medium text-gray-900">{branch.branch_name}</span>
            <span className="text-gray-400">· {branch.branch_code}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard label="Orders" value={branch.orders} icon={ClipboardList} color="blue" />
            <StatCard label="Patients" value={branch.patients} icon={Users} color="purple" />
            <StatCard label="Home Collections" value={branch.home_collections} icon={Building2} color="teal" />
            <StatCard label="Total Revenue" value={formatCurrency(branch.total_revenue)} icon={IndianRupee} color="green" />
          </div>

          <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="divide-y divide-gray-50">
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-gray-500">Tests Revenue</span>
                <span className="font-medium text-gray-900">{formatCurrency(branch.tests_revenue)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-gray-500">Home Visit Revenue</span>
                <span className="font-medium text-gray-900">{formatCurrency(branch.home_visit_revenue)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-sm bg-teal-50">
                <span className="font-medium text-teal-700">Total Revenue</span>
                <span className="font-bold text-teal-700">{formatCurrency(branch.total_revenue)}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {loading && <p className="text-sm text-gray-400">Loading…</p>}
    </div>
  );
}