// src/components/Reports/HomeCollectionQuickTable.jsx
import { useState, useEffect } from "react";
import { ArrowRight, ClipboardList } from "lucide-react";
import { formatCurrency, todayIso, daysAgoIso } from "./shared/format";
import { getHomeCollectionSummaryReportApi } from "../../api/api";
import { HcStatusBadge, formatHcDate } from "./shared/hcStatus";

const PREVIEW_ROW_COUNT = 8;

export default function HomeCollectionQuickTable({ onViewAll }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        // Last 30 days is enough for a "what's happening lately" preview —
        // the full Collection Summary report has its own date range picker.
        const res = await getHomeCollectionSummaryReportApi({ dateFrom: daysAgoIso(30), dateTo: todayIso() });
        if (!cancelled) setRows((res?.rows || []).slice(0, PREVIEW_ROW_COUNT));
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load recent collections.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Recent Collections</h2>
          <p className="text-xs text-gray-400 mt-0.5">Last 30 days, most recent first</p>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 transition-colors"
        >
          View full report <ArrowRight size={14} />
        </button>
      </div>

      {error && <p className="px-4 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
              <th className="px-4 py-3">HC Code</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Slot</th>
              <th className="px-4 py-3">Technician</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Distance</th>
              <th className="px-4 py-3 text-right">Charge</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <span className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-teal-600 animate-spin" />
                    <span className="text-sm">Loading recent collections…</span>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <ClipboardList size={26} className="text-gray-300" />
                    <span className="text-sm font-medium text-gray-500">No collections in the last 30 days</span>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr
                  key={r.hc_code || i}
                  className="border-b border-gray-50 last:border-0 odd:bg-white even:bg-gray-50/40 hover:bg-amber-50/40 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.hc_code}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.patient_name || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatHcDate(r.slot_date)}
                    {r.slot_label && <span className="text-gray-400"> · {r.slot_label}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.technician_name || "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <HcStatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 tabular-nums">
                    {r.distance_km != null ? `${r.distance_km} km` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                    {formatCurrency(r.collection_charge)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}