// src/components/Reports/WeeklyReport.jsx
import { useState, useEffect, useCallback } from "react";
import { Users, ClipboardList, IndianRupee } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import MiniBarChart from "./shared/MiniBarChart";
import { formatCurrency, todayIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getWeeklyReportApi } from "../../api/api";

export default function WeeklyReport({ onBack }) {
  const [weekOf, setWeekOf] = useState(todayIso());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getWeeklyReportApi(weekOf);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [weekOf]);

  useEffect(() => {
    load();
  }, [load]);

  const days = data?.days || [];
  const headers = ["Day", "Date", "Patients", "Orders", "Revenue"];
  const csvRows = days.map((d) => [d.day, d.date, d.patients, d.orders, d.revenue]);

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[{ label: "Any day in the week", value: weekOf, onChange: setWeekOf }]}
        onExportCsv={() => exportToCsv("weekly-report", headers, csvRows)}
        onExportPdf={() => exportToPdf("Weekly Report", headers, csvRows)}
      />

      {data?.range && (
        <p className="text-xs text-gray-400">
          Week of {data.range.from} – {data.range.to}
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Patients" value={loading ? "—" : data?.summary?.patients ?? 0} icon={Users} color="teal" />
        <StatCard label="Orders" value={loading ? "—" : data?.summary?.orders ?? 0} icon={ClipboardList} color="blue" />
        <StatCard label="Revenue" value={formatCurrency(data?.summary?.revenue)} icon={IndianRupee} color="green" />
      </div>

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Revenue by day</h3>
        {!loading && days.length > 0 && (
          <MiniBarChart data={days} labelKey="day" valueKey="revenue" formatValue={formatCurrency} />
        )}
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Day</th>
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
                days.map((d) => (
                  <tr key={d.date} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-900">
                      {d.day} <span className="text-gray-400">· {d.date}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{d.patients}</td>
                    <td className="px-4 py-3 text-gray-500">{d.orders}</td>
                    <td className="px-4 py-3 text-gray-900">{formatCurrency(d.revenue)}</td>
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