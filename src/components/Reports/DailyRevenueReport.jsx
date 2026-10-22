// src/components/Reports/DailyRevenueReport.jsx
import { useState, useEffect, useCallback } from "react";
import { IndianRupee, CheckCircle2, Clock, ClipboardList, FlaskConical, Home } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import { formatCurrency, todayIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getDailyRevenueReportApi } from "../../api/api";

const TYPE_OPTIONS = [
  { value: "", label: "All orders" },
  { value: "lab", label: "Lab orders" },
  { value: "home_collection", label: "Home collection" },
];

const STATUS_LABEL = {
  pending: "Pending",
  sample_collected: "Sample Collected",
  completed: "Completed",
};

function formatLongDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TypeCard({ title, icon: Icon, totals, loading }) {
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

export default function DailyRevenueReport({ onBack }) {
  const [date, setDate] = useState(todayIso());
  const [type, setType] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDailyRevenueReportApi({ date, type });
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [date, type]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data?.summary;
  const byType = summary?.by_type;
  const orders = data?.orders || [];
  const isToday = date === todayIso();

  const headers = ["Order No", "Patient", "Type", "Time", "Status", "Revenue", "Paid", "Pending"];
  const csvRows = orders.map((o) => [
    o.order_no,
    o.patient_name,
    o.type === "home_collection" ? "Home Collection" : "Lab",
    o.time,
    STATUS_LABEL[o.status] || o.status,
    o.revenue,
    o.paid,
    o.pending,
  ]);

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[{ label: "Date", value: date, onChange: (v) => v && setDate(v), max: todayIso() }]}
        onExportCsv={() => exportToCsv(`daily-revenue-${date}`, headers, csvRows)}
        onExportPdf={() => exportToPdf(`Daily Revenue — ${date}`, headers, csvRows)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isToday ? "Today" : formatLongDate(date)}
          </h2>
          {isToday && <p className="text-sm text-gray-500">{formatLongDate(date)}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isToday && (
            <button
              type="button"
              onClick={() => setDate(todayIso())}
              className="px-4 py-1.5 rounded-full text-sm border border-teal-600 text-teal-700 hover:bg-teal-50"
            >
              Back to today
            </button>
          )}
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
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && !data.payments_tracked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No payments have been recorded yet, so every order currently shows as pending.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue" value={loading ? "—" : formatCurrency(summary?.total_revenue)} icon={IndianRupee} color="teal" />
        <StatCard label="Paid" value={loading ? "—" : formatCurrency(summary?.paid)} icon={CheckCircle2} color="green" />
        <StatCard label="Pending" value={loading ? "—" : formatCurrency(summary?.pending)} icon={Clock} color="amber" />
        <StatCard label="Orders" value={loading ? "—" : summary?.orders ?? 0} icon={ClipboardList} color="blue" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {type !== "home_collection" && (
          <TypeCard title="Lab Orders" icon={FlaskConical} totals={byType?.lab} loading={loading} />
        )}
        {type !== "lab" && (
          <TypeCard title="Home Collection" icon={Home} totals={byType?.home_collection} loading={loading} />
        )}
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Orders on this day</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Pending</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No orders on this date.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.order_no} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-900">{o.order_no}</td>
                    <td className="px-4 py-3 text-gray-900">{o.patient_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          o.type === "home_collection"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-teal-50 text-teal-700"
                        }`}
                      >
                        {o.type === "home_collection" ? o.hc_code || "Home Collection" : "Lab"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{o.time}</td>
                    <td className="px-4 py-3 text-gray-500">{STATUS_LABEL[o.status] || o.status}</td>
                    <td className="px-4 py-3 text-gray-900">{formatCurrency(o.revenue)}</td>
                    <td className="px-4 py-3 text-green-700">{formatCurrency(o.paid)}</td>
                    <td className="px-4 py-3 text-amber-700">{formatCurrency(o.pending)}</td>
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