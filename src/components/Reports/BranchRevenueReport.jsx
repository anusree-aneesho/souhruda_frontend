// src/components/Reports/BranchRevenueReport.jsx
//
// Revenue per branch, in range — one row per branch, so branches can be
// compared side by side.
import { useState, useEffect } from "react";
import { ALL_BRANCHES, filterByBranch, useBranchOptions } from "./shared/branchFilter";
import { IndianRupee, ClipboardList } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import ReportPeriod, { formatPeriod } from "./ReportPeriod";
import DailyBreakdownTable, { formatRowDate } from "./DailyBreakdownTable";
import { formatCurrency, todayIso, daysAgoIso } from "./shared/format";
import { exportSectionsToCsv, exportSectionsToPdf } from "../../utils/multiSectionExport";
import { getBranchRevenueReportApi } from "../../api/api";
import { BranchBarChart, DailyTrendChart } from "./shared/BranchCharts";

export default function BranchRevenueReport({ onBack }) {
  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIso());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [branchId, setBranchId] = useState(ALL_BRANCHES);

  useEffect(() => {
    // Don't query with an empty or inverted range (e.g. after clearing a date
    // field) — the API would fall back to its default range and the numbers
    // would no longer match the selected period.
    if (!dateFrom || !dateTo || dateFrom > dateTo) return undefined;

    let cancelled = false; // ignore responses from older, superseded requests

    async function load() {
      setLoading(true);
      setError("");
      setData(null); // never show the previous period's numbers under the new dates
      try {
        const res = await getBranchRevenueReportApi({ dateFrom, dateTo });
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo]);

  const allRows = data?.rows || [];
  const branchOptions = useBranchOptions(allRows);
  const rows = filterByBranch(allRows, branchId);
  const sumOf = (k) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const summary =
    branchId === ALL_BRANCHES
      ? data?.summary || {}
      : { total_orders: sumOf("orders"), total_revenue: sumOf("total_revenue") };
  const headers = ["Branch", "Code", "Orders", "Tests Revenue", "Home Visit Revenue", "Total Revenue"];
  const csvRows = rows.map((r) => [r.branch_name, r.branch_code, r.orders, r.tests_revenue, r.home_visit_revenue, r.total_revenue]);

  // Same columns feed the on-screen day-wise table and the exports.
  const dailyColumns = [
    { key: "orders", label: "Orders" },
    { key: "tests_revenue", label: "Tests Revenue", currency: true },
    { key: "home_visit_revenue", label: "Home Visit Revenue", currency: true },
    { key: "total_revenue", label: "Total Revenue", currency: true },
  ];
  const dailyRows = filterByBranch(data?.daily || [], branchId);
  const selectedBranch = branchOptions.find((o) => o.value === branchId);
  const branchSuffix = branchId !== ALL_BRANCHES && selectedBranch ? ` – ${selectedBranch.label}` : "";

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

  const branchMetrics = [
    { key: "total_revenue", label: "Total Revenue", currency: true },
    { key: "tests_revenue", label: "Tests Revenue", currency: true },
    { key: "home_visit_revenue", label: "Home Visit Revenue", currency: true },
    { key: "orders", label: "Orders" },
    ];

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[
          { label: "Date From", value: dateFrom, onChange: setDateFrom, max: dateTo },
          { label: "Date To", value: dateTo, onChange: setDateTo, min: dateFrom },
        ]}
        search={branchId}
        onSearchChange={setBranchId}
        searchOptions={branchOptions}
        searchLabel="Branch"
        onExportCsv={() => exportSectionsToCsv(`branch-revenue-report_${dateFrom}_to_${dateTo}`, exportSections())}
        onExportPdf={() => exportSectionsToPdf(`Branch Revenue Report (${formatPeriod(dateFrom, dateTo)})${branchSuffix}`, exportSections())}
      />

      <ReportPeriod dateFrom={dateFrom} dateTo={dateTo} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(summary.total_revenue)} icon={IndianRupee} color="green" />
        <StatCard label="Total Orders" value={summary.total_orders ?? 0} icon={ClipboardList} color="blue" />
      </div>

      <BranchBarChart rows={rows} metrics={branchMetrics} loading={loading} />
      <DailyTrendChart rows={dailyRows} metrics={dailyColumns} loading={loading} formatLabel={formatRowDate} />

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Tests Revenue</th>
                <th className="px-4 py-3 font-medium">Home Visit Revenue</th>
                <th className="px-4 py-3 font-medium">Total Revenue</th>
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
                rows.map((r) => (
                  <tr key={r.branch_id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.branch_name}</div>
                      <div className="text-xs text-gray-400">{r.branch_code}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.orders}</td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(r.tests_revenue)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(r.home_visit_revenue)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(r.total_revenue)}</td>
                  </tr>
                ))
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