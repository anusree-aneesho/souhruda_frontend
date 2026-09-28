// src/components/Reports/BranchTestsReport.jsx
//
// Test volume per branch, in range — compares branches side by side.
import { useState, useEffect, useCallback } from "react";
import { FlaskConical, ListOrdered, IndianRupee, Calculator } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import ReportPeriod, { formatPeriod } from "./ReportPeriod";
import DailyBreakdownTable, { formatRowDate } from "./DailyBreakdownTable";
import { BranchBarChart, DailyBarChart } from "./shared/BranchCharts";
import { formatCurrency, todayIso, daysAgoIso } from "./shared/format";
import { exportSectionsToCsv, exportSectionsToPdf } from "../../utils/multiSectionExport";
import { getBranchTestsReportApi } from "../../api/api";

export default function BranchTestsReport({ onBack }) {
  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIso());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getBranchTestsReportApi({ dateFrom, dateTo });
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
  const summary = data?.summary || {};

  const headers = ["Branch", "Code", "Tests Ordered", "Unique Tests", "Revenue", "Revenue Share %"];
  const csvRows = rows.map((r) => [
    r.branch_name,
    r.branch_code,
    r.volume,
    r.unique_tests,
    r.revenue,
    r.revenue_share,
  ]);

  // Metrics the branch bar chart can switch between.
  const branchMetrics = [
    { key: "volume", label: "Tests Ordered" },
    { key: "revenue", label: "Revenue", currency: true },
    { key: "unique_tests", label: "Unique Tests" },
  ];

  // Same columns feed the on-screen day-wise table, the day-wise chart and the exports.
  const dailyColumns = [
    { key: "volume", label: "Tests Ordered" },
    { key: "revenue", label: "Revenue", currency: true },
  ];
  const dailyRows = data?.daily || [];

  const exportSections = () => [
    { title: "Branch Comparison", headers, rows: csvRows },
    {
      title: "Day-wise Breakdown",
      headers: ["Date", "Branch", ...dailyColumns.map((c) => c.label)],
      rows: dailyRows.map((r) => [
        formatRowDate(r.date),
        r.branch_name,
        ...dailyColumns.map((c) => r[c.key] ?? 0),
      ]),
    },
  ];

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[
          { label: "Date From", value: dateFrom, onChange: setDateFrom, max: dateTo },
          { label: "Date To", value: dateTo, onChange: setDateTo, min: dateFrom },
        ]}
        onExportCsv={() => exportSectionsToCsv(`branch-tests-report_${dateFrom}_to_${dateTo}`, exportSections())}
        onExportPdf={() => exportSectionsToPdf(`Branch Tests Report (${formatPeriod(dateFrom, dateTo)})`, exportSections())}
      />

      <ReportPeriod dateFrom={dateFrom} dateTo={dateTo} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Tests" value={summary.total_tests ?? 0} icon={ListOrdered} color="blue" />
        <StatCard label="Revenue" value={formatCurrency(summary.total_revenue)} icon={IndianRupee} color="green" />
        <StatCard label="Unique Tests" value={summary.unique_tests ?? 0} icon={FlaskConical} color="teal" />
        <StatCard label="Avg. Revenue / Test" value={formatCurrency(summary.avg_revenue_per_test)} icon={Calculator} color="purple" />
      </div>

      {/* ── Charts ──────────────────────────────────────────── */}
      <BranchBarChart
        title="Tests by Branch"
        rows={rows}
        metrics={branchMetrics}
        loading={loading}
      />
      <DailyBarChart
        rows={dailyRows}
        metrics={dailyColumns}
        loading={loading}
        formatLabel={formatRowDate}
      />

      {/* ── Branch comparison table ─────────────────────────── */}
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Branch Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 font-medium">Tests Ordered</th>
                <th className="px-4 py-3 font-medium">Unique Tests</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
                <th className="px-4 py-3 font-medium">Revenue Share</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No branches found.</td>
                </tr>
              ) : (
                <>
                  {rows.map((r) => (
                    <tr key={r.branch_id} className="border-b border-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.branch_name}</div>
                        <div className="text-xs text-gray-400">{r.branch_code}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.volume}</td>
                      <td className="px-4 py-3 text-gray-700">{r.unique_tests}</td>
                      <td className="px-4 py-3 text-gray-700">{formatCurrency(r.revenue)}</td>
                      <td className="px-4 py-3 text-gray-700">{r.revenue_share}%</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold text-gray-900">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3">{summary.total_tests ?? 0}</td>
                    <td className="px-4 py-3">{summary.unique_tests ?? 0}</td>
                    <td className="px-4 py-3">{formatCurrency(summary.total_revenue)}</td>
                    <td className="px-4 py-3">{summary.total_revenue > 0 ? "100%" : "—"}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DailyBreakdownTable
        rows={dailyRows}
        loading={loading}
        columns={dailyColumns}
      />
    </div>
  );
}