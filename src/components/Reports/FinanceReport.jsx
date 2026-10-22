// src/components/Reports/FinanceReport.jsx
import { useState, useEffect, useCallback } from "react";
import { IndianRupee, CheckCircle2, Clock, FlaskConical, Home } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import { formatCurrency, todayIso, daysAgoIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getFinanceReportApi } from "../../api/api";

const TYPE_OPTIONS = [
  { value: "", label: "All orders" },
  { value: "lab", label: "Lab orders" },
  { value: "home_collection", label: "Home collection" },
];

function TypeBreakdownCard({ title, icon: Icon, totals, loading }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-teal-600" />
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-gray-500">Orders</dt>
        <dd className="text-right text-gray-900">{loading ? "—" : totals?.orders ?? 0}</dd>
        <dt className="text-gray-500">Revenue</dt>
        <dd className="text-right text-gray-900">{loading ? "—" : formatCurrency(totals?.revenue)}</dd>
        <dt className="text-gray-500">Paid</dt>
        <dd className="text-right text-green-700">{loading ? "—" : formatCurrency(totals?.paid)}</dd>
        <dt className="text-gray-500">Pending</dt>
        <dd className="text-right text-amber-700">{loading ? "—" : formatCurrency(totals?.pending)}</dd>
      </dl>
    </div>
  );
}

export default function FinanceReport({ onBack }) {
  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIso());
  const [type, setType] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getFinanceReportApi({ dateFrom, dateTo, type });
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, type]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = data?.rows || [];
  const byType = data?.summary?.by_type;

  const headers = ["Date", "Orders", "Lab Revenue", "Home Collection Revenue", "Revenue", "Paid", "Pending"];
  const csvRows = rows.map((r) => [
    r.date,
    r.orders,
    r.lab_revenue,
    r.home_collection_revenue,
    r.revenue,
    r.paid,
    r.pending,
  ]);

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[
          { label: "Date From", value: dateFrom, onChange: setDateFrom, max: dateTo },
          { label: "Date To", value: dateTo, onChange: setDateTo, min: dateFrom },
        ]}
        onExportCsv={() => exportToCsv("finance-report", headers, csvRows)}
        onExportPdf={() => exportToPdf("Finance Report", headers, csvRows)}
      />

      <div className="flex flex-wrap gap-2">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
              type === opt.value
                ? "bg-teal-600 text-white border-teal-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && !data.payments_tracked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No payments have been recorded yet, so every order currently shows as pending. Paid
          amounts will populate once payments start being recorded against orders.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(data?.summary?.total_revenue)} icon={IndianRupee} color="teal" />
        <StatCard label="Paid" value={formatCurrency(data?.summary?.paid)} icon={CheckCircle2} color="green" />
        <StatCard label="Pending" value={formatCurrency(data?.summary?.pending)} icon={Clock} color="amber" />
      </div>

      {(type === "" || type === "lab" || type === "home_collection") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {type !== "home_collection" && (
            <TypeBreakdownCard title="Lab Orders" icon={FlaskConical} totals={byType?.lab} loading={loading} />
          )}
          {type !== "lab" && (
            <TypeBreakdownCard title="Home Collection" icon={Home} totals={byType?.home_collection} loading={loading} />
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Lab</th>
                <th className="px-4 py-3 font-medium">Home Collection</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Pending</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No orders in this range.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.date} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-900">{r.date}</td>
                    <td className="px-4 py-3 text-gray-500">{r.orders}</td>
                    <td className="px-4 py-3 text-gray-500">{formatCurrency(r.lab_revenue)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatCurrency(r.home_collection_revenue)}</td>
                    <td className="px-4 py-3 text-gray-900">{formatCurrency(r.revenue)}</td>
                    <td className="px-4 py-3 text-green-700">{formatCurrency(r.paid)}</td>
                    <td className="px-4 py-3 text-amber-700">{formatCurrency(r.pending)}</td>
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