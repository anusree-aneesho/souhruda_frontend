// src/components/Reports/BranchSummaryReport.jsx
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

  const rows = data?.rows || [];
  const headers = [
    "Branch",
    "Code",
    "Orders",
    "Patients",
    "Home Collections",
    "Tests Revenue",
    "Home Visit Revenue",
    "Total Revenue",
  ];
  const csvRows = rows.map((r) => [
    r.branch_name,
    r.branch_code,
    r.orders,
    r.patients,
    r.home_collections,
    r.tests_revenue,
    r.home_visit_revenue,
    r.total_revenue,
  ]);

  return (
    <div className="space-y-6">
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

      {rows.length <= 1 && !loading && !error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Only one branch has data for this period. Orders, patients and home collection requests
          made before branch tracking was added are all attributed to one branch and can't be
          split retroactively — only new records are tracked per branch going forward.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Branches" value={data?.summary?.branches ?? 0} icon={Building2} color="teal" />
        <StatCard label="Total Orders" value={data?.summary?.total_orders ?? 0} icon={ClipboardList} color="blue" />
        <StatCard label="Total Patients" value={data?.summary?.total_patients ?? 0} icon={Users} color="purple" />
        <StatCard label="Total Revenue" value={formatCurrency(data?.summary?.total_revenue)} icon={IndianRupee} color="green" />
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Patients</th>
                <th className="px-4 py-3 font-medium">Home Collections</th>
                <th className="px-4 py-3 font-medium">Tests Revenue</th>
                <th className="px-4 py-3 font-medium">Home Visit Revenue</th>
                <th className="px-4 py-3 font-medium">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No branches found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.branch_id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.branch_name}</div>
                      <div className="text-xs text-gray-400">{r.branch_code}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.orders}</td>
                    <td className="px-4 py-3 text-gray-700">{r.patients}</td>
                    <td className="px-4 py-3 text-gray-700">{r.home_collections}</td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(r.tests_revenue)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(r.home_visit_revenue)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(r.total_revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}