// src/components/Reports/MonthlyReport.jsx
import { useState, useEffect, useCallback } from "react";
import { Users, ClipboardList, FlaskConical, IndianRupee } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import MiniBarChart from "./shared/MiniBarChart";
import { formatCurrency } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getMonthlyReportApi } from "../../api/api";

const now = new Date();

export default function MonthlyReport({ onBack }) {
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [year, m] = month.split("-").map(Number);
      const res = await getMonthlyReportApi(m, year);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const weeks = data?.weeks || [];
  const headers = ["Week", "From", "To", "Patients", "Orders", "Revenue"];
  const csvRows = weeks.map((w) => [w.label, w.from, w.to, w.patients, w.orders, w.revenue]);

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[{ label: "Month", value: month, onChange: setMonth, type: "month" }]}
        onExportCsv={() => exportToCsv("monthly-report", headers, csvRows)}
        onExportPdf={() => exportToPdf("Monthly Report", headers, csvRows)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value={loading ? "—" : data?.summary?.total_patients ?? 0} icon={Users} color="teal" />
        <StatCard label="Total Orders" value={loading ? "—" : data?.summary?.total_orders ?? 0} icon={ClipboardList} color="blue" />
        <StatCard label="Total Tests" value={loading ? "—" : data?.summary?.total_tests ?? 0} icon={FlaskConical} color="purple" />
        <StatCard label="Total Revenue" value={formatCurrency(data?.summary?.total_revenue)} icon={IndianRupee} color="green" />
      </div>

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Revenue by week</h3>
        {!loading && weeks.length > 0 && (
          <MiniBarChart data={weeks} labelKey="label" valueKey="revenue" formatValue={formatCurrency} />
        )}
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Week</th>
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
                weeks.map((w) => (
                  <tr key={w.label} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-900">
                      {w.label} <span className="text-gray-400">· {w.from} – {w.to}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{w.patients}</td>
                    <td className="px-4 py-3 text-gray-500">{w.orders}</td>
                    <td className="px-4 py-3 text-gray-900">{formatCurrency(w.revenue)}</td>
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