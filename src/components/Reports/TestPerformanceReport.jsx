// src/components/Reports/TestPerformanceReport.jsx
import { useState, useEffect, useCallback } from "react";
import { TrendingUp, CheckCircle2, Timer, FlaskConical, ClipboardList } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import { todayIso, daysAgoIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getTestPerformanceReportApi } from "../../api/api";
import Pagination from "./shared/Pagination";

const PAGE_SIZE = 10;

export default function TestPerformanceReport({ onBack }) {
  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIso());
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getTestPerformanceReportApi({ dateFrom, dateTo, q: search || undefined });
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

  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, search, data]);

  const rows = data?.rows || [];
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const headers = ["Test", "Category", "Volume", "Completed", "Abnormal", "Avg Turnaround (hrs)"];
  const csvRows = rows.map((r) => [
    r.test_name,
    r.category || "",
    r.volume,
    r.completed,
    r.abnormal_count,
    r.avg_turnaround_hours ?? "",
  ]);

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
        searchPlaceholder="Search test name..."
        onExportCsv={() => exportToCsv("test-performance", headers, csvRows)}
        onExportPdf={() => exportToPdf("Test Performance", headers, csvRows)}
      />

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tests Ordered"
          value={data?.summary?.total_tests_ordered ?? "—"}
          sublabel="In selected range"
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          label="Distinct Tests"
          value={data?.summary?.distinct_tests ?? "—"}
          sublabel="Different tests ordered"
          icon={FlaskConical}
          color="teal"
        />
        <StatCard
          label="Avg. Turnaround"
          value={data?.summary?.avg_turnaround_hours != null ? `${data.summary.avg_turnaround_hours} hrs` : "—"}
          sublabel="Order to result entered"
          icon={Timer}
          color="blue"
        />
        <StatCard
          label="Completed"
          value={rows.reduce((sum, r) => sum + (r.completed || 0), 0)}
          sublabel="Results entered"
          icon={CheckCircle2}
          color="purple"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="px-4 py-3">Test</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Volume</th>
                <th className="px-4 py-3 text-right">Completed</th>
                <th className="px-4 py-3 text-right">Abnormal</th>
                <th className="px-4 py-3 text-right">Avg Turnaround</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-teal-600 animate-spin" />
                      <span className="text-sm">Loading test performance…</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList size={28} className="text-gray-300" />
                      <span className="text-sm font-medium text-gray-500">No tests in this range</span>
                      <span className="text-xs text-gray-400">Try widening the dates or clearing your search.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedRows.map((r, i) => (
                  <tr
                    key={r.lab_test_id || i}
                    className="border-b border-gray-50 last:border-0 odd:bg-white even:bg-gray-50/40 hover:bg-amber-50/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{r.test_name}</td>
                    <td className="px-4 py-3 text-gray-500">{r.category || "—"}</td>
                    <td className="px-4 py-3 text-right text-gray-900 tabular-nums">{r.volume}</td>
                    <td className="px-4 py-3 text-right text-gray-500 tabular-nums">{r.completed}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {r.abnormal_count > 0 ? (
                        <span className="text-amber-600 font-medium">{r.abnormal_count}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 tabular-nums">
                      {r.avg_turnaround_hours != null ? `${r.avg_turnaround_hours} hrs` : "—"}
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
              {rows.length === 1 ? "test" : "tests"}
            </span>
            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}