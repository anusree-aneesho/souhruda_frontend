// src/components/Follow-ups/PatientDetails.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  PlusCircle,
  User,
  Phone,
  MapPin,
  Mail,
  Home,
  CalendarDays,
} from "lucide-react";
import { getPatientTestHistoryApi } from "../../api/api";
import { useOrderModal } from "../../Context/OrderModalContext";
import { daysAgoIso } from "../Reports/shared/format";

const PAGE_SIZE = 10;

const PERIOD_OPTIONS = [
  { value: "", label: "All time", days: null },
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 3 months", days: 90 },
  { value: "180", label: "Last 6 months", days: 180 },
  { value: "365", label: "Last year", days: 365 },
];

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <span className="h-8 w-8 shrink-0 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-gray-400 tracking-wide uppercase">{label}</p>
        <p className="text-sm font-semibold text-gray-900 break-words">{value || "-"}</p>
      </div>
    </div>
  );
}

export default function PatientDetails() {
  const { patientNumber } = useParams();
  const navigate = useNavigate();
  const { open } = useOrderModal();

  const [period, setPeriod] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const selected = PERIOD_OPTIONS.find((o) => o.value === period);

    getPatientTestHistoryApi({
      patientNumber,
      dateFrom: selected?.days ? daysAgoIso(selected.days) : undefined,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load patient details.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patientNumber, period]);

  // Back to the first page whenever the patient or filter changes.
  useEffect(() => {
    setPage(1);
  }, [patientNumber, period]);

  const patient = data?.patient;
  const summary = data?.summary;
  const orders = data?.orders || [];
  const lastPage = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const currentPage = Math.min(page, lastPage);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedOrders = orders.slice(pageStart, pageStart + PAGE_SIZE);

  const gender = patient?.gender
    ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)
    : null;
  const ageGender =
    patient && (patient.age != null || gender)
      ? [patient.age != null ? `${patient.age} Years` : null, gender].filter(Boolean).join(" · ")
      : null;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => navigate("/follow-ups")}
          className="text-sm text-teal-600 font-medium hover:underline cursor-pointer"
        >
          ← Back to follow-ups
        </button>

        {patient && (
          <button
            onClick={() => open("order", patient.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer"
          >
            <PlusCircle size={16} />
            New Order
          </button>
        )}
      </div>

      {isLoading && !patient && (
        <p className="text-sm text-gray-400 text-center py-10">Loading patient…</p>
      )}
      {error && <p className="text-sm text-red-500 text-center py-4">{error}</p>}

      {patient && (
        <>
          {/* Patient header card */}
          <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="h-1 bg-gradient-to-r from-teal-500 via-teal-600 to-gray-900" />

            <div className="flex flex-col lg:flex-row lg:items-center gap-6 p-6">
              {/* Identity */}
              <div className="flex items-center gap-4 lg:w-[34%] shrink-0">
                <div className="h-14 w-14 shrink-0 rounded-full bg-teal-600 text-white text-xl font-semibold flex items-center justify-center ring-4 ring-teal-50">
                  {(patient.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-gray-900 uppercase truncate">
                    {patient.name}
                  </h1>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-medium">
                      Reg. {patient.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full border border-gray-200 text-gray-600 text-xs">
                      {summary?.orders ?? orders.length} {(summary?.orders ?? orders.length) === 1 ? "order" : "orders"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 lg:border-l lg:border-gray-100 lg:pl-6">
                <InfoItem icon={User} label="Age / Gender" value={ageGender} />
                <InfoItem icon={Phone} label="Contact" value={patient.phone || "NIL"} />
                <InfoItem icon={MapPin} label="Venue" value={patient.venue} />
                <InfoItem icon={Mail} label="Email" value={patient.email} />
                <InfoItem icon={Home} label="Address" value={patient.address} />
                <InfoItem icon={CalendarDays} label="Last visit" value={summary?.last_visit ? formatDate(summary.last_visit) : null} />
              </div>
            </div>
          </div>

          {/* Completed tests card */}
          <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-3 px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Completed Tests ({orders.length})
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Click View Details to open the order and its results
                </p>
              </div>

              <div className="relative">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="appearance-none w-40 rounded-lg border border-gray-200 bg-white pl-3.5 pr-9 py-2 text-sm text-gray-700 focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  {PERIOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            <div className={`overflow-x-auto transition-opacity ${isLoading ? "opacity-50" : ""}`}>
              <table className="w-full min-w-[620px]">
                <thead>
                  <tr className="bg-gray-50 text-left text-[11px] font-medium text-gray-400 tracking-wide uppercase">
                    <th className="px-6 py-3 w-16">#</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Prescribed Test</th>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                        No tests found for this patient.
                      </td>
                    </tr>
                  ) : (
                    pagedOrders.map((order, i) => {
                      const names = order.tests.map((t) => t.name);
                      return (
                        <tr
                          key={order.orderId}
                          className="border-t border-gray-100 text-sm hover:bg-teal-50/40"
                        >
                          <td className="px-6 py-4 text-gray-400">{pageStart + i + 1}</td>
                          <td className="px-4 py-4 text-gray-800">{formatDate(order.date)}</td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-gray-900">
                              <span
                                className="inline-flex items-center gap-2"
                                title={order.tests.map((t) => t.name).join(", ")}
                                >
                                <span className="h-5 min-w-5 px-1.5 rounded-full bg-teal-600 text-white text-[10px] font-semibold flex items-center justify-center">
                                    {order.tests.length}
                                </span>
                                {order.tests.length === 1 ? "Test" : "Tests"}
                                </span>
                            </p>
                            <p
                              className="text-xs text-gray-400 mt-0.5 max-w-[360px] truncate"
                              title={names.join(", ")}
                            >
                              {names.join(", ")}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-gray-800">{order.orderId}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => navigate(`/lab-orders/${order.orderId}`)}
                              className="px-4 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-xs font-medium text-teal-700 hover:bg-teal-100 cursor-pointer"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {orders.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Page {currentPage} of {lastPage} · {orders.length} orders
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                    disabled={currentPage >= lastPage}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}