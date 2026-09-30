// src/components/Reports/TestVolumeReport.jsx
import { useState, useEffect, useCallback } from "react";
import { ListOrdered, FlaskConical, Trophy, ClipboardList } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import { todayIso, daysAgoIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getTestVolumeReportApi } from "../../api/api";
import Pagination from "./shared/Pagination";

const PAGE_SIZE = 10;

export default function TestVolumeReport({ onBack }) {
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
      const res = await getTestVolumeReportApi({ dateFrom, dateTo, q: search || undefined });
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
  const topVolume = rows[0]?.volume || 1;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const headers = ["Rank", "Test", "Category", "Volume"];
  const csvRows = rows.map((r, i) => [i + 1, r.test_name, r.category || "", r.volume]);

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
        onExportCsv={() => exportToCsv("test-volume", headers, csvRows)}
        onExportPdf={() => exportToPdf("Test Volume", headers, csvRows)}
      />

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Tests Ordered"
          value={data?.summary?.total_tests_ordered ?? "—"}
          sublabel="In selected range"
          icon={ListOrdered}
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
          label="Top Test"
          value={data?.summary?.top_test ?? "—"}
          sublabel={data?.summary?.top_test_volume != null ? `${data.summary.top_test_volume} orders` : undefined}
          icon={Trophy}
          color="blue"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="px-4 py-3 w-12">No.</th>
                <th className="px-4 py-3">Test</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Volume</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-teal-600 animate-spin" />
                      <span className="text-sm">Loading test volume…</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList size={28} className="text-gray-300" />
                      <span className="text-sm font-medium text-gray-500">No tests in this range</span>
                      <span className="text-xs text-gray-400">Try widening the dates or clearing your search.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedRows.map((r, i) => {
                  const rank = (safePage - 1) * PAGE_SIZE + i + 1;
                  const barWidth = Math.max(4, Math.round((r.volume / topVolume) * 100));
                  return (
                    <tr
                      key={r.lab_test_id || i}
                      className="border-b border-gray-50 last:border-0 odd:bg-white even:bg-gray-50/40 hover:bg-amber-50/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-400 tabular-nums">{rank}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 mb-1">{r.test_name}</div>
                        <div className="h-1 rounded-full bg-gray-100 overflow-hidden max-w-[200px]">
                          <div
                            className="h-full rounded-full bg-teal-400/80"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{r.category || "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">{r.volume}</td>
                    </tr>
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
              {rows.length === 1 ? "test" : "tests"}
            </span>
            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}