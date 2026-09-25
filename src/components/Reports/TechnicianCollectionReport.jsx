// src/components/Reports/TechnicianCollectionReport.jsx
import { useState, useEffect, useCallback } from "react";
import { UserCheck2, Users, CheckCircle2, Timer, UserRound } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import { todayIso, daysAgoIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getHomeCollectionTechniciansReportApi } from "../../api/api";

function RateBar({ value, colorClass }) {
  if (value == null) return <span className="text-gray-400">—</span>;
  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="tabular-nums text-gray-700 font-medium w-10 text-right">{value}%</span>
    </div>
  );
}

export default function TechnicianCollectionReport({ onBack }) {
  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIso());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getHomeCollectionTechniciansReportApi({ dateFrom, dateTo });
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
  const headers = ["Technician", "Zone", "Assigned", "Completed", "Pending", "Completion Rate", "On-time Rate", "Avg. Distance (km)"];
  const csvRows = rows.map((r) => [
    r.technician_name,
    r.zone || "",
    r.assigned,
    r.completed,
    r.pending,
    `${r.completion_rate}%`,
    r.on_time_rate != null ? `${r.on_time_rate}%` : "N/A",
    r.avg_distance_km ?? "",
  ]);

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[
          { label: "Date From", value: dateFrom, onChange: setDateFrom, max: dateTo },
          { label: "Date To", value: dateTo, onChange: setDateTo, min: dateFrom },
        ]}
        onExportCsv={() => exportToCsv("technician-wise-collection", headers, csvRows)}
        onExportPdf={() => exportToPdf("Technician-wise Collection", headers, csvRows)}
      />

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <p className="text-xs text-gray-400 -mt-2">
        On-time rate compares the slot date against when the sample was actually marked collected, for jobs where
        that moment was logged.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Technicians"
          value={data?.summary?.technicians ?? "—"}
          sublabel="With jobs in this range"
          icon={Users}
          color="amber"
        />
        <StatCard
          label="Jobs Assigned"
          value={data?.summary?.total_assigned ?? "—"}
          icon={UserCheck2}
          color="blue"
        />
        <StatCard
          label="Jobs Completed"
          value={data?.summary?.total_completed ?? "—"}
          icon={CheckCircle2}
          color="teal"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="px-4 py-3">Technician</th>
                <th className="px-4 py-3">Zone</th>
                <th className="px-4 py-3 text-center">Assigned</th>
                <th className="px-4 py-3 text-center">Completed</th>
                <th className="px-4 py-3 text-center">Pending</th>
                <th className="px-4 py-3 text-right">Completion Rate</th>
                <th className="px-4 py-3 text-right">On-time Rate</th>
                <th className="px-4 py-3 text-right">Avg. Distance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-teal-600 animate-spin" />
                      <span className="text-sm">Loading technicians…</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <UserRound size={28} className="text-gray-300" />
                      <span className="text-sm font-medium text-gray-500">No technician jobs in this range</span>
                      <span className="text-xs text-gray-400">Try widening the dates.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={r.technician_id ?? i}
                    className="border-b border-gray-50 last:border-0 odd:bg-white even:bg-gray-50/40 hover:bg-amber-50/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                          <UserCheck2 size={14} />
                        </span>
                        <span className="font-medium text-gray-900">{r.technician_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.zone || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex min-w-[1.75rem] justify-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {r.assigned}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{r.completed}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{r.pending}</td>
                    <td className="px-4 py-3">
                      <RateBar value={r.completion_rate} colorClass="bg-teal-500" />
                    </td>
                    <td className="px-4 py-3">
                      <RateBar value={r.on_time_rate} colorClass="bg-blue-500" />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 tabular-nums">
                      {r.avg_distance_km != null ? `${r.avg_distance_km} km` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-2.5 text-xs text-gray-400">
            Showing {rows.length} {rows.length === 1 ? "technician" : "technicians"}
          </div>
        )}
      </div>
    </div>
  );
}