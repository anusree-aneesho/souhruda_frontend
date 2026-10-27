// src/components/Reports/PendingOutstandingReport.jsx
import { useState, useEffect, useCallback, Fragment } from "react";
import { Search, ChevronRight, ChevronDown, IndianRupee, Users, ClipboardList } from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import Pagination from "./shared/Pagination";
import { formatCurrency, todayIso, daysAgoIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getPendingOutstandingReportApi } from "../../api/api";

const PAGE_SIZE = 10;

const TYPE_OPTIONS = [
  { value: "", label: "All orders" },
  { value: "lab", label: "Lab orders" },
  { value: "home_collection", label: "Home collection" },
];

function TypeBadge({ o }) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        o.type === "home_collection" ? "bg-purple-50 text-purple-700" : "bg-teal-50 text-teal-700"
      }`}
    >
      {o.type === "home_collection" ? o.hc_code || "Home Collection" : "Lab"}
    </span>
  );
}

export default function PendingOutstandingReport({ onBack }) {
  const [type, setType] = useState("");
  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIso());
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(() => new Set());

  // Wait for typing to pause before hitting the API.
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setPage(1);
    setExpanded(new Set());
    try {
      setData(await getPendingOutstandingReportApi({ type, q, dateFrom, dateTo }));
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [type, q, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const s = data?.summary;
  const patients = data?.patients || [];

  const totalPages = Math.max(1, Math.ceil(patients.length / PAGE_SIZE));
  const paged = patients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Exports: one row per unpaid order, all patients (not just this page).
  const headers = ["Patient", "Patient No", "Phone", "Order No", "Type", "Order Date", "Days", "Amount Due"];
  const csvRows = patients.flatMap((p) =>
    p.order_list.map((o) => [
      p.patient_name,
      p.patient_number,
      p.phone,
      o.order_no,
      o.type === "home_collection" ? "Home Collection" : "Lab",
      o.date,
      o.days,
      o.amount,
    ])
  );

  const rangeLabel = ` (${dateFrom} to ${dateTo})`;
  const isDefaultRange = dateFrom === daysAgoIso(30) && dateTo === todayIso();

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[
          {
            label: "Order date from",
            value: dateFrom,
            onChange: (v) => v && setDateFrom(v),
            max: dateTo || todayIso(),
          },
          {
            label: "To",
            value: dateTo,
            onChange: (v) => v && v <= todayIso() && setDateTo(v),
            min: dateFrom,
            max: todayIso(),
          },
        ]}
        onExportCsv={() => exportToCsv("pending-outstanding", headers, csvRows)}
        onExportPdf={() => exportToPdf(`Pending / Outstanding${rangeLabel}`, headers, csvRows)}
      />

      <div className="flex flex-wrap items-center gap-3">
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
          {!isDefaultRange && (
            <button
              type="button"
              onClick={() => {
                setDateFrom(daysAgoIso(30));
                setDateTo(todayIso());
              }}
              className="px-4 py-1.5 rounded-full text-sm border border-teal-600 text-teal-700 hover:bg-teal-50"
            >
              Last 30 days
            </button>
          )}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, number, phone…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Outstanding" value={loading ? "—" : formatCurrency(s?.total_outstanding)} icon={IndianRupee} color="amber" />
        <StatCard label="Patients with Balance" value={loading ? "—" : s?.patients ?? 0} icon={Users} color="blue" />
        <StatCard label="Unpaid Orders" value={loading ? "—" : s?.orders ?? 0} icon={ClipboardList} color="teal" />
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Outstanding by patient</h3>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-4 py-3 w-8"></th>
                {["Patient", "Phone", "Unpaid orders", "Oldest", "Amount due"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No outstanding balances.</td></tr>
              ) : (
                paged.map((p) => {
                  const open = expanded.has(p.patient_id);
                  return (
                    <Fragment key={p.patient_id}>
                      <tr
                        onClick={() => toggle(p.patient_id)}
                        className="border-b border-gray-50 cursor-pointer hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-gray-400">
                          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-900">{p.patient_name}</div>
                          <div className="text-xs text-gray-400">{p.patient_number}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{p.phone || "—"}</td>
                        <td className="px-4 py-3 text-gray-500">{p.orders}</td>
                        <td className="px-4 py-3 text-gray-500">{p.oldest_days}d</td>
                        <td className="px-4 py-3 font-medium text-amber-700">{formatCurrency(p.outstanding)}</td>
                      </tr>

                      {open &&
                        p.order_list.map((o) => (
                          <tr key={o.order_no} className="border-b border-gray-50 bg-gray-50/60 text-xs">
                            <td></td>
                            <td className="px-4 py-2 text-gray-700">
                              {o.order_no} <TypeBadge o={o} />
                            </td>
                            <td className="px-4 py-2 text-gray-500">{o.date}</td>
                            <td className="px-4 py-2 text-gray-500"></td>
                            <td className="px-4 py-2 text-gray-500">{o.days}d</td>
                            <td className="px-4 py-2 text-amber-700">{formatCurrency(o.amount)}</td>
                          </tr>
                        ))}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}