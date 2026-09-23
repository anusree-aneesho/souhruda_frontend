// src/components/Reports/YearlyReport.jsx
import { useState, useEffect, useCallback } from "react";
import { Users, ClipboardList, FlaskConical, IndianRupee } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import MiniBarChart from "./shared/MiniBarChart";
import { formatCurrency } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getYearlyReportApi } from "../../api/api";

export default function YearlyReport({ onBack }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getYearlyReportApi(year);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  const months = data?.months || [];
  const headers = ["Month", "Patients", "Orders", "Revenue"];
  const csvRows = months.map((m) => [m.month, m.patients, m.orders, m.revenue]);

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[
          {
            label: "Year",
            value: year,
            onChange: (v) => setYear(Number(v)),
            type: "number",
            min: 2000,
            max: 2100,
          },
        ]}
        onExportCsv={() => exportToCsv("yearly-report", headers, csvRows)}
        onExportPdf={() => exportToPdf("Yearly Report", headers, csvRows)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value={loading ? "—" : data?.summary?.total_patients ?? 0} icon={Users} color="teal" />
        <StatCard label="Total Orders" value={loading ? "—" : data?.summary?.total_orders ?? 0} icon={ClipboardList} color="blue" />
        <StatCard label="Total Tests" value={loading ? "—" : data?.summary?.total_tests ?? 0} icon={FlaskConical} color="purple" />
        <StatCard label="Total Revenue" value={formatCurrency(data?.summary?.total_revenue)} icon={IndianRupee} color="green" />
      </div>

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Revenue by month</h3>
        {!loading && months.length > 0 && (
          <MiniBarChart
            data={months}
            labelKey="month"
            valueKey="revenue"
            formatValue={(v) => `₹${Math.round(v / 1000)}k`}
          />
        )}
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">Patients</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : (
                months.map((m) => (
                  <tr key={m.month} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-900">{m.month}</td>
                    <td className="px-4 py-3 text-gray-500">{m.patients}</td>
                    <td className="px-4 py-3 text-gray-500">{m.orders}</td>
                    <td className="px-4 py-3 text-gray-900">{formatCurrency(m.revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}