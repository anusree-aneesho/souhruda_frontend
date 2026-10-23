import { useState, useEffect, useCallback } from "react";
import { Percent, IndianRupee, ClipboardList, TrendingDown } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import Pagination from "./shared/Pagination";
import { formatCurrency, todayIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getDiscountsReportApi } from "../../api/api";

const PAGE_SIZE = 10;

function daysAgoIso(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function SummaryTable({ title, labelHeader, rows, labelKey, loading }) {
  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
            <th className="px-4 py-3 font-medium">{labelHeader}</th>
            <th className="px-4 py-3 font-medium text-right">Orders</th>
            <th className="px-4 py-3 font-medium text-right">Discount</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No discounts in this range.</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={r[labelKey]} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 text-gray-900">{r[labelKey]}</td>
                <td className="px-4 py-3 text-right text-gray-500">{r.orders}</td>
                <td className="px-4 py-3 text-right text-amber-700">{formatCurrency(r.discount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function DiscountsReport({ onBack }) {
  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIso());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setPage(1); // back to the first page whenever the range changes
    try {
      setData(await getDiscountsReportApi({ dateFrom, dateTo }));
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const s = data?.summary;
  const orders = data?.orders || [];
  const byStaff = data?.by_staff || [];
  const byType = data?.by_type || [];

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const pagedOrders = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Exports use ALL orders, not just the visible page.
  const headers = ["Order No", "Patient", "Type", "Date", "Time", "Staff", "Gross", "Discount", "Discount %"];
  const csvRows = orders.map((o) => [
    o.order_no,
    o.patient_name,
    o.type === "home_collection" ? "Home Collection" : "Lab",
    o.date,
    o.time,
    o.staff,
    o.gross,
    o.discount,
    o.percent,
  ]);

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[
          { label: "From", value: dateFrom, onChange: (v) => v && setDateFrom(v), max: dateTo },
          { label: "To", value: dateTo, onChange: (v) => v && setDateTo(v), max: todayIso() },
        ]}
        onExportCsv={() => exportToCsv(`discounts-${dateFrom}-to-${dateTo}`, headers, csvRows)}
        onExportPdf={() => exportToPdf(`Discounts — ${dateFrom} to ${dateTo}`, headers, csvRows)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Discount" value={loading ? "—" : formatCurrency(s?.total_discount)} icon={IndianRupee} color="amber" />
        <StatCard label="Orders Discounted" value={loading ? "—" : s?.orders ?? 0} icon={ClipboardList} color="blue" />
        <StatCard label="Gross Billed (discounted)" value={loading ? "—" : formatCurrency(s?.gross)} icon={TrendingDown} color="teal" />
        <StatCard label="Avg Discount" value={loading ? "—" : `${s?.avg_percent ?? 0}%`} icon={Percent} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SummaryTable title="By staff" labelHeader="Staff" rows={byStaff} labelKey="staff" loading={loading} />
        <SummaryTable title="By order type" labelHeader="Type" rows={byType} labelKey="type" loading={loading} />
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Discounted orders</h3>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                {["Order", "Patient", "Type", "Date", "Staff", "Gross", "Discount", "%"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No discounted orders in this range.</td></tr>
              ) : (
                pagedOrders.map((o) => (
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
                    <td className="px-4 py-3 text-gray-500">{o.date} {o.time}</td>
                    <td className="px-4 py-3 text-gray-500">{o.staff}</td>
                    <td className="px-4 py-3 text-gray-900">{formatCurrency(o.gross)}</td>
                    <td className="px-4 py-3 text-amber-700">{formatCurrency(o.discount)}</td>
                    <td className="px-4 py-3 text-gray-500">{o.percent}%</td>
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