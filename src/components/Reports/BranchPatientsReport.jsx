// src/components/Reports/BranchPatientsReport.jsx
//
// Patients registered per branch, in range — one row per branch, so
// branches can be compared side by side.
import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import ReportPeriod, { formatPeriod } from "./ReportPeriod";
import DailyBreakdownTable, { formatRowDate } from "./DailyBreakdownTable";
import { todayIso, daysAgoIso } from "./shared/format";
import { exportSectionsToCsv, exportSectionsToPdf } from "../../utils/multiSectionExport";
import { getBranchPatientsReportApi } from "../../api/api";
import { BranchBarChart, DailyTrendChart } from "./shared/BranchCharts";

export default function BranchPatientsReport({ onBack }) {
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
        const res = await getBranchPatientsReportApi({ dateFrom, dateTo });
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
  const headers = ["Branch", "Code", "Patients", "Male", "Female"];
  const csvRows = rows.map((r) => [r.branch_name, r.branch_code, r.patients, r.male, r.female]);

  // Same columns feed the on-screen day-wise table and the exports.
  const dailyColumns = [
    { key: "patients", label: "Patients" },
    { key: "male", label: "Male" },
    { key: "female", label: "Female" },
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

  const branchMetrics = [
    { key: "patients", label: "Patients" },
    { key: "male", label: "Male" },
    { key: "female", label: "Female" },
    ];

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[
          { label: "Date From", value: dateFrom, onChange: setDateFrom, max: dateTo },
          { label: "Date To", value: dateTo, onChange: setDateTo, min: dateFrom },
        ]}
        onExportCsv={() => exportSectionsToCsv(`branch-patients-report_${dateFrom}_to_${dateTo}`, exportSections())}
        onExportPdf={() => exportSectionsToPdf(`Branch Patients Report (${formatPeriod(dateFrom, dateTo)})`, exportSections())}
      />

      <ReportPeriod dateFrom={dateFrom} dateTo={dateTo} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Patients" value={data?.summary?.total_patients ?? 0} icon={Users} color="purple" />
      </div>


<BranchBarChart rows={rows} metrics={branchMetrics} loading={loading} />
<DailyTrendChart rows={dailyRows} metrics={dailyColumns} loading={loading} formatLabel={formatRowDate} />

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 font-medium">Patients</th>
                <th className="px-4 py-3 font-medium">Male</th>
                <th className="px-4 py-3 font-medium">Female</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No branches found.</td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.branch_id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.branch_name}</div>
                      <div className="text-xs text-gray-400">{r.branch_code}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.patients}</td>
                    <td className="px-4 py-3 text-gray-700">{r.male}</td>
                    <td className="px-4 py-3 text-gray-700">{r.female}</td>
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