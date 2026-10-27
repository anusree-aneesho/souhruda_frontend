// src/components/Reports/OutstandingReport.jsx
import { Fragment, useState, useEffect, useCallback } from "react";
import {
  IndianRupee,
  Users,
  ClipboardList,
  Clock,
  ChevronRight,
  ChevronDown,
  FlaskConical,
  Home,
} from "lucide-react";
import StatCard from "../common/StatCard";
import ReportToolbar from "./shared/ReportToolbar";
import Pagination from "./shared/Pagination";
import { formatCurrency } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import { getOutstandingReportApi } from "../../api/api";

const TYPE_OPTIONS = [
  { value: "", label: "All orders" },
  { value: "lab", label: "Lab orders" },
  { value: "home_collection", label: "Home collection" },
];

const PATIENTS_PER_PAGE = 10; // patient rows per page
const ORDERS_PER_PAGE = 10; // orders per page inside an opened patient

const ORDER_STATUS_LABEL = {
  pending: "Pending",
  sample_collected: "Sample Collected",
  completed: "Completed",
};

function Pills({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
            value === opt.value
              ? "bg-teal-600 text-white border-teal-600"
              : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function AgeBadge({ days }) {
  const cls =
    days > 30
      ? "bg-red-50 text-red-700"
      : days > 7
      ? "bg-amber-50 text-amber-700"
      : "bg-gray-100 text-gray-600";
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {days === 0 ? "Today" : `${days}d`}
    </span>
  );
}

export default function OutstandingReport({ onBack }) {
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [orderFilter, setOrderFilter] = useState({}); // patient_id -> "unpaid" | "paid" | "all"
  const [page, setPage] = useState(1);
  const [orderPage, setOrderPage] = useState({}); // patient_id -> page of that patient's orders
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getOutstandingReportApi({ type });
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data?.summary;
  const aging = summary?.aging;
  const byType = summary?.by_type;

  const q = search.trim().toLowerCase();
  const patients = (data?.patients || []).filter((p) => {
    if (!q) return true;
    return (
      p.patient_name?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      String(p.patient_number ?? "").toLowerCase().includes(q) ||
      p.orders.some((o) => String(o.order_no).toLowerCase().includes(q))
    );
  });

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  const setFilterFor = (id, value) => {
    setOrderFilter((prev) => ({ ...prev, [id]: value }));
    setOrderPage((prev) => ({ ...prev, [id]: 1 }));
  };

  // Back to the first page whenever the list itself changes.
  useEffect(() => {
    setPage(1);
  }, [search, type]);

  const totalPages = Math.max(1, Math.ceil(patients.length / PATIENTS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pagedPatients = patients.slice((safePage - 1) * PATIENTS_PER_PAGE, safePage * PATIENTS_PER_PAGE);

  const headers = [
    "Patient",
    "Phone",
    "Order No",
    "Type",
    "Ordered On",
    "Age (days)",
    "Billed",
    "Paid",
    "Balance",
  ];
  const csvRows = patients.flatMap((p) =>
    p.orders.filter((o) => o.payment_state === "unpaid").map((o) => [
      p.patient_name,
      p.phone ?? "",
      o.order_no,
      o.type === "home_collection" ? o.hc_code || "Home Collection" : "Lab",
      o.ordered_on,
      o.days,
      o.billed,
      o.paid,
      o.balance,
    ])
  );

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[]}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search patient, phone, order..."
        onExportCsv={() => exportToCsv("outstanding-report", headers, csvRows)}
        onExportPdf={() => exportToPdf("Pending / Outstanding", headers, csvRows)}
      />

      <div className="space-y-3">
        <Pills options={TYPE_OPTIONS} value={type} onChange={setType} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {data?.as_of && (
        <p className="text-xs text-gray-400">
          As of {data.as_of} · covers every order that still has a balance, whatever its date
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Outstanding"
          value={loading ? "—" : formatCurrency(summary?.total_outstanding)}
          icon={IndianRupee}
          color="amber"
        />
        <StatCard
          label="Patients with Balance"
          value={loading ? "—" : summary?.patients ?? 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Orders Unpaid"
          value={loading ? "—" : summary?.orders ?? 0}
          icon={ClipboardList}
          color="purple"
        />
        <StatCard
          label="Oldest Balance"
          value={loading ? "—" : summary?.orders ? `${summary.oldest_days} days` : "—"}
          icon={Clock}
          color="teal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">How old is the balance</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "0–7 days", value: aging?.d0_7, cls: "text-gray-900" },
              { label: "8–30 days", value: aging?.d8_30, cls: "text-amber-700" },
              { label: "31+ days", value: aging?.d31_plus, cls: "text-red-700" },
            ].map((b) => (
              <div key={b.label} className="rounded-lg bg-gray-50 py-3">
                <p className="text-xs text-gray-500 mb-1">{b.label}</p>
                <p className={`text-base font-semibold ${b.cls}`}>
                  {loading ? "—" : formatCurrency(b.value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Lab vs Home Collection</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <FlaskConical size={13} className="text-teal-600" /> Lab · {byType?.lab?.orders ?? 0} orders
              </p>
              <p className="text-base font-semibold text-gray-900">
                {loading ? "—" : formatCurrency(byType?.lab?.outstanding)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <Home size={13} className="text-purple-500" /> Home collection ·{" "}
                {byType?.home_collection?.orders ?? 0} orders
              </p>
              <p className="text-base font-semibold text-gray-900">
                {loading ? "—" : formatCurrency(byType?.home_collection?.outstanding)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-4 py-3 w-8" />
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Billed</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Balance</th>
                <th className="px-4 py-3 font-medium">Oldest</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No outstanding balances.
                  </td>
                </tr>
              ) : (
                pagedPatients.map((p) => {
                  const open = !!expanded[p.patient_id];
                  const f = orderFilter[p.patient_id] || "unpaid";
                  const showPaidCol = f !== "unpaid"; // Paid is always ₹0 for unpaid orders
                  const filteredOrders = p.orders.filter((o) => f === "all" || o.payment_state === f);
                  const orderTotalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
                  const orderCurrentPage = Math.min(orderPage[p.patient_id] || 1, orderTotalPages);
                  const visibleOrders = filteredOrders.slice(
                    (orderCurrentPage - 1) * ORDERS_PER_PAGE,
                    orderCurrentPage * ORDERS_PER_PAGE
                  );
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
                          <p className="text-gray-900">{p.patient_name}</p>
                          {p.patient_number && (
                            <p className="text-xs text-gray-400">{p.patient_number}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{p.phone || "—"}</td>
                        <td className="px-4 py-3 text-gray-500">{p.orders_count}</td>
                        <td className="px-4 py-3 text-gray-500">{formatCurrency(p.billed)}</td>
                        <td className="px-4 py-3 text-green-700">{formatCurrency(p.paid)}</td>
                        <td className="px-4 py-3 font-semibold text-amber-700">
                          {formatCurrency(p.outstanding)}
                        </td>
                        <td className="px-4 py-3">
                          <AgeBadge days={p.oldest_days} />
                        </td>
                      </tr>

                      {open && (
                        <tr className="border-b border-gray-50 bg-gray-50/60">
                          <td />
                          <td colSpan={7} className="px-4 py-3">
                            <div className="flex flex-wrap gap-2 mb-3">
                              {[
                                { value: "all", label: `All (${p.orders_count + p.paid_orders_count})` },
                                { value: "paid", label: `Paid (${p.paid_orders_count})` },
                                { value: "unpaid", label: `Unpaid (${p.orders_count})` },
                              ].map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setFilterFor(p.patient_id, opt.value)}
                                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                                    f === opt.value
                                      ? "bg-teal-600 text-white border-teal-600"
                                      : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left text-gray-500">
                                  <th className="py-1.5 font-medium">Order</th>
                                  <th className="py-1.5 font-medium">Type</th>
                                  <th className="py-1.5 font-medium">Ordered</th>
                                  <th className="py-1.5 font-medium">Status</th>
                                  <th className="py-1.5 font-medium">Billed</th>
                                  {showPaidCol && <th className="py-1.5 font-medium">Paid</th>}
                                  <th className="py-1.5 font-medium">Balance</th>
                                  <th className="py-1.5 font-medium">Age</th>
                                </tr>
                              </thead>
                              <tbody>
                                {visibleOrders.map((o) => (
                                  <tr key={o.order_no} className="border-t border-gray-100">
                                    <td className="py-1.5 text-gray-900">{o.order_no}</td>
                                    <td className="py-1.5 text-gray-500">
                                      {o.type === "home_collection" ? o.hc_code || "Home Collection" : "Lab"}
                                    </td>
                                    <td className="py-1.5 text-gray-500">{o.ordered_on}</td>
                                    <td className="py-1.5 text-gray-500">
                                      {ORDER_STATUS_LABEL[o.status] || o.status}
                                    </td>
                                    <td className="py-1.5 text-gray-500">{formatCurrency(o.billed)}</td>
                                    {showPaidCol && (
                                      <td className="py-1.5 text-green-700">{formatCurrency(o.paid)}</td>
                                    )}
                                    <td className="py-1.5 font-medium">
                                      {o.payment_state === "paid" ? (
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                                          Paid
                                        </span>
                                      ) : (
                                        <span className="text-amber-700">{formatCurrency(o.balance)}</span>
                                      )}
                                    </td>
                                    <td className="py-1.5">
                                      {o.payment_state === "paid" ? (
                                        <span className="text-gray-300">—</span>
                                      ) : (
                                        <AgeBadge days={o.days} />
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {orderTotalPages > 1 && (
                              <div className="flex justify-end pt-3">
                                <Pagination
                                  page={orderCurrentPage}
                                  totalPages={orderTotalPages}
                                  onPageChange={(n) => setOrderPage((prev) => ({ ...prev, [p.patient_id]: n }))}
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-end py-3 border-t border-gray-100">
            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}