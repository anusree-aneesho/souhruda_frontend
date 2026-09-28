// src/components/Reports/PendingTestsReport.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { Hourglass, AlertTriangle, CheckCircle2, X } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getPendingTestsReportApi } from "../../api/api";
import Pagination from "./shared/Pagination";

const PAGE_SIZE = 7;

export default function PendingTestsReport({ onBack }) {
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getPendingTestsReportApi({ q: search || undefined });
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
    setOverdueOnly(false);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [overdueOnly, data]);

  const allRows = data?.rows || [];

  const rows = useMemo(() => {
    return overdueOnly ? allRows.filter((r) => r.is_overdue) : allRows;
  }, [allRows, overdueOnly]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const headers = ["Order No", "Patient", "Phone", "Tests", "Ordered On"];
  const csvRows = rows.map((r) => [
    r.order_no,
    r.patient_name,
    r.phone,
    (r.tests || []).join("; "),
    r.ordered_at,
  ]);
  const exportSuffix = overdueOnly ? "-overdue" : "";

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order no. or patient..."
        onExportCsv={() => exportToCsv(`pending-tests${exportSuffix}`, headers, csvRows)}
        onExportPdf={() => exportToPdf("Pending Tests", headers, csvRows)}
      />

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <p className="text-xs text-gray-400 -mt-2">
        A live snapshot of lab orders awaiting results — not limited to a date range.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Total Pending"
          value={data?.summary?.total_pending ?? "—"}
          icon={Hourglass}
          color="amber"
          onClick={() => setOverdueOnly(false)}
          active={!overdueOnly}
        />
        <StatCard
          label="Overdue"
          value={data?.summary?.overdue ?? "—"}
          sublabel="Pending over 24 hours"
          icon={AlertTriangle}
          color="gray"
          onClick={() => setOverdueOnly((v) => !v)}
          active={overdueOnly}
        />
      </div>

      {/* {overdueOnly && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            Showing <span className="font-medium text-gray-900">Overdue</span> only
            ({rows.length} of {allRows.length})
          </span>
          <button
            onClick={() => setOverdueOnly(false)}
            className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <X size={12} /> Clear
          </button>
        </div>
      )} */}

      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="px-4 py-3">Order No</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Tests</th>
                <th className="px-4 py-3">Ordered On</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-teal-600 animate-spin" />
                      <span className="text-sm">Loading pending tests…</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 size={28} className="text-gray-300" />
                      <span className="text-sm font-medium text-gray-500">
                        {overdueOnly ? "No records match this filter" : "Nothing pending right now"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {overdueOnly
                          ? "Try clearing the filter."
                          : "Every lab order has results entered."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedRows.map((r, i) => (
                  <tr
                    key={r.order_no || i}
                    className={`border-b border-gray-50 last:border-0 odd:bg-white even:bg-gray-50/40 hover:bg-amber-50/40 transition-colors ${
                      r.is_overdue ? "bg-rose-50/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.order_no}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.patient_name || "—"}</div>
                      <div className="text-xs text-gray-400">{r.phone || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {(r.tests || []).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      <span className={r.is_overdue ? "text-rose-600 font-medium" : ""}>{r.ordered_at}</span>
                      {r.is_overdue && (
                        <span className="ml-1.5 inline-flex items-center rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                          Overdue
                        </span>
                      )}
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
              {rows.length === 1 ? "order" : "orders"}
            </span>
            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}