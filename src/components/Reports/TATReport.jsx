// src/components/Reports/TATReport.jsx
import { useState, useEffect, useCallback } from "react";
import { Timer, TrendingUp, TrendingDown, Gauge } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import { todayIso, daysAgoIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getTatReportApi } from "../../api/api";

function formatHours(h) {
  if (h === null || h === undefined) return "-";
  if (h < 1) {
    const minutes = Math.round(h * 60);
    return minutes < 1 ? "< 1 min" : `${minutes} min`;
  }
  return `${h.toFixed(1)} hrs`;
}

export default function TATReport({ onBack }) {
  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIso());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getTatReportApi({ dateFrom, dateTo });
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

  const rows = data?.by_test || [];
  const headers = ["Test", "Samples", "Avg TAT (hrs)", "Min TAT (hrs)", "Max TAT (hrs)"];
  const csvRows = rows.map((r) => [
    r.test_name, r.sample_count, r.avg_tat_hours, r.min_tat_hours, r.max_tat_hours,
  ]);

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[
          { label: "Date From", value: dateFrom, onChange: setDateFrom, max: dateTo },
          { label: "Date To", value: dateTo, onChange: setDateTo, min: dateFrom },
        ]}
        onExportCsv={() => exportToCsv("tat-report", headers, csvRows)}
        onExportPdf={() => exportToPdf("TAT Report", headers, csvRows)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && data.summary.orders_with_tat === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No completed orders with both a sample-collection and completion time in this range yet.
          TAT figures will appear once orders move through both steps.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Orders with TAT" value={data?.summary?.orders_with_tat ?? "-"} icon={Gauge} color="teal" />
        <StatCard label="Avg TAT" value={formatHours(data?.summary?.avg_tat_hours)} icon={Timer} color="indigo" />
        <StatCard label="Fastest" value={formatHours(data?.summary?.min_tat_hours)} icon={TrendingDown} color="green" />
        <StatCard label="Slowest" value={formatHours(data?.summary?.max_tat_hours)} icon={TrendingUp} color="amber" />
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Test</th>
                <th className="px-4 py-3 font-medium">Samples</th>
                <th className="px-4 py-3 font-medium">Avg TAT</th>
                <th className="px-4 py-3 font-medium">Fastest</th>
                <th className="px-4 py-3 font-medium">Slowest</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No data in this range.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-900 font-medium">{r.test_name}</td>
                    <td className="px-4 py-3 text-gray-500">{r.sample_count}</td>
                    <td className="px-4 py-3 text-gray-900">{formatHours(r.avg_tat_hours)}</td>
                    <td className="px-4 py-3 text-green-700">{formatHours(r.min_tat_hours)}</td>
                    <td className="px-4 py-3 text-amber-700">{formatHours(r.max_tat_hours)}</td>
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