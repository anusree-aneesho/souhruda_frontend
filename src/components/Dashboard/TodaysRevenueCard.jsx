// src/components/Dashboard/TodaysRevenueCard.jsx
import { useState } from "react";
import { CheckCircle2, Clock, IndianRupee } from "lucide-react";
import StatCard from "../common/StatCard";
import ModalShell from "../common/Modal/ModalShell";

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const plural = (n) => `${n} ${n === 1 ? "order" : "orders"}`;

const PAGE_SIZE = 10;

function formatTime(raw) {
  if (!raw) return "—";
  let normalized = String(raw).replace(" ", "T");
  normalized = normalized.replace(/([+-]\d{2})$/, "$1:00");
  const hasZone = /(Z|[+-]\d{2}:\d{2})$/i.test(normalized);
  const d = new Date(hasZone ? normalized : normalized + "Z");
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const toTime = (raw) => new Date(String(raw || "").replace(" ", "T")).getTime() || 0;

// "Lab 2 · Home 1" for a group of items
const splitLabel = (items) => {
  const home = items.filter((i) => i.isHomeCollection).length;
  const lab = items.length - home;
  return `Lab ${lab} · Home ${home}`;
};

/**
 * revenue = {
 *   paid:    { amount, orders, items: [{ orderNo, patientName, orderedAt, paidAt?, earlierOrder?, isHomeCollection, status, amount }] },
 *   pending: { amount, orders, items: [...] },
 *   total
 * }
 */
export default function TodaysRevenueCard({ revenue }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("paid"); // "paid" | "pending"
  const [page, setPage] = useState(1);

  const paid = revenue?.paid ?? { amount: 0, orders: 0, items: [] };
  const pending = revenue?.pending ?? { amount: 0, orders: 0, items: [] };
  const total = revenue?.total ?? Number(paid.amount) + Number(pending.amount);

  const isPaidView = tab === "paid";
  const group = isPaidView ? paid : pending;

  // newest first (by payment time when known)
  const sorted = [...group.items].sort(
    (a, b) => toTime(b.paidAt || b.orderedAt) - toTime(a.paidAt || a.orderedAt)
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <>
      {/* Main card — click to see details */}
      <div
        className="cursor-pointer"
        onClick={() => {
          setTab("paid");
          setPage(1);
          setOpen(true);
        }}
      >
        <StatCard
          label="Today's Revenue"
          value={money(paid.amount)}
          sublabel={`${plural(paid.orders)} paid · ${plural(pending.orders)} pending`}
          icon={IndianRupee}
          color="purple"
        />
      </div>

      {open && (
        <ModalShell
          title="Today's Revenue"
          onClose={() => setOpen(false)}
          maxWidth="max-w-3xl"
        >
          <div className="px-6 py-5">
            {/* Total */}
            <div className="mb-4 flex items-center justify-between rounded-lg bg-violet-50 px-4 py-3 text-violet-700">
              <span className="text-sm font-medium">
                Total ({plural(paid.orders + pending.orders)})
              </span>
              <span className="text-lg font-bold">{money(total)}</span>
            </div>

            {/* Paid / Pending tabs */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setTab("paid");
                  setPage(1);
                }}
                className={`cursor-pointer rounded-xl border p-3 text-left transition ${
                  isPaidView
                    ? "border-green-400 bg-green-50 ring-2 ring-green-200"
                    : "border-green-200 bg-white hover:bg-green-50"
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
                  <CheckCircle2 size={14} /> Paid
                </span>
                <p className="mt-1 text-xl font-bold text-green-700">{money(paid.amount)}</p>
                <p className="text-[11px] text-green-700/70">
                  {plural(paid.orders)} · {splitLabel(paid.items)}
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab("pending");
                  setPage(1);
                }}
                className={`cursor-pointer rounded-xl border p-3 text-left transition ${
                  !isPaidView
                    ? "border-orange-400 bg-orange-50 ring-2 ring-orange-200"
                    : "border-orange-200 bg-white hover:bg-orange-50"
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-700">
                  <Clock size={14} /> Pending
                </span>
                <p className="mt-1 text-xl font-bold text-orange-700">{money(pending.amount)}</p>
                <p className="text-[11px] text-orange-700/70">
                  {plural(pending.orders)} · {splitLabel(pending.items)}
                </p>
              </button>
            </div>

            {/* Orders for selected tab (10 per page) */}
            {group.items.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No {isPaidView ? "paid" : "pending"} orders today.
              </p>
            ) : (
              <div className="max-h-[45vh] overflow-x-auto overflow-y-auto">
                <table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-2.5 text-xs font-medium tracking-wide text-gray-400">ORDER</th>
                      <th className="py-2.5 text-xs font-medium tracking-wide text-gray-400">PATIENT</th>
                      <th className="py-2.5 text-xs font-medium tracking-wide text-gray-400">TIME</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium tracking-wide text-gray-400">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item) => (
                      <tr key={item.orderNo} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-sm font-medium text-teal-700">
                          {item.orderNo}
                          <span
                            className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              item.isHomeCollection
                                ? "bg-sky-50 text-sky-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {item.isHomeCollection ? "Home" : "Lab"}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-gray-900">{item.patientName || "—"}</td>
                        <td className="py-3 text-sm text-gray-500">
                          {formatTime(item.paidAt || item.orderedAt)}
                          {item.earlierOrder && (
                            <span className="ml-2 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                              Earlier order
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {money(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {sorted.length > PAGE_SIZE && (
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                    className="cursor-pointer rounded border border-gray-200 px-2.5 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage(currentPage + 1)}
                    className="cursor-pointer rounded border border-gray-200 px-2.5 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </ModalShell>
      )}
    </>
  );
}