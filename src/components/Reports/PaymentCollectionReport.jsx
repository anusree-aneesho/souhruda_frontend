import { useState, useEffect, useCallback } from "react";
import { Wallet, Banknote, Smartphone, CreditCard } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import Pagination from "./shared/Pagination";
import { formatCurrency, todayIso, daysAgoIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getPaymentCollectionReportApi } from "../../api/api";

const PAGE_SIZE = 10;

const TYPE_OPTIONS = [
  { value: "", label: "All orders" },
  { value: "lab", label: "Lab orders" },
  { value: "home_collection", label: "Home collection" },
];

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
            <th className="px-4 py-3 font-medium text-right">Collected</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={r[labelKey]} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 text-gray-900">{r[labelKey]}</td>
                <td className="px-4 py-3 text-right text-gray-500">{r.orders}</td>
                <td className="px-4 py-3 text-right text-green-700">{formatCurrency(r.amount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Makes a stat card clickable, with a ring when it is the active filter.
function ClickableCard({ active, onClick, children }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={`cursor-pointer rounded-xl transition-shadow ${
        active ? "ring-2 ring-teal-500" : "hover:ring-1 hover:ring-teal-300"
      }`}
    >
      {children}
    </div>
  );
}

export default function PaymentCollectionReport({ onBack }) {
  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIso());
  const [type, setType] = useState("");
  const [mode, setMode] = useState(""); // "" | "Cash" | "UPI" | "Card"
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setPage(1);
    try {
      setData(await getPaymentCollectionReportApi({ dateFrom, dateTo, type }));
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, type]);

  useEffect(() => {
    load();
  }, [load]);

  function selectMode(m) {
    setMode((prev) => (prev === m ? "" : m)); // click again to clear
    setPage(1);
  }

  const s = data?.summary;
  const allOrders = data?.orders || [];
  const orders = mode ? allOrders.filter((o) => o.mode_label === mode) : allOrders;
  const byMode = data?.by_mode || [];
  // When a type filter is active, only show that type's row.
  const byType = (data?.by_type || []).filter((r) => !type || r.key === type);
  const hasEstimated = orders.some((o) => o.estimated);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const pagedOrders = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Exports use ALL orders of the selected mode, not just the visible page.
  const headers = ["Order No", "Patient", "Type", "Mode", "Date", "Amount"];
  const csvRows = orders.map((o) => [
    o.order_no,
    o.patient_name,
    o.type === "home_collection" ? "Home Collection" : "Lab",
    o.mode_label,
    o.date,
    o.amount,
  ]);
  const modeSuffix = mode ? ` (${mode})` : "";

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[
          { label: "From", value: dateFrom, onChange: (v) => v && setDateFrom(v), max: dateTo },
          { label: "To", value: dateTo, onChange: (v) => v && setDateTo(v), max: todayIso() },
        ]}
        onExportCsv={() => exportToCsv(`payment-collection-${dateFrom}-to-${dateTo}${mode ? `-${mode.toLowerCase()}` : ""}`, headers, csvRows)}
        onExportPdf={() => exportToPdf(`Payment Collection${modeSuffix} — ${dateFrom} to ${dateTo}`, headers, csvRows)}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClickableCard active={mode === ""} onClick={() => selectMode("")}>
          <StatCard label="Total Collected" value={loading ? "—" : formatCurrency(s?.total_collected)} icon={Wallet} color="teal" />
        </ClickableCard>
        <ClickableCard active={mode === "Cash"} onClick={() => selectMode("Cash")}>
          <StatCard label="Cash" value={loading ? "—" : formatCurrency(s?.cash)} icon={Banknote} color="green" />
        </ClickableCard>
        <ClickableCard active={mode === "UPI"} onClick={() => selectMode("UPI")}>
          <StatCard label="UPI" value={loading ? "—" : formatCurrency(s?.upi)} icon={Smartphone} color="blue" />
        </ClickableCard>
        <ClickableCard active={mode === "Card"} onClick={() => selectMode("Card")}>
          <StatCard label="Card" value={loading ? "—" : formatCurrency(s?.card)} icon={CreditCard} color="amber" />
        </ClickableCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SummaryTable title="By payment mode" labelHeader="Mode" rows={byMode} labelKey="mode" loading={loading} />
        <SummaryTable title="By order type" labelHeader="Type" rows={byType} labelKey="type" loading={loading} />
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Payments collected{mode ? ` — ${mode} only` : ""}
          </h3>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                {["Order", "Patient", "Type", "Mode", "Date", "Amount"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No payments collected in this range.</td></tr>
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
                    <td className="px-4 py-3 text-gray-500">{o.mode_label}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {o.date}
                      {o.estimated && <span title="Exact payment date was not recorded"> *</span>}
                    </td>
                    <td className="px-4 py-3 text-green-700">{formatCurrency(o.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {hasEstimated && (
          <p className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">
            * Payment date was not recorded for this order, so the last-updated date is shown.
          </p>
        )}
      </div>
    </div>
  );
}