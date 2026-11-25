// src/components/Reports/TechnicianCollectionReport.jsx
import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { UserCheck2, Users, CheckCircle2, UserRound, ChevronDown } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import { todayIso, daysAgoIso, PAGE_SIZE } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getHomeCollectionTechniciansReportApi } from "../../api/api";
import { HcStatusBadge, formatHcDate } from "./shared/hcStatus";
import Pagination from "./shared/Pagination";

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
  const [page, setPage] = useState(1);
  // Which technician row is expanded, and which tab (assigned | completed | pending) it shows.
  const [expanded, setExpanded] = useState(null); // { id, tab }
  // Page inside the expanded technician's request list.
  const [innerPage, setInnerPage] = useState(1);

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

  // Back to page 1 whenever the underlying rows change.
  useEffect(() => {
    setPage(1);
  }, [data]);

  // Close any open technician panel when the list underneath it changes.
  useEffect(() => {
    setExpanded(null);
  }, [data, page]);

  // Inner list goes back to page 1 when a different technician or tab is opened.
  useEffect(() => {
    setInnerPage(1);
  }, [expanded?.id, expanded?.tab]);

  const rows = useMemo(() => data?.rows || [], [data]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Click the same row/tab again to collapse it.
  function openTech(id, tab = "assigned") {
    setExpanded((cur) => (cur && cur.id === id && cur.tab === tab ? null : { id, tab }));
  }

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

      {/* Summary cards: display only, not clickable */}
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
                pagedRows.map((r, i) => {
                  const id = r.technician_id ?? i;
                  const isOpen = expanded?.id === id;
                  const tab = expanded?.tab || "assigned";
                  const list = (r.requests || []).filter((q) => tab === "assigned" || q.group === tab);

                  // Pagination for the expanded list
                  const innerTotalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
                  const innerSafePage = Math.min(innerPage, innerTotalPages);
                  const innerPaged = list.slice((innerSafePage - 1) * PAGE_SIZE, innerSafePage * PAGE_SIZE);

                  return (
                    <Fragment key={id}>
                      <tr
                        onClick={() => openTech(id, "assigned")}
                        className={`border-b border-gray-50 cursor-pointer hover:bg-amber-50/40 transition-colors ${
                          isOpen ? "bg-amber-50/40" : "odd:bg-white even:bg-gray-50/40"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                              <UserCheck2 size={14} />
                            </span>
                            <span className="font-medium text-gray-900">{r.technician_name}</span>
                            <ChevronDown
                              size={14}
                              className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{r.zone || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTech(id, "assigned");
                            }}
                            className="inline-flex min-w-[1.75rem] justify-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
                          >
                            {r.assigned}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTech(id, "completed");
                            }}
                            className="text-teal-700 font-medium hover:underline"
                          >
                            {r.completed}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTech(id, "pending");
                            }}
                            className="text-blue-700 font-medium hover:underline"
                          >
                            {r.pending}
                          </button>
                        </td>
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

                      {isOpen && (
                        <tr className="border-b border-gray-100 bg-gray-50/60">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="flex gap-2 mb-3">
                              {[
                                ["assigned", `Assigned (${r.assigned})`],
                                ["completed", `Completed (${r.completed})`],
                                ["pending", `Pending (${r.pending})`],
                              ].map(([key, label]) => (
                                <button
                                  key={key}
                                  onClick={() => setExpanded({ id, tab: key })}
                                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                    tab === key
                                      ? "border-teal-600 bg-teal-50 text-teal-700"
                                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>

                            {list.length === 0 ? (
                              <p className="text-xs text-gray-400">No requests in this group.</p>
                            ) : (
                              <div className="rounded-lg border border-gray-100 bg-white overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-left text-gray-500 border-b border-gray-100">
                                      <th className="px-3 py-2">HC Code</th>
                                      <th className="px-3 py-2">Patient</th>
                                      <th className="px-3 py-2">Slot</th>
                                      <th className="px-3 py-2">Status</th>
                                      <th className="px-3 py-2 text-right">Distance</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {innerPaged.map((q) => (
                                      <tr key={q.hc_code} className="border-b border-gray-50 last:border-0">
                                        <td className="px-3 py-2 font-mono text-gray-500">{q.hc_code}</td>
                                        <td className="px-3 py-2 font-medium text-gray-900">{q.patient_name || "—"}</td>
                                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                                          {formatHcDate(q.slot_date)}
                                          {q.slot_label && <span className="text-gray-400"> · {q.slot_label}</span>}
                                        </td>
                                        <td className="px-3 py-2">
                                          <HcStatusBadge status={q.status} />
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-500 tabular-nums">
                                          {q.distance_km != null ? `${q.distance_km} km` : "—"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>

                                <div className="border-t border-gray-100 bg-gray-50/60 px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
                                  <span className="text-xs text-gray-400">
                                    Showing {(innerSafePage - 1) * PAGE_SIZE + 1}–
                                    {Math.min(innerSafePage * PAGE_SIZE, list.length)} of {list.length}{" "}
                                    {list.length === 1 ? "request" : "requests"}
                                  </span>
                                  {innerTotalPages > 1 && (
                                    <Pagination
                                      page={innerSafePage}
                                      totalPages={innerTotalPages}
                                      onPageChange={setInnerPage}
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-gray-400">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, rows.length)} of {rows.length}{" "}
              {rows.length === 1 ? "technician" : "technicians"}
            </span>
            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}