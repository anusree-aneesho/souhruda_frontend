// src/components/Reports/PendingCollectionsReport.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { Hourglass, UserX, Truck, AlertTriangle, CheckCircle2, X } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getHomeCollectionPendingReportApi } from "../../api/api";
import { HcStatusBadge, formatHcDate } from "./shared/hcStatus";

const FILTER_LABELS = {
  unassigned: "Unassigned",
  awaiting_pickup: "Awaiting Pickup",
  overdue: "Overdue",
};

export default function PendingCollectionsReport({ onBack }) {
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Which stat card is "active" and narrowing the table below. null = all rows.
  const [activeFilter, setActiveFilter] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getHomeCollectionPendingReportApi({ q: search || undefined });
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    setActiveFilter(null);
  }, [search]);

  const allRows = data?.rows || [];

  const rows = useMemo(() => {
    switch (activeFilter) {
      case "unassigned":
        return allRows.filter((r) => r.is_unassigned);
      case "awaiting_pickup":
        return allRows.filter((r) => !r.is_unassigned);
      case "overdue":
        return allRows.filter((r) => r.is_overdue);
      default:
        return allRows;
    }
  }, [allRows, activeFilter]);

  function toggleFilter(key) {
    setActiveFilter((current) => (current === key ? null : key));
  }

  const headers = ["HC Code", "Patient", "Phone", "Slot Date", "Slot", "Status", "Technician", "Requested On"];
  const csvRows = rows.map((r) => [
    r.hc_code,
    r.patient_name,
    r.phone,
    r.slot_date,
    r.slot_label,
    r.status,
    r.technician_name || "Unassigned",
    r.requested_at,
  ]);
  const exportSuffix = activeFilter ? `-${activeFilter}` : "";

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search HC code or patient..."
        onExportCsv={() => exportToCsv(`pending-collections${exportSuffix}`, headers, csvRows)}
        onExportPdf={() => exportToPdf("Pending Collections", headers, csvRows)}
      />

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <p className="text-xs text-gray-400 -mt-2">
        A live snapshot of requests not yet collected — not limited to a date range.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Pending"
          value={data?.summary?.total_pending ?? "—"}
          icon={Hourglass}
          color="amber"
          onClick={() => setActiveFilter(null)}
          active={activeFilter === null}
        />
        <StatCard
          label="Unassigned"
          value={data?.summary?.unassigned ?? "—"}
          sublabel="Awaiting a technician"
          icon={UserX}
          color="gray"
          onClick={() => toggleFilter("unassigned")}
          active={activeFilter === "unassigned"}
        />
        <StatCard
          label="Awaiting Pickup"
          value={data?.summary?.awaiting_pickup ?? "—"}
          sublabel="Assigned or en route"
          icon={Truck}
          color="blue"
          onClick={() => toggleFilter("awaiting_pickup")}
          active={activeFilter === "awaiting_pickup"}
        />
        <StatCard
          label="Overdue"
          value={data?.summary?.overdue ?? "—"}
          sublabel="Past their slot date"
          icon={AlertTriangle}
          color="gray"
          onClick={() => toggleFilter("overdue")}
          active={activeFilter === "overdue"}
        />
      </div>

      {activeFilter && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            Showing <span className="font-medium text-gray-900">{FILTER_LABELS[activeFilter]}</span> only
            ({rows.length} of {allRows.length})
          </span>
          <button
            onClick={() => setActiveFilter(null)}
            className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <X size={12} /> Clear
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="px-4 py-3">HC Code</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Slot</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Technician</th>
                <th className="px-4 py-3">Requested On</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-teal-600 animate-spin" />
                      <span className="text-sm">Loading pending collections…</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 size={28} className="text-gray-300" />
                      <span className="text-sm font-medium text-gray-500">
                        {activeFilter ? "No records match this filter" : "Nothing pending right now"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {activeFilter
                          ? "Try clearing the filter."
                          : "Every request has been picked up or completed."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={r.hc_code || i}
                    className={`border-b border-gray-50 last:border-0 odd:bg-white even:bg-gray-50/40 hover:bg-amber-50/40 transition-colors ${
                      r.is_overdue ? "bg-rose-50/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.hc_code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.patient_name || "—"}</div>
                      <div className="text-xs text-gray-400">{r.phone || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      <span className={r.is_overdue ? "text-rose-600 font-medium" : ""}>
                        {formatHcDate(r.slot_date)}
                      </span>
                      {r.slot_label && <span className="text-gray-400"> · {r.slot_label}</span>}
                      {r.is_overdue && (
                        <span className="ml-1.5 inline-flex items-center rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                          Overdue
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <HcStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.technician_name || <span className="text-gray-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatHcDate(r.requested_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-2.5 text-xs text-gray-400">
            Showing {rows.length} {rows.length === 1 ? "request" : "requests"}
          </div>
        )}
      </div>
    </div>
  );
}