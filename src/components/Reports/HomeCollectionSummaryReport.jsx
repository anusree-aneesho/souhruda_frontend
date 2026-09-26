// src/components/Reports/HomeCollectionSummaryReport.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { MapPin, CheckCircle2, Hourglass, XCircle, Route, ClipboardList, X } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import { formatCurrency, todayIso, daysAgoIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getHomeCollectionSummaryReportApi } from "../../api/api";
import { HcStatusBadge, formatHcDate } from "./shared/hcStatus";
import Pagination from "./shared/Pagination";

const PAGE_SIZE = 7;
const COMPLETED_STATUSES = ["collected", "processing", "report_ready", "sent"];
const PENDING_STATUSES = ["requested", "assigned", "en_route"];

const FILTER_LABELS = {
  completed: "Completed",
  pending: "Pending",
  cancelled: "Cancelled",
  distance: "Has recorded distance, sorted farthest first",
};

export default function HomeCollectionSummaryReport({ onBack }) {
  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIso());
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Which stat card is "active" and narrowing the table below. null = all rows.
  const [activeFilter, setActiveFilter] = useState(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getHomeCollectionSummaryReportApi({ dateFrom, dateTo, q: search || undefined });
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, search]);

  // Reset the card filter whenever the underlying data changes (new date
  // range or search) so it never silently filters against stale data.
  useEffect(() => {
    setActiveFilter(null);
  }, [dateFrom, dateTo, search]);

  // Back to page 1 whenever the filter or the underlying rows change, so
  // pagination never gets stuck past the end of a shorter result set.
  useEffect(() => {
    setPage(1);
  }, [activeFilter, data]);

  const allRows = data?.rows || [];

  const rows = useMemo(() => {
    switch (activeFilter) {
      case "completed":
        return allRows.filter((r) => COMPLETED_STATUSES.includes(r.status));
      case "pending":
        return allRows.filter((r) => PENDING_STATUSES.includes(r.status));
      case "cancelled":
        return allRows.filter((r) => r.status === "cancelled");
      case "distance":
        return allRows
          .filter((r) => r.distance_km != null)
          .slice()
          .sort((a, b) => b.distance_km - a.distance_km);
      default:
        return allRows;
    }
  }, [allRows, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function toggleFilter(key) {
    setActiveFilter((current) => (current === key ? null : key));
  }

  const headers = ["HC Code", "Patient", "Slot Date", "Slot", "Technician", "Status", "Distance (km)", "Charge"];
  const csvRows = rows.map((r) => [
    r.hc_code,
    r.patient_name,
    r.slot_date,
    r.slot_label,
    r.technician_name || "Unassigned",
    r.status,
    r.distance_km ?? "",
    r.collection_charge,
  ]);
  const exportSuffix = activeFilter ? `-${activeFilter}` : "";

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[
          { label: "Date From", value: dateFrom, onChange: setDateFrom, max: dateTo },
          { label: "Date To", value: dateTo, onChange: setDateTo, min: dateFrom },
        ]}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search HC code or patient..."
        onExportCsv={() => exportToCsv(`home-collection-summary${exportSuffix}`, headers, csvRows)}
        onExportPdf={() => exportToPdf("Home Collection Summary", headers, csvRows)}
      />

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Requests"
          value={data?.summary?.total_requests ?? "—"}
          sublabel="In selected range"
          icon={MapPin}
          color="amber"
          onClick={() => setActiveFilter(null)}
          active={activeFilter === null}
        />
        <StatCard
          label="Completed"
          value={data?.summary?.completed ?? "—"}
          sublabel={data?.summary ? `${data.summary.completion_rate}% completion rate` : undefined}
          icon={CheckCircle2}
          color="teal"
          onClick={() => toggleFilter("completed")}
          active={activeFilter === "completed"}
        />
        <StatCard
          label="Pending"
          value={data?.summary?.pending ?? "—"}
          sublabel="Unassigned or in progress"
          icon={Hourglass}
          color="blue"
          onClick={() => toggleFilter("pending")}
          active={activeFilter === "pending"}
        />
        <StatCard
          label="Cancelled"
          value={data?.summary?.cancelled ?? "—"}
          icon={XCircle}
          color="gray"
          onClick={() => toggleFilter("cancelled")}
          active={activeFilter === "cancelled"}
        />
        <StatCard
          label="Avg. Distance"
          value={data?.summary?.avg_distance_km != null ? `${data.summary.avg_distance_km} km` : "—"}
          sublabel={data?.summary ? formatCurrency(data.summary.total_collection_charge) + " total charges" : undefined}
          icon={Route}
          color="purple"
          onClick={() => toggleFilter("distance")}
          active={activeFilter === "distance"}
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
                <th className="px-4 py-3">Technician</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Distance</th>
                <th className="px-4 py-3 text-right">Charge</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-teal-600 animate-spin" />
                      <span className="text-sm">Loading collections…</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList size={28} className="text-gray-300" />
                      <span className="text-sm font-medium text-gray-500">
                        {activeFilter ? "No records match this filter" : "No home collections in this range"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {activeFilter ? "Try clearing the filter." : "Try widening the dates or clearing your search."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedRows.map((r, i) => (
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

        {!loading && rows.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-gray-400">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, rows.length)} of {rows.length}{" "}
              {rows.length === 1 ? "record" : "records"}
            </span>
            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}