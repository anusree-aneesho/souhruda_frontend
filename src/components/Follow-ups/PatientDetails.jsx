// src/components/Follow-ups/PatientDetails.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, ChevronDown, PlusCircle } from "lucide-react";
import { getPatientTestHistoryApi } from "../../api/api";
import { useOrderModal } from "../../Context/OrderModalContext";
import { daysAgoIso } from "../Reports/shared/format";

const PAGE_SIZE = 10;

const PERIOD_OPTIONS = [
  { value: "", label: "-", days: null },
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

function Info({ label, value }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-24 shrink-0 text-gray-700">{label}</span>
      <span className="text-gray-900 break-words">: {value || "-"}</span>
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
  const orders = data?.orders || [];
  const lastPage = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const currentPage = Math.min(page, lastPage);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedOrders = orders.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate("/follow-ups")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Follow-ups
      </button>

      <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-6">
        {isLoading && !patient && (
          <p className="text-sm text-gray-400 text-center py-6">Loading…</p>
        )}
        {error && <p className="text-sm text-red-500 text-center py-2">{error}</p>}

        {patient && (
          <>
            <div className="flex items-baseline gap-6 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 uppercase">{patient.name}</h1>
              <p className="text-sm text-gray-600">
                Reg no. : <span className="font-bold text-gray-900">{patient.id}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3 rounded-lg bg-teal-50/60 px-5 py-4">
              <Info label="Age" value={patient.age != null ? `${patient.age} Years` : null} />
              <Info
                label="Gender"
                value={patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : null}
              />
              <Info label="Contact No." value={patient.phone || "NIL"} />
              <Info label="Venue" value={patient.venue} />
              <Info label="Email" value={patient.email} />
              <Info label="Address" value={patient.address} />
            </div>

            <div>
              <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Completed Tests</h2>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      className="appearance-none w-44 rounded-lg border border-gray-200 bg-white pl-3.5 pr-9 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-teal-500 cursor-pointer"
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

                  <button
                    onClick={() => open("order", patient.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 px-4 py-2.5 text-sm font-medium text-white cursor-pointer"
                  >
                    <PlusCircle size={16} /> New Order
                  </button>
                </div>
              </div>

              <div className={`border border-gray-200 rounded-lg overflow-x-auto transition-opacity ${isLoading ? "opacity-50" : ""}`}>
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="bg-gray-50 text-left text-sm font-semibold text-gray-900">
                      <th className="px-4 py-3">Sl.No.</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Prescribed Test</th>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                          No tests found for this patient.
                        </td>
                      </tr>
                    ) : (
                      pagedOrders.map((order, i) => (
                        <tr key={order.orderId} className="border-t border-gray-100 text-sm text-gray-800">
                          <td className="px-4 py-3">{pageStart + i + 1}</td>
                          <td className="px-4 py-3">{formatDate(order.date)}</td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center gap-2"
                              title={order.tests.map((t) => t.name).join(", ")}
                            >
                              <span className="h-5 min-w-5 px-1.5 rounded-full bg-cyan-500 text-white text-[10px] font-semibold flex items-center justify-center">
                                {order.tests.length}
                              </span>
                              {order.tests.length === 1 ? "Test" : "Tests"}
                            </span>
                          </td>
                          <td className="px-4 py-3">{order.orderId}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => navigate(`/lab-orders/${order.orderId}`)}
                              className="inline-flex items-center text-indigo-700 hover:underline cursor-pointer"
                            >
                              View Details <ChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {orders.length > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-3">
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
    </div>
  );
}