// src/components/Reports/BranchQuickTable.jsx
//
// Always-visible snapshot on the Branch Reports landing page, shown under
// the report cards (see Reports.jsx's `category.quickView`). Pulls the
// last 30 days from the same endpoint as the full Branch Summary report,
// so it's a live glance rather than a static menu.
import { useState, useEffect } from "react";
import { Building2, ArrowRight } from "lucide-react";
import { formatCurrency, todayIso, daysAgoIso } from "./shared/format";
import { getBranchSummaryReportApi } from "../../api/api";

const MAX_ROWS = 5;

export default function BranchQuickTable({ onViewAll }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getBranchSummaryReportApi({
          dateFrom: daysAgoIso(30),
          dateTo: todayIso(),
        });
        if (!cancelled) setRows(res?.rows || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load branch snapshot.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null; // the report cards above are enough while this loads
  if (error || rows.length === 0) return null; // fail quiet — this is a bonus glance, not the main content

  const visibleRows = rows.slice(0, MAX_ROWS);
  const hasMore = rows.length > MAX_ROWS;

  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Branches at a glance</h2>
          <span className="text-xs text-gray-400">Last 30 days</span>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          View Full Report
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
              <th className="px-5 py-2.5 font-medium">Branch</th>
              <th className="px-5 py-2.5 font-medium">Orders</th>
              <th className="px-5 py-2.5 font-medium">Patients</th>
              <th className="px-5 py-2.5 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r) => (
              <tr key={r.branch_id} className="border-b border-gray-50 last:border-0">
                <td className="px-5 py-3">
                  <div className="font-medium text-gray-900">{r.branch_name}</div>
                  <div className="text-xs text-gray-400">{r.branch_code}</div>
                </td>
                <td className="px-5 py-3 text-gray-700">{r.orders}</td>
                <td className="px-5 py-3 text-gray-700">{r.patients}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{formatCurrency(r.total_revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="px-5 py-2.5 text-xs text-gray-400 border-t border-gray-50">
          +{rows.length - MAX_ROWS} more branch{rows.length - MAX_ROWS === 1 ? "" : "es"} in the full report
        </div>
      )}
    </div>
  );
}