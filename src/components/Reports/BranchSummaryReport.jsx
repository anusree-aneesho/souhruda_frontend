// src/components/Reports/BranchSummaryReport.jsx
import { useState, useEffect } from "react";
import { Building2, Users, ClipboardList, IndianRupee } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import ReportPeriod, { formatPeriod } from "./ReportPeriod";
import DailyBreakdownTable, { formatRowDate } from "./DailyBreakdownTable";
import { formatCurrency, todayIso, daysAgoIso } from "./shared/format";
import { exportSectionsToCsv, exportSectionsToPdf } from "../../utils/multiSectionExport";
import { getBranchSummaryReportApi } from "../../api/api";
import { BranchBarChart, DailyTrendChart } from "./shared/BranchCharts";

export default function BranchSummaryReport({ onBack }) {
  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIso());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const res = await getBranchSummaryReportApi({ dateFrom, dateTo });
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

  const rows = data?.rows || [];
  const headers = [
    "Branch",
    "Code",
    "Orders",
    "Patients",
    "Home Collections",
    "Tests Revenue",
    "Home Visit Revenue",
    "Total Revenue",
  ];
  const csvRows = rows.map((r) => [
    r.branch_name,
    r.branch_code,
    r.orders,
    r.patients,
    r.home_collections,
    r.tests_revenue,
    r.home_visit_revenue,
    r.total_revenue,
  ]);

  // Same columns feed the on-screen day-wise table and the exports.
  const dailyColumns = [
    { key: "orders", label: "Orders" },
    { key: "patients", label: "Patients" },
    { key: "home_collections", label: "Home Collections" },
    { key: "total_revenue", label: "Total Revenue", currency: true },
  ];
  const dailyRows = data?.daily || [];

  const exportSections = () => [
    { title: "Branch Summary", headers, rows: csvRows },
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
    { key: "orders", label: "Orders" },
    { key: "patients", label: "Patients" },
    { key: "home_collections", label: "Home Collections" },
    { key: "tests_revenue", label: "Tests Revenue", currency: true },
    { key: "home_visit_revenue", label: "Home Visit Revenue", currency: true },
  ];

  

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[
          { label: "Date From", value: dateFrom, onChange: setDateFrom, max: dateTo },
          { label: "Date To", value: dateTo, onChange: setDateTo, min: dateFrom },
        ]}
        onExportCsv={() => exportSectionsToCsv(`branch-summary-report_${dateFrom}_to_${dateTo}`, exportSections())}
        onExportPdf={() => exportSectionsToPdf(`Branch Summary Report (${formatPeriod(dateFrom, dateTo)})`, exportSections())}
      />

      <ReportPeriod dateFrom={dateFrom} dateTo={dateTo} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {rows.length <= 1 && !loading && !error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Only one branch has data for this period. Orders, patients and home collection requests
          made before branch tracking was added are all attributed to one branch and can't be
          split retroactively — only new records are tracked per branch going forward.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Branches" value={data?.summary?.branches ?? 0} icon={Building2} color="teal" />
        <StatCard label="Total Orders" value={data?.summary?.total_orders ?? 0} icon={ClipboardList} color="blue" />
        <StatCard label="Total Patients" value={data?.summary?.total_patients ?? 0} icon={Users} color="purple" />
        <StatCard label="Total Revenue" value={formatCurrency(data?.summary?.total_revenue)} icon={IndianRupee} color="green" />
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
                <th className="px-4 py-3 font-medium">Patients</th>
                <th className="px-4 py-3 font-medium">Home Collections</th>
                <th className="px-4 py-3 font-medium">Tests Revenue</th>
                <th className="px-4 py-3 font-medium">Home Visit Revenue</th>
                <th className="px-4 py-3 font-medium">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No branches found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.branch_id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.branch_name}</div>
                      <div className="text-xs text-gray-400">{r.branch_code}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.orders}</td>
                    <td className="px-4 py-3 text-gray-700">{r.patients}</td>
                    <td className="px-4 py-3 text-gray-700">{r.home_collections}</td>
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
        rows={data?.daily || []}
        loading={loading}
        columns={dailyColumns}
      />
    </div>
  );
}